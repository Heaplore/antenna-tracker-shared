#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
auto_fetch_standards.py
=======================

天线行业情报系统 · 标准自动抓取 (增量/只读, dry-run 默认)

设计原则
--------
1. 零破坏: 现有 public/data/standards.json 作为基线 (BASELINE), 绝不直接覆盖
2. 增量: 抓到的每条候选与基线做去重对比, 仅输出 standards_candidates.json
3. 人工 review hook: candidates 文件可由老大 review, 确认 OK 后再用
   `apply_standards_candidates.py` 合并进主文件
4. 仅标准库: 不引入第三方依赖
5. 默认 dry-run: 加 --write 才会写 candidates 文件

数据源 (本次第一版)
-------------------
- 3GPP Release 列表 (https://www.3gpp.org/specifications/79-releases)
  → 跟基线 intl_3gpp 类对比, 找 18+ 之后未收录的版本
- IEEE 802.x (https://standards.ieee.org/about/802/) → 找 802.11bn (Wi-Fi 8 草案) 等
- ETSI portal 暂不可达 (timeout) → 跳过, 不阻塞
- 国标网 / 工信部 / ITU → 留 v2, 本版本只覆盖 3GPP/IEEE 两个高价值源

用法
----
python scripts/auto_fetch_standards.py                # dry-run, 打印 diff
python scripts/auto_fetch_standards.py --write        # 写 candidates json
python scripts/auto_fetch_standards.py --write --apply # 写并直接合并到 standards.json (需谨慎)
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------
# 路径 / 常量
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PUBLIC_STANDARDS = os.path.join(PROJECT_ROOT, "public", "data", "standards.json")
CANDIDATES_FILE = os.path.join(SCRIPT_DIR, "standards_candidates.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
HTTP_TIMEOUT = 12

# 静态元数据: 每个 release 的人工撰写 description (用基线里的同名条目的 description 作为
# fallback, 缺的留空让 review 阶段补)
RELEASE_KNOWN_META = {
    "Release 21": {
        "publishDate": "2025-09",
        "title_hint": "5G-Advanced Phase 4 / 6G 起点",
        "url": "https://www.3gpp.org/specifications/releases/21",
    },
    "Release 20": {
        "publishDate": "2025-06",
        "title_hint": "5G-Advanced Phase 3",
        "url": "https://www.3gpp.org/specifications/releases/20",
    },
    "Release 19": {
        "publishDate": "2024-12",
        "title_hint": "5G-Advanced Phase 2 (首版)",
        "url": "https://www.3gpp.org/specifications/releases/19",
    },
}

# 已知 release 列表 (静态 fallback, 抓不到页面时使用)
RELEASE_KNOWN_FALLBACK = ["Release 21", "Release 20", "Release 19"]


# ---------------------------------------------------------------------------
# 工具
# ---------------------------------------------------------------------------
def log(level: str, msg: str) -> None:
    icons = {"info": "·", "ok": "✓", "warn": "!", "err": "✗", "section": "▶"}
    icon = icons.get(level, "·")
    sys.stdout.write(f"  {icon} {msg}\n")
    sys.stdout.flush()


def http_get(url: str, timeout: int = HTTP_TIMEOUT) -> str | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="ignore")
    except Exception as e:
        log("warn", f"GET {url} failed: {type(e).__name__} {str(e)[:60]}")
        return None


def load_baseline() -> dict:
    with open(PUBLIC_STANDARDS, "r", encoding="utf-8") as f:
        return json.load(f)


def fingerprint(record: dict) -> str:
    """用于去重: 类别+编号归一化
    3GPP Release 15 / Release 15 视为同一条
    """
    cat = (record.get("category") or "").strip().lower()
    name = (record.get("name") or "").strip()
    # 去掉 "3GPP " 前缀做归一化
    name = re.sub(r"^3gpp\s+", "", name, flags=re.I).lower()
    return hashlib.md5(f"{cat}|{name}".encode("utf-8")).hexdigest()


def index_baseline(baseline: dict) -> set:
    fps = set()
    for cat in baseline.get("categories", []):
        for std in cat.get("standards", []):
            fps.add(fingerprint({"category": cat.get("code", ""), "name": std.get("name", "")}))
    return fps


# ---------------------------------------------------------------------------
# 抓取器
# ---------------------------------------------------------------------------
def fetch_3gpp_releases() -> list[str]:
    """抓 3GPP Release 列表 (归一化为 3GPP Release N 格式)"""
    url = "https://www.3gpp.org/specifications/79-releases"
    html = http_get(url)
    found: list[str] = []
    if html:
        for m in re.finditer(r"Release\s*(\d+)", html):
            n = int(m.group(1))
            # 排除异常年份 (1999 等), 3GPP Release 编号一般 4-21
            if 4 <= n <= 30:
                found.append(f"3GPP Release {n}")
    else:
        log("warn", "3GPP page unreachable, using static fallback")
        found = [f"3GPP Release {n}" for n in (21, 20, 19)]
    # 去重保序
    seen, ordered = set(), []
    for r in found:
        if r not in seen:
            seen.add(r)
            ordered.append(r)
    return ordered


def build_3gpp_candidates(releases: list[str], baseline: dict) -> list[dict]:
    """3GPP candidates: 基线里没有的 Release 都视为候选, 附静态元数据"""
    intl_3gpp = next((c for c in baseline["categories"] if c.get("code") == "intl_3gpp"), None)
    existing_names = {s.get("name", "").strip() for s in (intl_3gpp or {}).get("standards", [])}
    candidates: list[dict] = []
    for rel in releases:
        if rel in existing_names:
            continue
        meta = RELEASE_KNOWN_META.get(rel, {})
        # rel 已经是 "3GPP Release N" 格式, name 直接用
        candidates.append({
            "name": rel,
            "title": meta.get("title_hint", f"{rel} (待补)"),
            "category": "intl_3gpp",
            "code": "intl_3gpp",
            "status": "现行",
            "publishDate": meta.get("publishDate", ""),
            "organization": "3GPP",
            "scope": "(待 review 补)",
            "description": "(待 review 补) — 第一版自动抓取只发现新 Release 编号, 详细描述需人工 review",
            "url": meta.get("url", f"https://www.3gpp.org/specifications/releases/{rel.split()[-1]}"),
            "source": "auto:3gpp_releases",
            "fetchedAt": _dt.date.today().isoformat(),
        })
    return candidates


def fetch_ieee_802() -> list[dict]:
    """IEEE 802 系列候选 (静态已知 + 页面校验)
    已知 2024-2025 新增: 802.11bn (Wi-Fi 8 草案)"""
    url = "https://standards.ieee.org/about/802/"
    html = http_get(url)
    static_candidates = [
        {
            "name": "IEEE 802.11bn",
            "title": "Wi-Fi 8 (Ultra High Reliability)",
            "category": "intl_ieee",
            "code": "intl_ieee",
            "status": "草案",
            "publishDate": "预计 2028",
            "organization": "IEEE 802.11",
            "scope": "(待 review 补)",
            "description": "(待 review 补) — Wi-Fi 8 项目, 重点 UHR (Ultra High Reliability) 与多 AP 协同",
            "url": "https://www.ieee802.org/11/",
            "source": "auto:ieee_802_static",
            "fetchedAt": _dt.date.today().isoformat(),
        },
    ]
    if html and re.search(r"802\.11bn", html, re.I):
        return static_candidates
    log("warn", "IEEE 802 page 没显式提到 802.11bn, 仍输出静态候选 (manual review 决定)")
    return static_candidates


def build_all_candidates(baseline: dict) -> tuple[list[dict], dict]:
    """主入口: 拉所有源, 输出 candidates + stats"""
    stats = {
        "3gpp_page_releases": 0,
        "3gpp_candidates": 0,
        "ieee_candidates": 0,
        "total": 0,
        "skipped_dup": 0,
    }

    all_candidates: list[dict] = []
    log("section", "抓 3GPP releases ...")
    releases = fetch_3gpp_releases()
    stats["3gpp_page_releases"] = len(releases)
    c3 = build_3gpp_candidates(releases, baseline)
    stats["3gpp_candidates"] = len(c3)
    all_candidates.extend(c3)

    log("section", "抓 IEEE 802 ...")
    cieee = fetch_ieee_802()
    stats["ieee_candidates"] = len(cieee)
    all_candidates.extend(cieee)

    # 全局去重
    baseline_fps = index_baseline(baseline)
    seen: set[str] = set()
    deduped: list[dict] = []
    for c in all_candidates:
        fp = fingerprint({"category": c["code"], "name": c["name"]})
        if fp in baseline_fps:
            stats["skipped_dup"] += 1
            continue
        if fp in seen:
            stats["skipped_dup"] += 1
            continue
        seen.add(fp)
        deduped.append(c)
    stats["total"] = len(deduped)
    return deduped, stats


# ---------------------------------------------------------------------------
# 输出
# ---------------------------------------------------------------------------
def print_diff(candidates: list[dict], baseline: dict, stats: dict) -> None:
    print()
    total_baseline = sum(len(c.get("standards", [])) for c in baseline.get("categories", []))
    log("section", f"基线 {len(baseline.get('categories', []))} 类, 共 {total_baseline} 条")
    log("section", f"本次抓取 3GPP 页面发现 {stats['3gpp_page_releases']} 个 Release 编号")
    log("section", f"新增候选 (去重后) = {stats['total']} 条, 跳过重复 = {stats['skipped_dup']} 条")
    print()
    by_cat: dict[str, list] = {}
    for c in candidates:
        by_cat.setdefault(c["code"], []).append(c)
    for code, items in by_cat.items():
        cat_name = next((c["name"] for c in baseline["categories"] if c.get("code") == code), code)
        log("ok", f"[{cat_name}]  +{len(items)} 条候选")
        for c in items:
            print(f"      - {c['name']:20s}  {c['title'][:40]:40s}  {c['publishDate']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="写 candidates 到 scripts/standards_candidates.json")
    ap.add_argument("--apply", action="store_true", help="合并 candidates 进 standards.json (危险, 默认关闭)")
    args = ap.parse_args()

    print("=" * 60)
    log("section", "auto_fetch_standards.py  -  dry-run")
    print("=" * 60)

    baseline = load_baseline()
    candidates, stats = build_all_candidates(baseline)
    print_diff(candidates, baseline, stats)

    if args.write or args.apply:
        out = {
            "generatedAt": _dt.datetime.now().isoformat(timespec="seconds"),
            "baselineLastUpdate": baseline.get("lastUpdate"),
            "stats": stats,
            "candidates": candidates,
        }
        with open(CANDIDATES_FILE, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        log("ok", f"已写 {CANDIDATES_FILE}")

    if args.apply:
        log("err", "--apply 模式在第一版未实现, 防止误覆盖, 请 review candidates 后人工合并")
        sys.exit(2)

    print()
    log("info", "无副作用, 仅打印 diff")


if __name__ == "__main__":
    main()
