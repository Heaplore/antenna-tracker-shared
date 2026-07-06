#!/usr/bin/env python3
"""fix_all_empty_rel_cards.py — 给所有『暂无关联笔记』的 64 张卡片注入 rel-card

策略（按优先级）：
  1. 用 KG 节点的 outgoing（最权威）
  2. 用全局 links 反推（被谁反向指向）
  3. 按 tag+title 相似度推荐同 type 节点 fallback

同步写入 public/ 和 out/ 两边（deploy 链需要两边一致）
"""
import json
import re
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
KG_PATH = ROOT / "app/_data/knowledge-graph.json"
PUBLIC_DIR = ROOT / "public/kg-cards-rendered"
OUT_DIR = ROOT / "out/kg-cards-rendered"


def tag_sim(a, b):
    sa, sb = set(a.get("tags", [])), set(b.get("tags", []))
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def title_sim(na, nb):
    pa = re.sub(r"^[^-]+-", "", na)
    pb = re.sub(r"^[^-]+-", "", nb)
    return SequenceMatcher(None, pa, pb).ratio()


def build_recs(node, all_nodes, links):
    """给一个空 outgoing 节点生成推荐关联。"""
    nid = node["id"]
    recs = []
    seen = set()

    # 优先级 1: KG outgoing
    for o in node.get("outgoing", []):
        tgt_id = o.get("targetId") if isinstance(o, dict) else o
        tgt = next((n for n in all_nodes if n["id"] == tgt_id), None)
        if tgt and tgt["id"] not in seen:
            recs.append(tgt)
            seen.add(tgt["id"])

    # 优先级 2: 反向入度（谁指向我）
    for ln in links:
        if ln["target"] == nid:
            src_id = ln["source"]
            src = next((n for n in all_nodes if n["id"] == src_id), None)
            if src and src["id"] not in seen:
                recs.append(src)
                seen.add(src["id"])

    # 优先级 3: tag+title 相似度（兜底，补到 3 个）
    same_type = [n for n in all_nodes if n.get("type") == node.get("type") and n["id"] != nid]
    scored = []
    for cand in same_type:
        if cand["id"] in seen:
            continue
        ts = tag_sim(node, cand) * 0.7
        ns = title_sim(node.get("name", ""), cand.get("name", "")) * 0.3
        scored.append((ts + ns, cand))
    scored.sort(key=lambda x: -x[0])
    for _, c in scored:
        if len(recs) >= 3:
            break
        if c["id"] in seen:
            continue
        recs.append(c)
        seen.add(c["id"])

    return recs[:3]


def build_rel_card(target_node):
    """生成单条 rel-card HTML：href 用 node.id，不是 filename。"""
    ntype = target_node.get("type", "technology")
    name = target_node.get("name", target_node["id"])
    # label 前缀用 type 中文
    TYPE_LABEL = {"technology": "技术概念", "metric": "指标术语", "component": "零部件", "material": "材料"}
    label = f'{TYPE_LABEL.get(ntype, ntype)}-{name}'
    href = f'/antenna-tracker/kg-cards-rendered/{target_node["id"]}.html'
    return (
        f'<a class="rel-card" href="{href}">'
        f'<span class="ico">→</span>'
        f'<span>{label}</span>'
        f'</a>'
    )


def patch_one(html_path, recs):
    text = html_path.read_text(encoding="utf-8")
    if "暂无关联笔记" not in text:
        return False, "no_empty_marker"

    rel_html = "\n      ".join(build_rel_card(r) for r in recs)
    block = f'<div class="related-grid">\n      {rel_html}\n    </div>'

    pattern = re.compile(
        r'<div class="related-grid">\s*<span[^>]*>暂无关联笔记</span>\s*</div>',
        re.DOTALL,
    )
    new_text, n = pattern.subn(block, text)
    if n == 0:
        return False, "regex_no_match"

    html_path.write_text(new_text, encoding="utf-8")
    return True, len(recs)


def main():
    if not KG_PATH.exists():
        sys.exit(f"❌ KG missing: {KG_PATH}")

    kg = json.loads(KG_PATH.read_text(encoding="utf-8"))
    nodes = kg["nodes"]
    links = kg.get("links", [])

    # 找所有 HTML 中显示空的节点
    empty_files = []
    for d in [PUBLIC_DIR, OUT_DIR]:
        if not d.exists():
            continue
        for f in d.glob("*.html"):
            if "暂无关联笔记" in f.read_text(encoding="utf-8"):
                empty_files.append(f.stem)
    empty_files = sorted(set(empty_files))
    print(f"🎯 需要修复的 HTML: {len(empty_files)} 个")

    # 对应节点（id 等于 filename basename）
    id_to_node = {n["id"]: n for n in nodes}
    print(f"📊 KG 节点: {len(nodes)}, 链接: {len(links)}")

    stats = {"ok": 0, "fail": 0, "details": []}
    for nid in empty_files:
        if nid not in id_to_node:
            stats["details"].append((nid, 0, "node_not_in_kg"))
            continue
        node = id_to_node[nid]
        recs = build_recs(node, nodes, links)
        if not recs:
            stats["details"].append((nid, 0, "no_recs"))
            continue

        # 同时写 public/ 和 out/
        success_per_dir = []
        for d in [PUBLIC_DIR, OUT_DIR]:
            target = d / f"{nid}.html"
            if not target.exists():
                success_per_dir.append((d.name, "no_file"))
                continue
            ok, info = patch_one(target, recs)
            success_per_dir.append((d.name, "ok" if ok else info))

        if all("ok" in r[1] for r in success_per_dir):
            stats["ok"] += 1
        else:
            stats["fail"] += 1
        stats["details"].append((nid, len(recs), success_per_dir))

    print(f"\n✅ 成功: {stats['ok']}/{len(empty_files)}")
    print(f"❌ 失败: {stats['fail']}")

    # 抽样打印 3 个
    print("\n--- 抽样:")
    for nid, n_recs, status in stats["details"][:3]:
        print(f"  {nid[:50]}... → {n_recs} 个 rel-card | {status}")


if __name__ == "__main__":
    main()
