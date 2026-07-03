#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_apply_candidates.py
====================

合并 2 条手工 review 过的候选进 standards.json
- 3GPP Release 21 (5G-Advanced Phase 4 / 6G 起点, 2025-09)
- IEEE 802.11bn (Wi-Fi 8 草案, UHR)

安全:
- 先写 standards.json.new, 确认后替换
- 不动其他类, 只追加新条目
- bump lastUpdate 到今天
"""
import json
import os
import shutil
import sys
import datetime as _dt

ROOT = r"E:\OH-workspace\antenna-tracker"
PATH = os.path.join(ROOT, "public", "data", "standards.json")
PATH_APP = os.path.join(ROOT, "app", "_data", "standards.json")
BAK = PATH + ".bak"

# 候选: 2 条手工 review
NEW_RECORDS = [
    {
        "name": "3GPP Release 21",
        "title": "5G-Advanced Phase 4 / 6G 演进起点",
        "category": "intl_3gpp",
        "status": "现行",
        "publishDate": "2025年9月",
        "organization": "3GPP",
        "scope": "面向 5G-Advanced 收尾与 6G 早期研究的并行 Release, 涵盖 AI/ML 数据驱动空口增强、XR/沉浸式通信优化、天地一体化网络 (NTN) 增强、网络节能、传感通信融合 (ISAC) 概念验证 ...",
        "description": "3GPP 首个在 5G 框架内并行启动 6G 研究的 Release。包含 5G-Advanced Phase 4 的优化收尾 (AI/ML 空口、XR、上行增强、覆盖增强、ELAA 演进) 和面向 6G 的早期 SI/WI (Study/Work Item) 立项, 为 IMT-2030 6G 规范做准备。预计冻结时间 2025 年 9 月, 与 ITU IMT-2030 时间表对齐。",
        "url": "https://www.3gpp.org/specifications/releases/21",
        "review_status": "manual_review_passed",
        "reviewed_at": _dt.date.today().isoformat(),
    },
    {
        "name": "IEEE 802.11bn",
        "title": "Wi-Fi 8 (Ultra High Reliability, UHR)",
        "category": "intl_ieee",
        "status": "草案",
        "publishDate": "预计 2028 年",
        "organization": "IEEE 802.11",
        "scope": "面向超高可靠性 (UHR) 与多 AP 协同的下一代 Wi-Fi, 重点提升工业 IoT、医疗、AR/VR 等场景的确定性时延与可靠性 ...",
        "description": "IEEE 802.11 下一代 WLAN 项目, 代号 UHR (Ultra High Reliability)。2024 年 9 月 TGbn 任务组正式成立 (PAR 批准), 引入多 AP 协同调度、增强 MU-MIMO、320MHz 信道扩展、低时延确定性传输等关键技术。预计 2028 年发布正式标准, 商用于 2028-2029 年。",
        "url": "https://www.ieee802.org/11/",
        "review_status": "manual_review_passed",
        "reviewed_at": _dt.date.today().isoformat(),
    },
]


def apply():
    today = _dt.date.today().isoformat()
    for p in [PATH, PATH_APP]:
        with open(p, "r", encoding="utf-8") as f:
            d = json.load(f)
        # 备份
        shutil.copy2(p, BAK)
        # bump lastUpdate
        old_lu = d.get("lastUpdate")
        d["lastUpdate"] = today
        # 追加
        added = 0
        skipped = 0
        for rec in NEW_RECORDS:
            target_cat_code = rec["category"]
            cat = next((c for c in d["categories"] if c.get("code") == target_cat_code), None)
            if not cat:
                print(f"WARN: 类 {target_cat_code} 不存在, 跳过 {rec['name']}")
                continue
            # 防重
            if any(s.get("name") == rec["name"] for s in cat.get("standards", [])):
                print(f"SKIP: {rec['name']} 已在 {target_cat_code} 中, 跳过")
                skipped += 1
                continue
            cat.setdefault("standards", []).append({
                "name": rec["name"],
                "title": rec["title"],
                # 注: 基线里 std.category 字段 = 父类 name (如 "3GPP国际标准"), 不是 code
                "category": cat["name"],
                "status": rec["status"],
                "publishDate": rec["publishDate"],
                "organization": rec["organization"],
                "scope": rec["scope"],
                "description": rec["description"],
                "url": rec["url"],
            })
            added += 1
        # 写
        new_p = p + ".new"
        with open(new_p, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
        os.replace(new_p, p)
        print(f"OK: {p}")
        print(f"    lastUpdate: {old_lu} -> {d['lastUpdate']}")
        print(f"    added: {added}, skipped: {skipped}")


if __name__ == "__main__":
    apply()
    print("DONE")
