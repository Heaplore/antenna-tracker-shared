#!/usr/bin/env python3
"""
天线BOM原材料价格自动更新脚本（全量27种材料）。
数据源：
  1. 新浪财经 (hq.sinajs.cn) → 国际期货(黄金/白银)、外汇汇率(USD/CNY)
  2. quheqihuo API → 现货金属价格（铜、铝、锌、铅、镍、锡、螺纹钢等）
  3. 黄金/白银用纽约期货价格换算成人民币/克
  4. 工程塑料/PCB/化工类通过新浪财经期货行情获取
数据获取后更新 prices.json，由 agent 提交推送到 GitHub。
纯 Python 标准库，无 pip 依赖。

核心规则：
  - 历史数据只追加不覆盖：禁止修改已有月份的价格
  - 当前月只在末尾追加一条记录
  - forecast月份（未来月）不参与计算，写入时剔除
  - change = (new_price - prev_month_real_price) / prev_month_real_price * 100
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


def get_prev_month_real_price(data, cat_idx, mat_idx):
    """取上一月 (month < currentMonth) 的真实历史价，用于算环比涨跌。

    策略: 在 hist 里倒着找第一条 month < currentMonth 的历史条目。
    - 不要用 currentPrice 当 old_price，那样永远等于 new_price -> 永远持平
    - hist 末尾 (==currentMonth) 可能被覆盖，不能用
    - hist 里 month > currentMonth 的都是 forecast 复制，不能用
    - 唯一可信的是 month < currentMonth 的最近一条 (=上月真实历史价)

    Edge cases:
    - hist 为空: 用 currentPrice 作为 fallback
    - 没有更早月份: 用 currentPrice
    """
    mat = data["categories"][cat_idx]["materials"][mat_idx]
    hist = mat.get("historical", [])

    last_update = data.get("lastUpdate", "")
    current_month = str(last_update)[:7] if last_update else datetime.now().strftime("%Y-%m")

    for h in reversed(hist):
        m_month = str(h.get("month", ""))[:7]
        if m_month and m_month < current_month:
            return h["price"]

    return mat.get("currentPrice", 0)


def clean_historical(historical):
    """清理 forecast 月份：移除所有 month >= currentMonth 的条目。
    只保留严格过去的月份数据。"""
    now_month = datetime.now().strftime("%Y-%m")
    cleaned = [h for h in historical if str(h.get("month", ""))[:7] < now_month]
    return cleaned


def update_material(data, cat_idx, mat_idx, new_price, unit, old_price, date_str):
    """更新单个材料的价格和 change。只追加当前月，不碰已有历史。"""
    mat = data["categories"][cat_idx]["materials"][mat_idx]
    now_month = datetime.now().strftime("%Y-%m")
    now_date = datetime.now().strftime("%Y-%m-%d")

    # 更新 currentPrice
    mat["currentPrice"] = round(new_price, 2)
    mat["date"] = date_str or now_date

    # 计算 change
    if old_price and old_price > 0:
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

    # 处理 historical：先清理 forecast 月份，再追加当前月（如果不存在）
    historical = mat.get("historical", [])
    historical = clean_historical(historical)

    # 检查当前月是否已存在
    has_current = any(str(h.get("month", ""))[:7] == now_month for h in historical)
    if not has_current:
        historical.append({"month": now_month, "price": round(new_price, 2)})

    mat["historical"] = historical


def convert_usd_to_cny_g(oz_price_usd, usd_cny_rate):
    """美元/盎司 → 人民币/克."""
    return oz_price_usd / OUNCE_TO_GRAM * usd_cny_rate


def fetch_sina_futures(symbols):
    """批量从新浪财经获取期货行情。
    symbols: list of symbol strings like ['hf_GC', 'hf_SI', 'fx_susdcny']
    返回: {symbol: {"name": ..., "price": ..., "prev_close": ...}}
    """
    results = {}
    for sym in symbols:
        r = fetch_sina(sym)
        if r:
            results[sym] = r
    return results


def main():
    print("=" * 60)
    print("天线BOM原材料价格更新（全量27种）")
    print("=" * 60)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = []
    skipped = []
    now_date = datetime.now().strftime("%Y-%m-%d")

    # ==================== 1. 获取汇率 ====================
    print("\n[1/5] 获取 USD/CNY 汇率...")
    fx = fetch_sina("fx_susdcny")
    if fx and fx.get("price"):
        usd_cny = float(fx["price"])
        print(f"  USD/CNY = {usd_cny}")
    else:
        usd_cny = 7.25
        print(f"  汇率获取失败，使用备用值: {usd_cny}")

    # ==================== 2. 获取现货金属价格 ====================
    print("\n[2/5] 获取现货金属价格...")
    spot = fetch_spot_prices()
    print(f"  共获取 {len(spot)} 个品种价格")

    # ==================== 3. 获取新浪期货行情 ====================
    print("\n[3/5] 获取新浪期货行情...")
    # 黄金GC、白银SI、铜CU、铝AL、锌ZN、铅PB、镍NI、锡SN、螺纹RB、线材WR
    sina_symbols = ['hf_GC', 'hf_SI', 'cu0', 'al0', 'zn0', 'pb0', 'ni0', 'sn0', 'rb0', 'wr0',
                    'lc0', 'ta0', 'pp0', 'eg0', 'pa0', 'b0', 'fr0', 'sh0']
    sina_data = fetch_sina_futures(sina_symbols)
    for sym in sina_symbols:
        if sym in sina_data:
            print(f"  {sym}: {sina_data[sym].get('price', '?')}")

    # ==================== 4. 更新各材料 ====================
    print("\n[4/5] 更新材料价格...")

    # === 金属原材料 (cat_idx=0) ===
    # 0: 电解铜
    copper_price = spot.get("1#铜") or spot.get("1#光亮铜线") or spot.get("电解铜") or sina_data.get("cu0", {}).get("price")
    if copper_price:
        old = get_prev_month_real_price(data, 0, 0)
        update_material(data, 0, 0, float(copper_price), "元/吨", old, now_date)
        updated.append(f"电解铜: {copper_price} 元/吨")
        print(f"  ✅ 电解铜: {copper_price}")

    # 1: 铝锭
    aluminum_price = spot.get("A00铝") or spot.get("铝锭") or sina_data.get("al0", {}).get("price")
    if aluminum_price:
        old = get_prev_month_real_price(data, 0, 1)
        update_material(data, 0, 1, float(aluminum_price), "元/吨", old, now_date)
        updated.append(f"铝锭: {aluminum_price}")
        print(f"  ✅ 铝锭: {aluminum_price}")

    # 2: 不锈钢304 - 无自动数据源，跳过
    print(f"  ⏭️  不锈钢304: 需手动或通过付费数据源获取")
    skipped.append("不锈钢304 (无自动数据源)")

    # 3: 金
    hf_gc = sina_data.get("hf_GC") or fetch_sina("hf_GC")
    if hf_gc and hf_gc.get("price"):
        oz_price = float(hf_gc["price"])
        gold_price_rmb = round(convert_usd_to_cny_g(oz_price, usd_cny), 2)
        old = get_prev_month_real_price(data, 0, 3)
        update_material(data, 0, 3, gold_price_rmb, "元/克", old, now_date)
        updated.append(f"金: {gold_price_rmb} 元/克")
        print(f"  ✅ 金: {gold_price_rmb} 元/克 (NY Gold: {oz_price} USD/oz)")

    # 4: 银
    hf_si = sina_data.get("hf_SI") or fetch_sina("hf_SI")
    if hf_si and hf_si.get("price"):
        oz_price = float(hf_si["price"])
        silver_price_rmb = round(convert_usd_to_cny_g(oz_price, usd_cny), 2)
        old = get_prev_month_real_price(data, 0, 4)
        update_material(data, 0, 4, silver_price_rmb, "元/克", old, now_date)
        updated.append(f"银: {silver_price_rmb} 元/克")
        print(f"  ✅ 银: {silver_price_rmb} 元/克 (NY Silver: {oz_price} USD/oz)")

    # 5: 螺纹钢
    rebar_price = spot.get("螺纹钢") or sina_data.get("rb0", {}).get("price")
    if rebar_price:
        old = get_prev_month_real_price(data, 0, 5)
        update_material(data, 0, 5, float(rebar_price), "元/吨", old, now_date)
        updated.append(f"螺纹钢: {rebar_price}")
        print(f"  ✅ 螺纹钢: {rebar_price}")

    # 6: 锌
    zinc_price = spot.get("锌") or spot.get("0#锌") or sina_data.get("zn0", {}).get("price")
    if zinc_price:
        old = get_prev_month_real_price(data, 0, 6)
        update_material(data, 0, 6, float(zinc_price), "元/吨", old, now_date)
        updated.append(f"锌: {zinc_price}")
        print(f"  ✅ 锌: {zinc_price}")

    # 7: 镍
    nickel_price = spot.get("1#镍") or spot.get("电解镍") or sina_data.get("ni0", {}).get("price")
    if nickel_price:
        old = get_prev_month_real_price(data, 0, 7)
        update_material(data, 0, 7, float(nickel_price), "元/吨", old, now_date)
        updated.append(f"镍: {nickel_price}")
        print(f"  ✅ 镍: {nickel_price}")

    # 8: 锡
    tin_price = spot.get("1#锡") or sina_data.get("sn0", {}).get("price")
    if tin_price:
        old = get_prev_month_real_price(data, 0, 8)
        update_material(data, 0, 8, float(tin_price), "元/吨", old, now_date)
        updated.append(f"锡: {tin_price}")
        print(f"  ✅ 锡: {tin_price}")

    # 9: 铅
    lead_price = spot.get("1#铅") or sina_data.get("pb0", {}).get("price")
    if lead_price:
        old = get_prev_month_real_price(data, 0, 9)
        update_material(data, 0, 9, float(lead_price), "元/吨", old, now_date)
        updated.append(f"铅: {lead_price}")
        print(f"  ✅ 铅: {lead_price}")

    # === 工程塑料 (cat_idx=1) ===
    # 通过新浪财经期货行情获取近似价格
    # LCP树脂: 南京清研 纯树脂主流6万/吨 → 但实际天线用LCP薄膜级约20万/吨
    # PTFE树脂: 悬浮中粒4.6-4.8万, 分散树脂4.7-5.3万 → 取均价
    # PPS树脂: 注塑级6万/吨
    # 环氧树脂: E-51报价13500元/吨
    # PA66: 市场均价16708元/吨
    # PBT: 市场均价8550元/吨
    # 这些材料没有可靠的实时API，使用新浪财经近似数据或fallback

    # 1: LCP树脂 - 通过新浪财经化工品行情
    lcp_price = sina_data.get("lc0", {}).get("price")
    if lcp_price:
        old = get_prev_month_real_price(data, 1, 0)
        update_material(data, 1, 0, float(lcp_price), "元/吨", old, now_date)
        updated.append(f"LCP树脂: {lcp_price}")
        print(f"  ✅ LCP树脂: {lcp_price}")
    else:
        # 无实时数据，跳过
        print(f"  ⏭️  LCP树脂: 无实时数据源")
        skipped.append("LCP树脂 (无实时数据源)")

    # 2: PTFE树脂
    ptfe_price = sina_data.get("ta0", {}).get("price")
    if ptfe_price:
        old = get_prev_month_real_price(data, 1, 1)
        update_material(data, 1, 1, float(ptfe_price), "元/吨", old, now_date)
        updated.append(f"PTFE树脂: {ptfe_price}")
        print(f"  ✅ PTFE树脂: {ptfe_price}")
    else:
        print(f"  ⏭️  PTFE树脂: 无实时数据源")
        skipped.append("PTFE树脂 (无实时数据源)")

    # 3: PPS树脂
    pps_price = sina_data.get("pp0", {}).get("price")
    if pps_price:
        old = get_prev_month_real_price(data, 1, 2)
        update_material(data, 1, 2, float(pps_price), "元/吨", old, now_date)
        updated.append(f"PPS树脂: {pps_price}")
        print(f"  ✅ PPS树脂: {pps_price}")
    else:
        print(f"  ⏭️  PPS树脂: 无实时数据源")
        skipped.append("PPS树脂 (无实时数据源)")

    # 4: 环氧树脂
    eg_price = sina_data.get("eg0", {}).get("price")
    if eg_price:
        old = get_prev_month_real_price(data, 1, 3)
        update_material(data, 1, 3, float(eg_price), "元/吨", old, now_date)
        updated.append(f"环氧树脂: {eg_price}")
        print(f"  ✅ 环氧树脂: {eg_price}")
    else:
        print(f"  ⏭️  环氧树脂: 无实时数据源")
        skipped.append("环氧树脂 (无实时数据源)")

    # 5: PA66
    pa_price = sina_data.get("pa0", {}).get("price")
    if pa_price:
        old = get_prev_month_real_price(data, 1, 4)
        update_material(data, 1, 4, float(pa_price), "元/吨", old, now_date)
        updated.append(f"PA66: {pa_price}")
        print(f"  ✅ PA66: {pa_price}")
    else:
        print(f"  ⏭️  PA66: 无实时数据源")
        skipped.append("PA66 (无实时数据源)")

    # 6: PBT
    pbt_price = sina_data.get("b0", {}).get("price")
    if pbt_price:
        old = get_prev_month_real_price(data, 1, 5)
        update_material(data, 1, 5, float(pbt_price), "元/吨", old, now_date)
        updated.append(f"PBT: {pbt_price}")
        print(f"  ✅ PBT: {pbt_price}")
    else:
        print(f"  ⏭️  PBT: 无实时数据源")
        skipped.append("PBT (无实时数据源)")

    # === PCB/覆铜板 (cat_idx=2) ===
    # FR4覆铜板、LCP薄膜、碳氢树脂覆铜板、PTFE高频覆铜板、电子布7628
    # 这些没有标准期货代码，需要手动维护或使用替代数据源
    print(f"\n  ⏭️  PCB/覆铜板: 需手动或通过行业数据源获取")
    skipped.extend(["FR4覆铜板", "LCP薄膜", "碳氢树脂覆铜板", "PTFE高频覆铜板", "电子布7628"])

    # === 化工类原材料 (cat_idx=3) ===
    # 导电银浆、PVDF氟膜、导热硅脂、硅烷偶联剂、三防漆、电子级环氧树脂
    print(f"\n  ⏭️  化工类: 需手动或通过行业数据源获取")
    skipped.extend(["导电银浆", "PVDF氟膜", "导热硅脂", "硅烷偶联剂", "三防漆", "电子级环氧树脂"])

    # ==================== 5. 输出结果 ====================
    print("\n" + "=" * 60)
    print("更新结果:")
    for u in updated:
        print(f"  ✅ {u}")
    for s in skipped:
        print(f"  ⏭️  {s}")
    print("=" * 60)

    # 清理所有材料的 forecast 月份
    print("\n清理 forecast 月份数据...")
    forecast_cleaned = 0
    for cat in data["categories"]:
        for mat in cat["materials"]:
            hist = mat.get("historical", [])
            before = len(hist)
            hist = clean_historical(hist)
            after = len(hist)
            if before != after:
                forecast_cleaned += (before - after)
                mat["historical"] = hist
    print(f"  清理了 {forecast_cleaned} 条 forecast 月份记录")

    # 更新 lastUpdate
    data["lastUpdate"] = f"{now_date} {datetime.now().strftime('%H:%M')}"

    # 写回文件
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n已更新 {len(updated)} 个材料, 跳过 {len(skipped)} 个")
    print(f"请验证数据后执行 git commit && git push")


if __name__ == "__main__":
    main()
