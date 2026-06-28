#!/usr/bin/env python3
"""
Generate weekly report banner for antenna-tracker market page.

Reads:  app/_data/market.json
Writes: market.json (overwrites weekly_banner field)
        docs/market-weekly.md (full report)

Usage:
    python generate_banner_report.py [--data-dir <path>] [--output-dir <path>] [--dry-run]

Designed for GitHub Actions cron: weekly Monday 09:00 Beijing time.
"""

import argparse
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

BEIJING_TZ = timezone(timedelta(hours=8))
ISO_WEEK_FORMAT = "%G-W%V"
DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "_data"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "docs"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate antenna-tracker weekly market report")
    p.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR, help="Path to _data directory")
    p.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Path to docs output directory")
    p.add_argument("--dry-run", action="store_true", help="Print results without writing files")
    return p.parse_args()


def load_market(data_dir: Path) -> Dict[str, Any]:
    market_path = data_dir / "market.json"
    if not market_path.exists():
        raise FileNotFoundError(f"market.json not found at {market_path}")
    with market_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def find_top_segment(segments: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not segments:
        return None
    return max(segments, key=lambda s: _parse_pct(s.get("cagr", "0%")))


def find_growth_segments(segment_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return segments ranked by absolute value (proxy for prominence)."""
    if not segment_data:
        return []
    sorted_segs = sorted(
        segment_data,
        key=lambda s: float(s.get("value", 0) or 0),
        reverse=True,
    )
    return sorted_segs[:3]


def _parse_pct(value: str) -> float:
    if not isinstance(value, str):
        return 0.0
    cleaned = value.strip().replace("%", "").replace(",", "")
    try:
        return float(cleaned)
    except (ValueError, AttributeError):
        return 0.0


def compute_banner(market: Dict[str, Any], now: datetime) -> Dict[str, Any]:
    summary = market.get("summary", {}) or {}
    segments = market.get("segments", []) or []
    segment_data = market.get("segmentData", []) or []
    key_drivers = market.get("keyDrivers", []) or []
    trend_data = market.get("trendData", []) or []

    top = find_top_segment(segments)
    growth = find_growth_segments(segment_data)

    period_label = now.strftime(ISO_WEEK_FORMAT)

    highlight_parts: List[str] = []
    if summary.get("globalMarketSize2024"):
        highlight_parts.append(f"全球天线市场规模 {summary['globalMarketSize2024']}")
    if summary.get("cagr"):
        highlight_parts.append(f"年复合增长率 {summary['cagr']}")
    if summary.get("forecast2030"):
        highlight_parts.append(f"2030 年预计达 {summary['forecast2030']}")
    highlight = "，".join(highlight_parts) + "。" if highlight_parts else "本周市场数据待更新。"

    drivers_block = [
        {"name": d, "rank": i + 1}
        for i, d in enumerate((key_drivers or ["暂无"])[:5])
    ]

    return {
        "period_label": period_label,
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%S"),
        "last_data_update": market.get("lastUpdate"),
        "highlight": highlight,
        "top_segment": top.get("name") if top else None,
        "top_segment_cagr": top.get("cagr") if top else None,
        "growth_segments": [
            {"name": g.get("name"), "value": g.get("value")}
            for g in growth
            if g.get("name")
        ],
        "drivers": drivers_block,
        "driver_count": len(drivers_block),
        "trend_points": len(trend_data),
    }


def render_markdown(banner: Dict[str, Any], market: Dict[str, Any]) -> str:
    summary = market.get("summary", {}) or {}
    now_str = banner.get("generated_at", "")
    period = banner.get("period_label", "")

    lines: List[str] = [
        f"# 天线市场周报 — {period}",
        "",
        f"_生成时间：{now_str}（北京时间）_",
        f"_数据截止：{banner.get('last_data_update', '—')}_",
        "",
        "## 本周要点",
        "",
        f"> {banner.get('highlight', '')}",
        "",
        "## 关键驱动因素",
        "",
    ]
    for d in banner.get("drivers", []):
        lines.append(f"{d.get('rank', '?')}. {d.get('name', '')}")

    if banner.get("top_segment"):
        lines.extend([
            "",
            "## 增长最快细分",
            "",
            f"- **{banner['top_segment']}**：CAGR {banner.get('top_segment_cagr') or '—'}",
        ])

    growth_segs = banner.get("growth_segments", [])
    if growth_segs:
        lines.extend(["", "## 主流细分（按规模排序）", ""])
        for g in growth_segs:
            lines.append(f"- {g.get('name')}：{g.get('value')} 亿元")

    if summary:
        lines.extend([
            "",
            "## 市场总览",
            "",
            f"- 全球市场规模（2024）：{summary.get('globalMarketSize2024', '—')}",
            f"- 中国市场规模（2024）：{summary.get('chinaMarketSize2024', '—')}",
            f"- 年复合增长率 CAGR：{summary.get('cagr', '—')}",
            f"- 2030 年预测：{summary.get('forecast2030', '—')}",
        ])

    lines.extend([
        "",
        "---",
        "",
        "_本报告由 `scripts/generate_banner_report.py` 自动生成。下次更新：下周一 09:00 北京时间。_",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    if not args.data_dir.exists():
        print(f"ERROR: data dir not found: {args.data_dir}", file=sys.stderr)
        return 1

    market = load_market(args.data_dir)
    now = datetime.now(tz=BEIJING_TZ)
    banner = compute_banner(market, now)

    if args.dry_run:
        print("DRY RUN — banner content:")
        print(json.dumps(banner, ensure_ascii=False, indent=2))
        return 0

    market["weekly_banner"] = banner

    market_path = args.data_dir / "market.json"
    with market_path.open("w", encoding="utf-8") as f:
        json.dump(market, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"✓ Updated: {market_path}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    md_path = args.output_dir / "market-weekly.md"
    md_path.write_text(render_markdown(banner, market), encoding="utf-8")
    print(f"✓ Generated: {md_path}")

    print(f"\nPeriod: {banner['period_label']}")
    print(f"Top segment: {banner['top_segment']} ({banner['top_segment_cagr']})")
    print(f"Drivers: {banner['driver_count']} items")
    return 0


if __name__ == "__main__":
    sys.exit(main())