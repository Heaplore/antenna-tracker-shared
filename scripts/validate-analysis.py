#!/usr/bin/env python3
"""验证分析输出文件的格式和质量"""

import json
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "app", "_data", "analysis-output.json")

REQUIRED_DIMENSIONS = ["technology", "quality", "cost", "delivery"]
REQUIRED_CARD_FIELDS = ["title", "summary", "severity", "data_sources"]
REQUIRED_SEVERITIES = ["high", "medium", "low"]

errors = []
warnings = []

def main():
    print("=" * 50)
    print("分析输出验证")
    print("=" * 50)

    if not os.path.exists(OUTPUT_FILE):
        print("ERROR: analysis-output.json not found")
        sys.exit(1)

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Check top-level fields
    if "generatedAt" not in data:
        errors.append("Missing generatedAt field")
    else:
        print(f"[OK] generatedAt: {data["generatedAt"]}")

    if "dimensions" not in data:
        errors.append("Missing dimensions field")
    else:
        for dim in REQUIRED_DIMENSIONS:
            if dim not in data["dimensions"]:
                errors.append(f"Missing dimension: {dim}")
            else:
                dim_data = data["dimensions"][dim]
                cards = dim_data.get("cards", [])
                print(f"  {dim}: {len(cards)} cards")

                if len(cards) == 0:
                    warnings.append(f"{dim} has 0 cards")

                for i, card in enumerate(cards):
                    for field in REQUIRED_CARD_FIELDS:
                        if field not in card:
                            errors.append(f"{dim} card {i}: missing {field}")

                    sev = card.get("severity", "")
                    if sev and sev not in REQUIRED_SEVERITIES:
                        warnings.append(f"{dim} card {i}: unknown severity {sev}")

                    rec = card.get("recommendation", "")
                    if not rec:
                        warnings.append(f"{dim} card {i}: missing recommendation")

    if "crossDimensionSummary" not in data:
        warnings.append("Missing crossDimensionSummary")
    else:
        summary_len = len(data["crossDimensionSummary"])
        print(f"[OK] crossDimensionSummary: {summary_len} chars")

    # Results
    print()
    print("=" * 50)
    if errors:
        print(f"FAILED: {len(errors)} errors")
        for e in errors:
            print(f"  ERROR: {e}")
        sys.exit(1)
    else:
        print("PASSED: All validations passed")
        if warnings:
            print(f"Warnings: {len(warnings)}")
            for w in warnings:
                print(f"  WARN: {w}")

if __name__ == "__main__":
    main()