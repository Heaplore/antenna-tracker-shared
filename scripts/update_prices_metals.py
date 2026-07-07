#!/usr/bin/env python3
"""
天线原材料价格自动更新脚本（金属类）。
数据源：
  1. 新浪财经 (hq.sinajs.cn) → 国际期货(黄金/白银)、外汇汇率(USD/CNY)
  2. quheqihuo API → 现货金属价格（铜、铝、锌、铅、镍、锡、螺纹钢等）
  3. 黄金/白银用纽约期货价格换算成人民币/克
数据获取后更新 prices.json，由 agent 提交推送到 GitHub。
纯 Python 标准库，无 pip 依赖。
"""
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "_data", "prices.json")

CTX = None
try:
    CTX = urllib.request.ssl.create_default_context()
    CTX.check_hostname = False
    CTX.verify_mode = urllib.request.ssl.CERT_NONE
except Exception:
    pass

OUNCE_TO_GRAM = 31.1035  # 1 金衡盎司 = 31.1035 克


def fetch_json(url, headers=None, timeout=15):
    """通用 HTTP GET，返回 decoded text."""
    if headers is None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "zh-CN,zh;q=0.9",
        }
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=CTX)
        raw = resp.read()
        for enc in ["utf-8", "gbk", "gb2312"]:
            try:
                return raw.decode(enc)
            except (UnicodeDecodeError, LookupError):
                continue
        return raw.decode("utf-8", errors="ignore")
    except Exception:
        return None


def fetch_sina(symbol):
    """从新浪财经获取数据，返回解析字典或 None."""
    url = f"https://hq.sinajs.cn/list={symbol}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://finance.sina.com.cn",
    }
    raw = fetch_json(url, headers=headers)
    if not raw:
        return None
    m = re.search(r'var hq_str_\w+="(.+?)"', raw)
    if not m or not m.group(1):
        return None
    parts = m.group(1).split(",")
    return {
        "name": parts[0],
        "price": parts[2],
        "prev_close": parts[3],
    }


def fetch_spot_prices():
    """
    从 quheqihuo API 获取现货金属价格。
    返回: {"1#铜": 101610, "A00铝": 22870, "螺纹钢": 3190, ...}
    """
    codes = "gc_4002,gc_6658,gc_12311,gc_2863,gc_75798,gc_24050,gc_5648,gc_7113,gc_107688,js_746,js_549,js_792,js_605,js_780,js_625,js_195,js_355,js_429,js_1168,js_188,js_21,js_804,js_765,js_448,ncp_5188,ncp_5066,ncp_6989,ncp_3721,ncp_3854,ncp_3710"
    url = f"https://www.quheqihuo.com/api/dz/ajax/data_by_ids.html?ids={codes}"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://jiage.cngold.org/",
    }
    raw = fetch_json(url, headers=headers)
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}

    prices = {}
    if data.get("code") == 0:
        for item in data.get("data", []):
            name = item.get("name", "")
            price = item.get("price", 0)
            if name and price:
                try:
                    price_val = float(price)
                    if price_val > 0:
                        prices[name] = price_val
                except (ValueError, TypeError):
                    pass
    return prices


def update_price(data, cat_idx, mat_idx, new_price, unit, old_price):
    """更新价格并计算涨跌. 同步覆盖当月 historical 保持趋势图与卡片一致."""
    mat = data["categories"][cat_idx]["materials"][mat_idx]
    mat["currentPrice"] = round(new_price, 2)
    mat["date"] = datetime.now().strftime("%Y-%m-%d")
    pct = abs(new_price - old_price) / old_price * 100
    if new_price > old_price:
        mat["change"] = f"+{pct:.1f}%"
        mat["trend"] = "上涨"
    elif new_price < old_price:
        mat["change"] = f"-{pct:.1f}%"
        mat["trend"] = "下跌"
    else:
        mat["change"] = "0.0%"
        mat["trend"] = "持平"

    # 同步覆盖当月 historical, 避免趋势图显示月内 stale 历史值
    # 策略: 用 currentPrice 直接覆盖当月最后一条 (YTD-07 例: 7月=108771 → 103260)
    # idempotent: 同月跑多次, 持续同步到最新价; 月初价格被覆盖, 失去月内轨迹
    # 替代方案 (待商): 保留月初价 + 追加 daily 数据点; 当前先保证页面一致
    now_month = datetime.now().strftime("%Y-%m")
    historical = mat.get("historical", [])
    for entry in historical:
        if entry.get("month", "").startswith(now_month):
            entry["price"] = round(new_price, 2)
            break
    else:
        # 该月还没有 historical 记录, append
        historical.append({"month": now_month, "price": round(new_price, 2)})
    mat["historical"] = historical


def convert_usd_to_cny_g(oz_price_usd, usd_cny_rate):
    """美元/盎司 → 人民币/克."""
    return oz_price_usd / OUNCE_TO_GRAM * usd_cny_rate


def main():
    print("=" * 60)
    print("天线原材料价格更新（金属类）")
    print("=" * 60)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = []
    skipped = []

    # ==================== 1. 获取汇率 ====================
    print("\n[1/4] 获取 USD/CNY 汇率...")
    fx = fetch_sina("fx_susdcny")
    if fx and fx.get("price"):
        usd_cny = float(fx["price"])
        print(f"  ✅ USD/CNY = {usd_cny}")
    else:
        usd_cny = 7.25
        print(f"  ⚠️  获取汇率失败，使用备用值: {usd_cny}")

    # ==================== 2. 获取现货价格 ====================
    print("\n[2/4] 获取现货金属价格...")
    spot = fetch_spot_prices()
    print(f"  共获取 {len(spot)} 个品种价格")
    for name, price in spot.items():
        if any(kw in name for kw in ["铜", "铝", "锌", "铅", "镍", "锡", "螺纹", "金", "银"]):
            print(f"    {name}: {price} 元/吨")

    # ==================== 3. 更新铜、铝、锌、铅、镍、锡、螺纹钢 ====================
    print("\n[3/4] 更新现货价格...")

    # 电解铜: 优先 "1#铜"，其次 "光亮铜线"
    copper_price = spot.get("1#铜") or spot.get("1#光亮铜线") or spot.get("电解铜")
    if copper_price:
        print(f"  ✅ 电解铜: {copper_price} 元/吨")
        old = data["categories"][0]["materials"][0]["currentPrice"]
        update_price(data, 0, 0, copper_price, "元/吨", old)
        updated.append(f"电解铜: {copper_price} 元/吨")

    # 铝锭: 优先 "A00铝"
    aluminum_price = spot.get("A00铝") or spot.get("铝锭")
    if aluminum_price:
        print(f"  ✅ 铝锭: {aluminum_price} 元/吨")
        old = data["categories"][0]["materials"][1]["currentPrice"]
        update_price(data, 0, 1, aluminum_price, "元/吨", old)
        updated.append(f"铝锭: {aluminum_price} 元/吨")

    # 螺纹钢
    rebar_price = spot.get("螺纹钢")
    if rebar_price:
        old = data["categories"][0]["materials"][5]["currentPrice"]
        update_price(data, 0, 5, rebar_price, "元/吨", old)
        updated.append(f"螺纹钢: {rebar_price} 元/吨")
        print(f"  ✅ 螺纹钢: {rebar_price} 元/吨")

    # ==================== 4. 黄金白银用纽约期货换算 ====================
    print("\n[4/4] 黄金/白银 (国际期货换算)...")

    # 黄金
    hf_gc = fetch_sina("hf_GC")
    if hf_gc and hf_gc.get("price"):
        oz_price = float(hf_gc["price"])
        gold_price_rmb = round(convert_usd_to_cny_g(oz_price, usd_cny), 2)
        old = data["categories"][0]["materials"][3]["currentPrice"]
        update_price(data, 0, 3, gold_price_rmb, "元/克", old)
        updated.append(f"金: {gold_price_rmb} 元/克")
        print(f"  ✅ 金: {gold_price_rmb} 元/克 (NY Gold: {oz_price} USD/oz)")

    # 白银
    hf_si = fetch_sina("hf_SI")
    if hf_si and hf_si.get("price"):
        oz_price = float(hf_si["price"])
        silver_price_rmb = round(convert_usd_to_cny_g(oz_price, usd_cny), 2)
        old = data["categories"][0]["materials"][4]["currentPrice"]
        update_price(data, 0, 4, silver_price_rmb, "元/克", old)
        updated.append(f"银: {silver_price_rmb} 元/克")
        print(f"  ✅ 银: {silver_price_rmb} 元/克 (NY Silver: {oz_price} USD/oz)")

    # ==================== 不锈钢 ====================
    skipped.append("不锈钢304 (需手动或通过付费数据源获取)")
    print("\n  ⏭️  不锈钢304: 需手动或通过付费数据源获取")

    # ==================== 输出结果 ====================
    print("\n" + "=" * 60)
    print("更新结果:")
    for u in updated:
        print(f"  ✅ {u}")
    for s in skipped:
        print(f"  ⏭️  {s}")
    print("=" * 60)

    data["lastUpdate"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n已更新 {len(updated)} 个材料, 跳过 {len(skipped)} 个")
    print("请验证数据后执行 git commit && git push")


if __name__ == "__main__":
    main()
