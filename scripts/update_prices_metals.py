#!/usr/bin/env python3
"""
天线 BOM 原材料价格数据清理与校验脚本。
角色: workflow 中的数据维护工具，不做数据采集。
职责:
  1. 清理 forecast 月份污染（移除所有 month >= currentMonth 的条目）
  2. 补齐当前月数据（如果 missing，用 currentPrice 追加到 historical）
  3. 校验历史数据一致性（historical[-1].price == currentPrice）
  4. 输出更新报告供 agent 参考

注意：价格采集由 cron 任务通过 web_search 完成，然后直接 commit 到 GitHub。
本脚本只负责数据质量保障。
"""
import json
import os
import sys
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "_data", "prices.json")


def clean_historical(historical, now_month):
    """清理 forecast 月份：移除所有 month >= now_month 的条目。
    只保留严格过去的月份数据。"""
    cleaned = [h for h in historical if str(h.get("month", ""))[:7] < now_month]
    return cleaned


def ensure_current_month(historical, now_month, price):
    """确保当前月有数据记录。
    如果 historical 中没有当前月条目，则追加一条。"""
    has_current = any(str(h.get("month", ""))[:7] == now_month for h in historical)
    if not has_current:
        historical.append({"month": now_month, "price": round(price, 2)})
    return historical


def verify_consistency(data):
    """验证所有材料 historical[-1].price == currentPrice。
    返回 (ok, mismatches) 列表。"""
    now_month = datetime.now().strftime("%Y-%m")
    mismatches = []
    for cat in data["categories"]:
        for mat in cat["materials"]:
            hist = mat.get("historical", [])
            # 先确保当前月有数据
            hist = ensure_current_month(hist, now_month, mat["currentPrice"])
            mat["historical"] = hist

            if not hist:
                mismatches.append(f"{cat['name']}/{mat['name']}: no historical data")
                continue
            last_hist_price = hist[-1]["price"]
            current = mat["currentPrice"]
            if last_hist_price != current:
                mismatches.append(
                    f"{cat['name']}/{mat['name']}: hist[-1]={last_hist_price} vs current={current}"
                )
    return len(mismatches) == 0, mismatches


def main():
    print("=" * 60)
    print("天线 BOM 原材料价格数据清理与校验")
    print("=" * 60)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    now_month = datetime.now().strftime("%Y-%m")

    # ==================== 1. 清理 forecast 月份 ====================
    print(f"\n[1/3] 清理 forecast 月份 (>= {now_month})...")
    forecast_cleaned = 0
    for cat in data["categories"]:
        for mat in cat["materials"]:
            hist = mat.get("historical", [])
            before = len(hist)
            hist = clean_historical(hist, now_month)
            after = len(hist)
            if before != after:
                forecast_cleaned += (before - after)
                mat["historical"] = hist
    print(f"  清理了 {forecast_cleaned} 条 forecast 月份记录")

    # ==================== 2. 补齐当前月数据 ====================
    print(f"\n[2/3] 补齐当前月 ({now_month}) 数据...")
    current_month_added = 0
    for cat in data["categories"]:
        for mat in cat["materials"]:
            hist = mat.get("historical", [])
            has_current = any(str(h.get("month", ""))[:7] == now_month for h in hist)
            if not has_current:
                hist.append({"month": now_month, "price": round(mat["currentPrice"], 2)})
                mat["historical"] = hist
                current_month_added += 1
    print(f"  为 {current_month_added} 个材料追加了 {now_month} 数据")

    # ==================== 3. 校验数据一致性 ====================
    print("\n[3/3] 校验数据一致性...")
    ok, mismatches = verify_consistency(data)
    if ok:
        print("  ✅ 所有材料 consistent: historical[-1].price == currentPrice")
    else:
        print(f"  ❌ {len(mismatches)} 个材料不一致:")
        for m in mismatches:
            print(f"    - {m}")

    # ==================== 4. 输出报告 ====================
    print("\n" + "=" * 60)
    print("数据报告:")
    print("=" * 60)
    total_materials = 0
    materials_with_current_month = 0
    for cat in data["categories"]:
        print(f"\n  {cat['name']}:")
        for mat in cat["materials"]:
            total_materials += 1
            hist = mat.get("historical", [])
            has_current = any(str(h.get("month", ""))[:7] == now_month for h in hist)
            if has_current:
                materials_with_current_month += 1
            months = [h.get("month", "?") for h in hist]
            print(f"    - {mat['name']:20s} price={str(mat['currentPrice']):>12} change={mat.get('change', '?'):>8} trend={mat.get('trend', '?'):6} date={mat.get('date', '?')} hist={months}")

    print(f"\n  总计: {total_materials} 种材料")
    print(f"  当前月有数据: {materials_with_current_month}/{total_materials}")

    # 更新 lastUpdate
    now_date = datetime.now().strftime("%Y-%m-%d")
    data["lastUpdate"] = f"{now_date} {datetime.now().strftime('%H:%M')}"

    # 写回文件
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n数据已写回 {DATA_FILE}")
    print("请验证数据后执行 git commit && git push")


if __name__ == "__main__":
    main()
