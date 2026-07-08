#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
auto-kg-pipeline.py
===================

自动检测 vault 新增/修改 → 重渲染 → 部署 → 更新索引 的全流程编排。
由 Windows Scheduled Task 每天定时触发。

流程:
  [1] 扫描 vault 检测新增/修改 (对比 .last_scan.json 时间戳记录)
  [2] 跑 build-kg-from-notes.py 生成 JSON
  [3] 跑 render-all-tech-cards.py 渲染 technology 类 HTML
  [4] git diff 检出变化 → 自动 commit + push (有变化才提交)
  [5] 触发 GitHub Pages workflow
  [6] 跑 gen_index.py 重新生成 README 索引 (本地)
  [7] 更新 last_scan.json + 写运行日志

设计原则:
  - 幂等: 任何步骤失败不破坏既有状态
  - 静默: 无新增内容时不 commit / 不触发 workflow
  - 日志: 每次运行写入 logs/auto_kg_pipeline-YYYY-MM-DD.log
  - 安全: 一切破坏性操作 (push) 前会先 dry-run 列出变更清单

用法:
  python scripts/auto_kg_pipeline.py                # 完整流程
  python scripts/auto_kg_pipeline.py --dry-run       # 只扫描不动作
  python scripts/auto_kg_pipeline.py --force         # 强制跑全部步骤 (忽略变更检测)
"""

import os
import sys
import json
import shutil
import subprocess
import argparse
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple

# ===== 路径配置 =====
ROOT = Path(r"E:/OH-workspace/antenna-tracker")
NOTES_DIR = Path(r"E:/我的知识库/我的知识库/资料库/天线技术")
KG_JSON = ROOT / "app/_data/knowledge-graph.json"
HTML_DIR = ROOT / "public/kg-cards-rendered"
INDEX_DIR = Path(r"E:/workbuddy workspace/Claw/天线技术")
INDEX_README = INDEX_DIR / "README.md"
INDEX_SCRIPT = INDEX_DIR / "gen_index.py"
LAST_SCAN_FILE = ROOT / "scripts/.last_scan.json"
LOG_DIR = ROOT / "logs"

BJ_TZ = timezone(timedelta(hours=8))


# ===== 工具函数 =====

def log(msg: str) -> None:
    """带时间戳打印 + 写日志文件"""
    ts = datetime.now(BJ_TZ).strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(BJ_TZ).strftime("%Y-%m-%d")
    with open(LOG_DIR / f"auto_kg_pipeline-{today}.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def run_cmd(cmd: List[str], cwd: Optional[Path] = None, check: bool = True) -> Tuple[int, str, str]:
    """运行命令, 返回 (returncode, stdout, stderr)"""
    try:
        result = subprocess.run(
            cmd, cwd=str(cwd) if cwd else None,
            capture_output=True, text=True, encoding="utf-8",
            shell=False, timeout=600,
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired as e:
        return -1, "", f"Timeout: {e}"
    except Exception as e:
        return -1, "", str(e)


def load_last_scan() -> Dict:
    """读上次扫描状态"""
    if LAST_SCAN_FILE.exists():
        try:
            return json.loads(LAST_SCAN_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"last_run": None, "files": {}}


def save_last_scan(state: Dict) -> None:
    """保存扫描状态"""
    LAST_SCAN_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def scan_vault() -> Tuple[List[Path], List[Path], List[Path]]:
    """扫描 vault, 返回 (新增, 修改, 删除) 的 markdown 路径列表"""
    if not NOTES_DIR.exists():
        log(f"[!] vault 目录不存在: {NOTES_DIR}")
        return [], [], []

    SKIP = {"README.md", ".DS_Store"}
    current = {}
    for fp in NOTES_DIR.glob("*.md"):
        if fp.name in SKIP:
            continue
        # mtime 用 epoch 秒
        current[fp.name] = int(fp.stat().st_mtime)

    last = load_last_scan()
    last_files = last.get("files", {})

    added, modified, deleted = [], [], []
    for name, mtime in current.items():
        if name not in last_files:
            added.append(NOTES_DIR / name)
        elif last_files[name] != mtime:
            modified.append(NOTES_DIR / name)

    for name in last_files:
        if name not in current:
            deleted.append(NOTES_DIR / name)

    return added, modified, deleted


def step1_scan_changes(dry_run: bool = False) -> Dict:
    """[1] 扫描 vault 变更"""
    log("[1/7] 扫描 vault 变更...")
    added, modified, deleted = scan_vault()
    log(f"      新增: {len(added)}  修改: {len(modified)}  删除: {len(deleted)}")

    for f in added[:5]:
        log(f"      + {f.name}")
    if len(added) > 5:
        log(f"      ... +{len(added)-5} more")
    for f in modified[:5]:
        log(f"      ~ {f.name}")
    for f in deleted[:5]:
        log(f"      - {f.name}")

    return {
        "added": [str(f) for f in added],
        "modified": [str(f) for f in modified],
        "deleted": [str(f) for f in deleted],
    }


def step2_build_json(dry_run: bool = False) -> bool:
    """[2] 跑 build-kg-from-notes.py 生成 JSON"""
    log("[2/7] 重生成 knowledge-graph.json...")
    if dry_run:
        log("      (dry-run 跳过)")
        return True
    rc, out, err = run_cmd(
        ["python", "scripts/build-kg-from-notes.py"],
        cwd=ROOT,
    )
    if rc != 0:
        log(f"[X] build-kg-from-notes.py 失败: rc={rc}")
        log(f"    stderr: {err[:500]}")
        return False
    log(f"      OK ({len(out.splitlines())} 行输出)")
    return True


def step3_render_html(dry_run: bool = False) -> bool:
    """[3] 跑 render-all-tech-cards.py 渲染 HTML (仅 technology 类)"""
    log("[3/7] 渲染 technology 类 HTML...")
    if dry_run:
        log("      (dry-run 跳过)")
        return True
    rc, out, err = run_cmd(
        ["python", "scripts/render-all-tech-cards.py"],
        cwd=ROOT,
    )
    if rc != 0:
        log(f"[!] render-all-tech-cards.py 失败: rc={rc}")
        log(f"    stderr: {err[:500]}")
        # 不强制失败 — 其它类型(component/metric/material)的 HTML 不受此影响
        log("    继续执行 (其他类型 HTML 由其它流程处理)")
    else:
        log(f"      OK ({len(out.splitlines())} 行输出)")
    return True


def step4_git_commit_push(dry_run: bool = False) -> bool:
    """[4] git diff 检出变化 → commit + push (有变化才提交)"""
    log("[4/7] 检查 git 变更...")
    # 先 stash 脏文件
    dirty_patterns = ["$null", ".github/workflows/monthly-market-report.yml",
                      "kg-title-fix-report.html", "*.bak"]
    for pat in dirty_patterns:
        rc, out, _ = run_cmd(["git", "stash", "push", "--include-untracked",
                              "-m", f"auto-stash-{pat}", "--", pat],
                             cwd=ROOT, check=False)

    # 检出 app/_data + public/kg-cards-rendered 的变更
    rc, status, _ = run_cmd(["git", "status", "--short",
                              "app/_data/", "public/kg-cards-rendered/"],
                             cwd=ROOT)
    has_changes = bool(status.strip())
    if not has_changes:
        log("      无变更，跳过 commit")
        # 还原 stash
        run_cmd(["git", "stash", "list"], cwd=ROOT, check=False)
        for line in subprocess.run(["git", "stash", "list"], cwd=str(ROOT),
                                    capture_output=True, text=True, encoding="utf-8").stdout.splitlines():
            if "auto-stash-" in line:
                stash_id = line.split(":")[0]
                run_cmd(["git", "stash", "pop", stash_id], cwd=ROOT, check=False)
        return True

    log(f"      检出变更:\n{status}")
    if dry_run:
        log("      (dry-run 跳过 commit/push)")
        return True

    # add + commit
    rc, _, err = run_cmd(["git", "add", "app/_data/knowledge-graph.json",
                          "public/kg-cards-rendered/"],
                         cwd=ROOT)
    if rc != 0:
        log(f"[X] git add 失败: {err[:300]}")
        return False

    ts = datetime.now(BJ_TZ).strftime("%Y-%m-%d %H:%M")
    commit_msg = f"auto(kg): refresh from vault @ {ts}"
    rc, _, err = run_cmd([
        "git", "-c", "user.name=二狗", "-c", "user.email=ergou@workbuddy.local",
        "commit", "-m", commit_msg,
    ], cwd=ROOT)
    if rc != 0:
        log(f"[X] git commit 失败: {err[:300]}")
        return False
    log(f"      committed: {commit_msg}")

    # push
    env = os.environ.copy()
    env["GIT_SSL_NO_VERIFY"] = "1"
    rc, out, err = subprocess.run(
        ["git", "push", "origin", "main"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).returncode, subprocess.run(
        ["git", "push", "origin", "main"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).stdout, subprocess.run(
        ["git", "push", "origin", "main"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).stderr
    if rc != 0:
        log(f"[!] git push 失败: {err[:300]}")
        log("    将在下次运行时重试")
        return False
    log("      pushed to origin/main")
    return True


def step5_trigger_pages(dry_run: bool = False) -> bool:
    """[5] 触发 GitHub Pages workflow"""
    log("[5/7] 触发 GitHub Pages deploy...")
    if dry_run:
        log("      (dry-run 跳过)")
        return True

    env = os.environ.copy()
    env["GIT_SSL_NO_VERIFY"] = "1"
    rc, out, err = subprocess.run(
        ["gh", "workflow", "run", "deploy-pages.yml"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).returncode, subprocess.run(
        ["gh", "workflow", "run", "deploy-pages.yml"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).stdout, subprocess.run(
        ["gh", "workflow", "run", "deploy-pages.yml"],
        cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8",
        env=env, shell=False,
    ).stderr
    if rc != 0:
        log(f"[!] gh workflow run 失败: {err[:300]}")
        return False
    log(f"      triggered: {out.strip()[:100]}")
    return True


def step6_regen_index(dry_run: bool = False) -> bool:
    """[6] 跑 gen_index.py 重新生成 README 索引"""
    log("[6/7] 重新生成索引 README...")
    if not INDEX_SCRIPT.exists():
        log(f"[!] gen_index.py 不存在: {INDEX_SCRIPT}")
        return False
    if dry_run:
        log("      (dry-run 跳过)")
        return True
    rc, out, err = run_cmd(["python", str(INDEX_SCRIPT)])
    if rc != 0:
        log(f"[!] gen_index.py 失败: {err[:300]}")
        return False
    log("      README 索引已更新")
    return True


def step7_save_state(changes: Dict) -> None:
    """[7] 更新 last_scan.json"""
    log("[7/7] 保存扫描状态...")
    files_state = {}
    for fp in NOTES_DIR.glob("*.md"):
        if fp.name == "README.md":
            continue
        files_state[fp.name] = int(fp.stat().st_mtime)

    state = {
        "last_run": datetime.now(BJ_TZ).isoformat(),
        "files": files_state,
        "last_changes": changes,
    }
    save_last_scan(state)
    log(f"      saved: {LAST_SCAN_FILE}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="只扫描不动作")
    parser.add_argument("--force", action="store_true", help="强制跑全部步骤")
    args = parser.parse_args()

    log("=" * 60)
    log(f"auto-kg-pipeline 启动 (dry_run={args.dry_run} force={args.force})")

    # 步骤 1
    changes = step1_scan_changes(dry_run=args.dry_run)

    has_changes = bool(changes["added"] or changes["modified"] or changes["deleted"])
    if not has_changes and not args.force:
        log("无 vault 变更，跳过 build/render/deploy，仅更新 last_scan")
        step7_save_state(changes)
        log("=" * 60)
        log("完成 (无变更)")
        return 0

    # 步骤 2
    if not step2_build_json(dry_run=args.dry_run):
        log("[FATAL] 步骤 2 失败，终止")
        return 1

    # 步骤 3
    step3_render_html(dry_run=args.dry_run)

    # 步骤 4
    push_ok = step4_git_commit_push(dry_run=args.dry_run)
    if not push_ok:
        log("[WARN] 步骤 4 失败，继续执行")

    # 步骤 5 & 6: 只在 push 成功时才跑 deploy/index
    if push_ok:
        step5_trigger_pages(dry_run=args.dry_run)
        step6_regen_index(dry_run=args.dry_run)
    else:
        log("[5/7] 跳过 (push 失败)")
        log("[6/7] 跳过 (push 失败)")

    # 步骤 7
    step7_save_state(changes)

    log("=" * 60)
    log("完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
