#!/usr/bin/env python3
"""
价格数据一致性自检 — historical[-1].price 必须 == currentPrice
每次生成报告前跑一次，发现漂移立即退出（exit code 1）。
"""
import json
import sys
import os

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "_data", "prices.json")

def main():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    issues = []
    for cat in data.get("categories", []):
        for item in cat.get("materials", []):
            hist = item.get("historical", [])
            cur = item.get("currentPrice", 0)
            if hist and len(hist) > 0:
                last_price = hist[-1].get("price", 0)
                if abs(last_price - cur) > max(cur * 0.01, 0.5):  # 1% or 0.5 absolute
                    issues.append({
                        "name": item["name"],
                        "currentPrice": cur,
                        "hist_last": last_price,
                        "diff_pct": abs(last_price - cur) / cur * 100 if cur else 0,
                    })
    
    if issues:
        print("DRIFT DETECTED:")
        for i in issues:
            print(f"  {i['name']}: cur={i['currentPrice']} hist[-1]={i['hist_last']} diff={i['diff_pct']:.1f}%")
        sys.exit(1)
    else:
        print(f"OK: All {sum(len(c['materials']) for c in data['categories'])} materials consistent")
        sys.exit(0)

if __name__ == "__main__":
    main()
