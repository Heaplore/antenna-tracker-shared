#!/usr/bin/env python3
"""
Enrich knowledge-graph.json entity metadata using LLM.

Idempotent: only fills missing/empty fields by default.
Supports technology/company/material entities.

Usage:
    python scripts/enrich_kg_metadata.py              # fill all missing
    python scripts/enrich_kg_metadata.py --dry-run    # preview only
    python scripts/enrich_kg_metadata.py --force      # overwrite existing
    python scripts/enrich_kg_metadata.py --only-new   # only entities without any metadata
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app" / "_data" / "knowledge-graph.json"
DST = ROOT / "public" / "data" / "knowledge-graph.json"

# MMX CLI invocation (cross-platform)
NODE_EXE = os.environ.get("NODE_EXE", r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe")
MMX_MJS = os.environ.get("MMX_MJS", r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node_modules\mmx-cli\dist\mmx.mjs")

TYPE_FIELDS = {
    "technology": ["phase", "maturity", "category"],
    "company": ["stock_code", "location", "is_key"],
    "material": ["trend", "price", "unit"],
}


def mmx_chat(prompt: str, timeout: int = 60) -> str:
    """Call MiniMax text chat via mmx-cli (node + mmx.mjs)."""
    cmd = [NODE_EXE, MMX_MJS, "text", "chat", "--prompt", prompt, "--quiet"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, encoding="utf-8")
    except FileNotFoundError as e:
        raise RuntimeError(f"Node or mmx-cli not found: {e}")
    except subprocess.TimeoutExpired:
        raise RuntimeError("mmx text chat timed out")
    if result.returncode != 0:
        raise RuntimeError(f"mmx text chat failed: {result.stderr.strip()}")
    return result.stdout.strip()


def extract_json(text: str) -> dict[str, Any]:
    """Extract JSON object from LLM response (handles markdown fences)."""
    text = text.strip()
    # Remove markdown fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    # Find first JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in: {text[:200]}")
    return json.loads(match.group(0))


def build_prompt(entity: dict) -> str | None:
    """Build LLM prompt for an entity based on its type."""
    t = entity.get("type")
    name = entity.get("name", "")
    desc = entity.get("description", "")
    summary = entity.get("summary", "")
    vernacular = entity.get("summary_vernacular", "")
    context = "\n".join(
        s for s in [f"专业描述：{desc}", f"通俗解读：{vernacular}", f"摘要：{summary}"] if s
    )

    if t == "technology":
        return (
            f"你是天线行业知识库专家。请分析以下技术实体，只输出 JSON 对象。\n"
            f"实体名称：{name}\n{context}\n\n"
            "请填充以下三个字段：\n"
            "- phase: 技术所处阶段/代际。只允许以下值之一：4G、5G、6G、预研、商用、成熟、衰退。如果横跨多个阶段，选当前主流应用阶段。\n"
            "- maturity: 技术成熟度。只允许：高、中、低。\n"
            "- category: 技术类别/应用场景。只允许以下值之一：基站天线、终端天线、卫星通信、汽车天线、雷达感知、材料工艺、芯片封装、测试测量、通信协议、电磁波传播、其他。\n\n"
            '输出严格为 JSON：{"phase":"...","maturity":"...","category":"..."}\n'
            "不要输出任何解释、markdown 或其他文字。"
        )
    if t == "company":
        return (
            f"你是天线行业知识库专家。请分析以下企业实体，只输出 JSON 对象。\n"
            f"实体名称：{name}\n{context}\n\n"
            "请填充以下三个字段：\n"
            "- stock_code: 股票代码（如 600941.SH / 0941.HK）。如果未上市或非上市公司，填\"未上市\"或\"非上市\"。\n"
            "- location: 总部所在地（城市名，如深圳、北京、苏州）。\n"
            "- is_key: 是否为核心/重点企业。只允许 true 或 false。\n\n"
            '输出严格为 JSON：{"stock_code":"...","location":"...","is_key":true/false}\n'
            "不要输出任何解释、markdown 或其他文字。"
        )
    if t == "material":
        return (
            f"你是天线行业原材料市场专家。请分析以下材料实体，只输出 JSON 对象。\n"
            f"实体名称：{name}\n{context}\n\n"
            "请填充以下字段：\n"
            "- trend: 近期价格趋势。只允许：上涨、下跌、平稳、震荡。\n"
            "- price: 最新单价，填数字。如果不知道具体价格，填 null。\n"
            "- unit: 计量单位（如 元/吨、元/千克、元/平方米）。如果不知道，填\"-\"。\n\n"
            '输出严格为 JSON：{"trend":"...","price":数字或null,"unit":"..."}\n'
            "不要输出任何解释、markdown 或其他文字。"
        )
    return None


def normalize_metadata(entity: dict, raw: dict) -> dict[str, Any]:
    """Normalize and validate LLM output for an entity."""
    t = entity["type"]
    normalized: dict[str, Any] = {}

    if t == "technology":
        phase = str(raw.get("phase", "")).strip()
        maturity = str(raw.get("maturity", "")).strip()
        category = str(raw.get("category", "")).strip()
        normalized["phase"] = phase if phase else ""
        normalized["maturity"] = maturity if maturity in ("高", "中", "低") else "中"
        normalized["category"] = category if category else "其他"

    elif t == "company":
        normalized["stock_code"] = str(raw.get("stock_code", "未上市")).strip() or "未上市"
        normalized["location"] = str(raw.get("location", "")).strip()
        is_key = raw.get("is_key")
        if isinstance(is_key, bool):
            normalized["is_key"] = is_key
        elif isinstance(is_key, str):
            normalized["is_key"] = is_key.lower() in ("true", "是", "yes", "1")
        else:
            normalized["is_key"] = False

    elif t == "material":
        trend = str(raw.get("trend", "")).strip()
        normalized["trend"] = trend if trend in ("上涨", "下跌", "平稳", "震荡") else "平稳"
        price = raw.get("price")
        normalized["price"] = price if isinstance(price, (int, float)) else None
        unit = str(raw.get("unit", "")).strip()
        normalized["unit"] = unit if unit else "-"

    return normalized


def needs_enrichment(entity: dict, force: bool = False) -> bool:
    """Check if an entity needs metadata enrichment."""
    if force:
        return True
    t = entity.get("type")
    if t not in TYPE_FIELDS:
        return False
    metadata = entity.get("metadata") or {}
    for field in TYPE_FIELDS[t]:
        val = metadata.get(field)
        if val is None or str(val).strip() == "":
            return True
    return False


def fill_entity(entity: dict, dry_run: bool = False) -> dict[str, Any] | None:
    """Fill missing metadata for a single entity using LLM."""
    prompt = build_prompt(entity)
    if not prompt:
        return None

    try:
        response = mmx_chat(prompt, timeout=60)
        parsed = extract_json(response)
        normalized = normalize_metadata(entity, parsed)
    except Exception as e:
        print(f"    ⚠️  LLM failed for [{entity.get('type')}] {entity.get('name')}: {e}")
        return None

    if dry_run:
        return normalized

    metadata = entity.setdefault("metadata", {})
    # Only fill missing/empty fields (unless called with force, handled by caller)
    for key, val in normalized.items():
        existing = metadata.get(key)
        if existing is None or str(existing).strip() == "":
            metadata[key] = val
    return normalized


def main():
    parser = argparse.ArgumentParser(description="Enrich knowledge graph entity metadata")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    parser.add_argument("--force", action="store_true", help="Overwrite existing non-empty values")
    parser.add_argument("--only-new", action="store_true", help="Only process entities with empty or no metadata")
    args = parser.parse_args()

    if not SRC.exists():
        print(f"❌ Source file not found: {SRC}")
        sys.exit(1)

    data = json.loads(SRC.read_text(encoding="utf-8"))
    entities = data.get("entities", [])

    processed = 0
    skipped = 0
    failed = 0

    for entity in entities:
        t = entity.get("type")
        if t not in TYPE_FIELDS:
            continue
        if args.only_new and (entity.get("metadata") or {}):
            continue
        if not args.force and not needs_enrichment(entity):
            skipped += 1
            continue

        print(f"[{t}] {entity.get('name', '')}")
        result = fill_entity(entity, dry_run=args.dry_run)
        if result:
            print(f"    -> {json.dumps(result, ensure_ascii=False)}")
            processed += 1
        else:
            failed += 1

    if args.dry_run:
        print(f"\nDry run complete. Would process {processed} entities, skip {skipped}, fail {failed}.")
        return

    # Write back
    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    if DST.parent.exists():
        DST.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC, DST)
        print(f"\nSynced -> {DST}")

    print(f"\n✅ Processed {processed}, skipped {skipped}, failed {failed}.")


if __name__ == "__main__":
    main()
