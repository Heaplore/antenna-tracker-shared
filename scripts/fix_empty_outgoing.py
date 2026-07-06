#!/usr/bin/env python3
"""fix_empty_outgoing.py — 修复 knowledge-graph.json 里 outgoing 为空的节点

策略：
  1. 用全局 links 数组同步 outgoing（source → target 完整双向补齐）
  2. 对仍为空的，按"同 type + 共享 tag"找最相似的 3 个节点作为推荐关联

用法：python scripts/fix_empty_outgoing.py [--dry]
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

KG_PATH = Path(r"E:/OH-workspace/antenna-tracker/app/_data/knowledge-graph.json")


def step1_sync_from_links(nodes, links):
    """把全局 links 数组里 source→target 反向写到 source 节点的 outgoing。"""
    source_to_targets = defaultdict(set)
    for ln in links:
        source_to_targets[ln["source"]].add(ln["target"])

    fixed = 0
    for n in nodes:
        if n.get("outgoing"):
            continue
        targets = source_to_targets.get(n["id"], set())
        if not targets:
            continue
        n["outgoing"] = [{"targetId": t, "label": "关联"} for t in sorted(targets)]
        fixed += 1
    return fixed, source_to_targets


def tag_similarity(node_a, node_b):
    """Jaccard 相似度：两个节点共享 tag 的比例。"""
    a, b = set(node_a.get("tags", [])), set(node_b.get("tags", []))
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def title_similarity(a, b):
    """标题相似度（去掉 type 前缀）。"""
    pa = re.sub(r"^[^-]+-", "", a)
    pb = re.sub(r"^[^-]+-", "", b)
    return SequenceMatcher(None, pa, pb).ratio()


def step2_recommend_by_tags(nodes, tag_to_count):
    """对仍空的节点，按 tag+title 相似度推荐 3 个 fallback。"""
    # 同 type + 有 outgoing 的节点做候选池
    by_type_with_outgoing = defaultdict(list)
    for n in nodes:
        if n.get("outgoing") and n.get("type"):
            by_type_with_outgoing[n["type"]].append(n)

    fixed = 0
    for n in nodes:
        if n.get("outgoing"):
            continue
        same_type = by_type_with_outgoing.get(n["type"], [])
        if not same_type:
            continue
        scored = []
        for cand in same_type:
            if cand["id"] == n["id"]:
                continue
            ts = tag_similarity(n, cand)
            ns = title_similarity(n["name"], cand["name"])
            score = ts * 0.7 + ns * 0.3
            scored.append((score, cand))
        scored.sort(key=lambda x: -x[0])
        top3 = scored[:3]
        if not top3:
            continue
        n["outgoing"] = [
            {"targetId": cand["id"], "label": "关联"} for _, cand in top3
        ]
        fixed += 1
    return fixed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="只看不写")
    args = ap.parse_args()

    kg = json.loads(KG_PATH.read_text(encoding="utf-8"))
    nodes = kg["nodes"]
    links = kg.get("links", [])

    before_empty = sum(1 for n in nodes if not n.get("outgoing"))

    # 阶段 1：双向同步 outgoing
    fixed1, src2tgt = step1_sync_from_links(nodes, links)
    still_empty = [n for n in nodes if not n.get("outgoing")]

    # 阶段 2：tag 推荐
    tag_to_count = Counter()
    for n in nodes:
        for t in n.get("tags", []):
            tag_to_count[t] += 1
    fixed2 = step2_recommend_by_tags(nodes, tag_to_count)

    after_empty = sum(1 for n in nodes if not n.get("outgoing"))

    print(f"修复前 outgoing 为空: {before_empty} 个")
    print(f"阶段 1（links 双向同步）修复: {fixed1} 个")
    print(f"阶段 2（tag 相似度推荐）修复: {fixed2} 个")
    print(f"修复后 outgoing 仍为空: {after_empty} 个")

    if after_empty > 0:
        print("--- 仍为空的节点:")
        for n in [n for n in nodes if not n.get("outgoing")][:10]:
            print(f"   {n['id']}  [{n['type']}]")

    if args.dry:
        print("(dry run，未写入)")
        return

    KG_PATH.write_text(
        json.dumps(kg, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n已写入 {KG_PATH}")


if __name__ == "__main__":
    main()
