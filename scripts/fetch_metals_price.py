#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch_metals_price.py
=====================
天线行业情报系统 · 金属原材料价格抓取脚本 MVP 版

抓取目标：
  - 电解铜现货价格（长江有色金属网 / 上海有色网）
  - 电解铝现货价格（长江有色金属网 / 上海有色网）

特性：
  - 仅使用 Python 标准库
  - dry-run 模式：默认不写文件，只打印结果供审核
  - 每个数据源独立 try/except，单源失败不影响整体
  - 输出格式严格对齐 app/_data/prices.json 结构

用法：
  python scripts/fetch_metals_price.py              # dry-run 模式（默认）
  python scripts/fetch_metals_price.py --live         # 正式写入文件
  python scripts/fetch_metals_price.py --verbose      # 详细日志
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import datetime as _dt
import urllib.request
import urllib.error
import urllib.parse
import html as _html
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# 路径 / 常量
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
APP_DATA_DIR = os.path.join(PROJECT_ROOT, "app", "_data")
PRICES_FILE = os.path.join(APP_DATA_DIR, "prices.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
HTTP_TIMEOUT = 15  # 秒
TODAY = _dt.date.today().isoformat()

# ---------------------------------------------------------------------------
# 日志工具
# ---------------------------------------------------------------------------

_verbose = False

def log(msg: str, force: bool = False):
    if _verbose or force:
        print(f"[fetch_metals_price] {msg}", file=sys.stderr)

# ---------------------------------------------------------------------------
# 数据源定义
# ---------------------------------------------------------------------------

# 每个数据源是一个函数，返回 parsed price dict 或 None
MetalSource = Dict[str, Any]

def _fetch_html(url: str, timeout: int = HTTP_TIMEOUT) -> Optional[str]:
    """获取 HTML 页面内容，失败返回 None"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset)
    except Exception as e:
        log(f"Failed to fetch {url}: {e}")
        return None

def _parse_cnmn_metals() -> List[MetalSource]:
    """
    尝试从 ccmn.cn (长江有色金属网) 抓取铜铝价格。
    
    注意：长江有色金属网有反爬机制，这里提供一个基础框架。
    如果抓取失败，返回空列表，不影响整体流程。
    """
    results = []
    url = "https://www.ccmn.cn/channel/price/copper.html"
    html = _fetch_html(url)
    if not html:
        log("ccmn.cn copper page fetch failed, skipping", force=True)
        return results
    
    # 这里需要根据实际 HTML 结构写解析逻辑
    # MVP 阶段先用模拟数据占位，后续替换为真实解析
    # 实际使用时取消下面的注释并填入真实解析代码
    # ...
    
    return results

def _fetch_smm_prices() -> List[MetalSource]:
    """
    从上海有色网 (SMM) 抓取铜铝价格。
    
    SMM 价格数据相对稳定，是业内常用参考。
    """
    results = []
    # SMM 有免费版和付费版，这里提供框架
    # 实际抓取可能需要处理登录/验证码
    log("SMM price fetch framework ready, needs actual parsing logic", force=True)
    return results

def _fetch_futui_price() -> List[MetalSource]:
    """
    从期货交易所获取铜铝期货价格作为参考。
    
    上海期货交易所 (SHFE) 的铜铝期货价格是公开数据，
    可以通过其官网或第三方财经网站获取。
    """
    results = []
    # 示例：从东方财富等财经网站获取期货价格
    urls = {
        "copper_futures": "https://quote.eastmoney.com/qihuo/hc2312.html",
        "aluminum_futures": "https://quote.eastmoney.com/qihuo/al2312.html",
    }
    for name, url in urls.items():
        html = _fetch_html(url)
        if html:
            # 解析逻辑待补充
            log(f"Parsed {name} from {url}", force=True)
    return results

# ---------------------------------------------------------------------------
# 模拟数据（MVP 占位，用于验证流程）
# ---------------------------------------------------------------------------

def _generate_mock_prices() -> List[MetalSource]:
    """
    生成模拟价格数据，用于验证脚本流程和输出格式。
    
    真实数据源接入后替换此函数。
    """
    today = TODAY
    return [
        {
            "name": "电解铜",
            "unit": "元/吨",
            "currentPrice": 71250,
            "change": "+0.35%",
            "trend": "上涨",
            "date": today,
            "dataSource": "模拟数据（待接入真实源）",
            "impact": "天线导体主要成本，铜价波动直接影响天线制造毛利率"
        },
        {
            "name": "电解铝",
            "unit": "元/吨",
            "currentPrice": 19850,
            "change": "-0.12%",
            "trend": "下跌",
            "date": today,
            "dataSource": "模拟数据（待接入真实源）",
            "impact": "天线结构件、散热片主要材料，铝价影响外壳成本"
        },
        {
            "name": "白银",
            "unit": "元/千克",
            "currentPrice": 6850,
            "change": "+1.2%",
            "trend": "上涨",
            "date": today,
            "dataSource": "模拟数据（待接入真实源）",
            "impact": "触点材料，用于高频连接器镀层"
        },
        {
            "name": "镍",
            "unit": "元/吨",
            "currentPrice": 135200,
            "change": "+0.8%",
            "trend": "上涨",
            "date": today,
            "dataSource": "模拟数据（待接入真实源）",
            "impact": "不锈钢、防腐涂层材料，影响户外天线耐候性"
        }
    ]

# ---------------------------------------------------------------------------
# 数据合并与写入
# ---------------------------------------------------------------------------

def load_existing_prices() -> Dict[str, Any]:
    """加载现有 prices.json，返回数据结构"""
    if not os.path.exists(PRICES_FILE):
        log(f"prices.json not found at {PRICES_FILE}, creating new structure", force=True)
        return {
            "lastUpdate": TODAY,
            "sources": {
                "metals": "待接入真实数据源",
            },
            "categories": [
                {
                    "name": "金属原材料",
                    "icon": "🔩",
                    "description": "铜、铝、不锈钢、螺纹钢等天线导体/结构件主材",
                    "materials": []
                }
            ]
        }
    
    with open(PRICES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def update_prices_data(existing: Dict[str, Any], new_materials: List[MetalSource]) -> Dict[str, Any]:
    """
    将新抓取的材料价格合并到现有数据结构中。
    
    逻辑：
    1. 找到对应的 category（金属原材料）
    2. 按 name 匹配，更新或新增 material
    3. 更新 lastUpdate 时间
    """
    updated = 0
    added = 0
    
    for cat in existing.get("categories", []):
        if cat["name"] == "金属原材料":
            materials = cat.setdefault("materials", [])
            
            for new_mat in new_materials:
                name = new_mat["name"]
                # 查找是否已存在
                found = False
                for i, mat in enumerate(materials):
                    if mat["name"] == name:
                        materials[i] = new_mat
                        updated += 1
                        found = True
                        break
                
                if not found:
                    materials.append(new_mat)
                    added += 1
            
            break
    
    existing["lastUpdate"] = TODAY
    log(f"Updated {updated} materials, added {added} new materials", force=True)
    
    return existing

def save_prices_data(data: Dict[str, Any]):
    """保存数据到 prices.json"""
    with open(PRICES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log(f"Saved to {PRICES_FILE}", force=True)

# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="天线行业金属价格抓取脚本 MVP")
    parser.add_argument("--live", action="store_true", help="正式写入文件（默认 dry-run）")
    parser.add_argument("--verbose", action="store_true", help="详细日志")
    args = parser.parse_args()
    
    global _verbose
    _verbose = args.verbose
    
    log("Starting metal price fetch script...", force=True)
    
    # Step 1: 加载现有数据
    existing = load_existing_prices()
    log(f"Loaded existing data, lastUpdate: {existing.get('lastUpdate', 'N/A')}", force=True)
    
    # Step 2: 抓取新数据
    # MVP 阶段先用模拟数据，后续替换为真实抓取
    new_materials = _generate_mock_prices()
    log(f"Fetched {len(new_materials)} metal prices", force=True)
    
    # Step 3: 合并数据
    updated = update_prices_data(existing, new_materials)
    
    # Step 4: 输出预览
    print("\n=== 数据预览 ===")
    for cat in updated.get("categories", []):
        print(f"\n[{cat['name']}]")
        for mat in cat.get("materials", []):
            print(f"  {mat['name']}: {mat['currentPrice']} {mat['unit']} ({mat['trend']} {mat['change']})")
    
    # Step 5: 写入文件（仅 --live 模式）
    if args.live:
        save_prices_data(updated)
        print(f"\n✅ 数据已写入 {PRICES_FILE}")
    else:
        print(f"\n📋 Dry-run 模式，未写入文件。使用 --live 参数正式写入。")
    
    log("Done.", force=True)

if __name__ == "__main__":
    main()
