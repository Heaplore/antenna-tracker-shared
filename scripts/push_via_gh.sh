#!/usr/bin/env bash
# push_via_gh.sh
# ==============
#
# 用意: 完全绕开 git 协议, 通过 GitHub REST API 把本地 commit 推上去。
# 适用: git push 慢/卡/被代理卡死时, 用 gh CLI (已登录 Heaplore, admin:repo)
# 原理: 把本地 HEAD 内容拆成 N 个 blob + tree + commit + update main ref
#
# 前置:
#   - gh auth status 已登录 Heaplore
#   - 当前 cwd 是仓库根
#   - python3 在 PATH (Windows 装 jq 麻烦, 用 Python 拼 JSON)
#
# 用法:
#   bash scripts/push_via_gh.sh                  # dry-run, 推本地 HEAD
#   bash scripts/push_via_gh.sh --apply          # 真推
#   bash scripts/push_via_gh.sh <sha> --apply    # 推指定 commit
#
# 安全:
#   - 默认 dry-run, 打印会创建的 blob/tree/commit, 不真推
#   - 加 --apply 才真推

set -euo pipefail

REPO="Heaplore/antenna-tracker"
APPLY=0
TARGET_SHA=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) TARGET_SHA="$1"; shift ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

# 临时文件统一管理 - 用仓库下 .push_tmp_xxx (Windows 友好, 避免 /tmp 路径问题)
B64_TMP=".push_tmp_${$}_b64"
BODY_TMP=".push_tmp_${$}_body"
TREE_BODY=".push_tmp_${$}_tree"
COMMIT_BODY=".push_tmp_${$}_commit"
trap "rm -f $B64_TMP $BODY_TMP $TREE_BODY $COMMIT_BODY" EXIT

if [[ -z "$TARGET_SHA" ]]; then
  TARGET_SHA=$(git rev-parse HEAD)
fi

echo "==> 目标 commit: $TARGET_SHA"
echo "==> 父 commit:   $(git rev-parse "$TARGET_SHA^")"
echo "==> base main:   $(gh api repos/$REPO/git/ref/heads/main --jq .object.sha)"
echo

# 1. 拿 commit 元数据
MSG=$(git log -1 --format=%B "$TARGET_SHA")
PARENT=$(git rev-parse "$TARGET_SHA^")
AUTHOR_NAME=$( git log -1 --format=%an "$TARGET_SHA")
AUTHOR_EMAIL=$( git log -1 --format=%ae "$TARGET_SHA")
AUTHOR_DATE=$( git log -1 --format=%aI "$TARGET_SHA")

# 2. 枚举本次 commit 改动的文件 (vs parent)
echo "==> 本次改动文件:"
git diff-tree --no-commit-id --name-only -r "$TARGET_SHA"
echo

# 3. base tree
BASE_TREE_SHA=$(gh api repos/$REPO/git/commits/"$PARENT" --jq .tree.sha 2>/dev/null || echo "")
if [[ -z "$BASE_TREE_SHA" ]]; then
  echo "WARN: 拿不到 parent tree, 用 empty tree"
  BASE_TREE_SHA=""
fi

# 4. 为每个改动文件创建 blob
declare -A BLOB_SHAS
echo "==> 创建 blob:"
for f in $(git diff-tree --no-commit-id --name-only -r "$TARGET_SHA"); do
  echo -n "    $f ... "
  if [[ -f "$f" ]]; then
    # 写 JSON body 到临时文件, 避免 Argument list too long
    python3 -c "
import json, base64, sys
with open(r'$f', 'rb') as fh:
    data = fh.read()
print(json.dumps({'content': base64.b64encode(data).decode('ascii'), 'encoding': 'base64'}))
" > "$BODY_TMP"
    if [[ $APPLY -eq 1 ]]; then
      SHA=$(gh api -X POST repos/$REPO/git/blobs --input "$BODY_TMP" --jq .sha)
    else
      SHA="<BLOB_SHA_DRYRUN>"
    fi
  else
    echo "SKIP (file deleted)"
    continue
  fi
  BLOB_SHAS["$f"]=$SHA
  echo "$SHA"
done
echo

# 5. 构造 tree (递归)
echo "==> 构造 tree:"
# 用 Python 拼 JSON tree
python3 -c "
import json, sys
tree_entries = []
modes = {}
import subprocess
for f in sys.argv[1:]:
    p = subprocess.run(['git', 'ls-tree', 'HEAD', '--', f], capture_output=True, text=True)
    mode = p.stdout.split()[0] if p.stdout.strip() else '100644'
    tree_entries.append({
        'path': f.replace('\\\\', '/'),
        'mode': mode,
        'type': 'blob',
        'sha': '${BLOB_SHAS[$f]}',
    })
base = '$BASE_TREE_SHA'
out = {'base_tree': base, 'tree': tree_entries}
print(json.dumps(out, ensure_ascii=False))
" "${!BLOB_SHAS[@]}" > "$TREE_BODY"

# 第二个真实版本
python3 -c "
import json, sys, subprocess
files_shas = {}
for f in sys.argv[1:]:
    # f 格式: path=SHA
    path, sha = f.split('=', 1)
    p = subprocess.run(['git', 'ls-tree', 'HEAD', '--', path], capture_output=True, text=True)
    mode = p.stdout.split()[0] if p.stdout.strip() else '100644'
    files_shas[path] = (mode, sha)
tree = [{'path': p.replace('\\\\', '/'), 'mode': m, 'type': 'blob', 'sha': s} for p, (m, s) in files_shas.items()]
out = {'base_tree': '$BASE_TREE_SHA', 'tree': tree}
print(json.dumps(out, ensure_ascii=False))
" $(for f in "${!BLOB_SHAS[@]}"; do echo "$f=${BLOB_SHAS[$f]}"; done) > "$TREE_BODY"

echo "    body 长度: $(wc -c < "$TREE_BODY") bytes"
if [[ $APPLY -eq 1 ]]; then
  NEW_TREE_SHA=$(gh api -X POST repos/$REPO/git/trees --input "$TREE_BODY" --jq .sha)
  echo "    new tree sha: $NEW_TREE_SHA"
else
  NEW_TREE_SHA="<TREE_SHA_DRYRUN>"
  echo "    (dry-run, 不调用 API)"
fi
echo

# 6. 创建 commit
echo "==> 创建 commit:"
if [[ $APPLY -eq 1 ]]; then
  python3 -c "
import json
print(json.dumps({
    'message': '''$MSG''',
    'parents': ['$PARENT'],
    'tree': '$NEW_TREE_SHA',
    'author': {
        'name': '''$AUTHOR_NAME''',
        'email': '''$AUTHOR_EMAIL''',
        'date': '$AUTHOR_DATE',
    },
}, ensure_ascii=False))
" > "$COMMIT_BODY"
  NEW_COMMIT_SHA=$(gh api -X POST repos/$REPO/git/commits --input "$COMMIT_BODY" --jq .sha)
  echo "    new commit sha: $NEW_COMMIT_SHA"
else
  NEW_COMMIT_SHA="<COMMIT_SHA_DRYRUN>"
  echo "    (dry-run, 不调用 API)"
fi
echo

# 7. 更新 main ref
if [[ $APPLY -eq 1 ]]; then
  echo "==> 更新 main ref 到 $NEW_COMMIT_SHA"
  # 用 --input JSON body, force=true (远端 main 已有 cc0481cd, 本地 9fba549a 不是它的子, 必须 force)
  printf '{"sha": "%s", "force": true}\n' "$NEW_COMMIT_SHA" > "$TREE_BODY"
  gh api -X PATCH repos/$REPO/git/refs/heads/main --input "$TREE_BODY"
  echo
  echo "✓ 推送完成: $NEW_COMMIT_SHA"
  echo "  https://github.com/$REPO/commit/$NEW_COMMIT_SHA"
else
  echo "==> DRY-RUN 模式, 没真推"
  echo "  确认无误加 --apply 真推:"
  echo "    bash scripts/push_via_gh.sh --apply"
fi
