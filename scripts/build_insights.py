#!/usr/bin/env python3
"""派生式 insights dashboard —— 不依赖 LLM，从已有数据文件派生"分析卡片"。

设计目标:
- 数据源一旦更新（prices / news / standards / market），cards 立即有新内容
- LLM 失败也不会让首页空着
- 输出格式与原 generate-analysis 完全一致（兼容 page.tsx）

用法:
  python scripts/build_insights.py
"""
import json
import os
from datetime import datetime, timezone, timedelta
from collections import Counter

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DATA_DIR = os.path.join(PROJECT_ROOT, 'app', '_data')
OUTPUT_FILE = os.path.join(APP_DATA_DIR, 'analysis-output.json')

CST = timezone(timedelta(hours=8))


def load(name):
    path = os.path.join(APP_DATA_DIR, name)
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ============================================================
# 卡片构造 helpers
# ============================================================

def make_card(title, summary, recommendation, severity='medium', category='', data_sources=None):
    return {
        'type': category or '信号',
        'severity': severity,
        'title': title,
        'summary': summary,
        'recommendation': recommendation,
        'data_sources': data_sources or [],
        'priorityScore': {'high': 9, 'medium': 5, 'low': 2}[severity],
    }


def fmt_chg(pct):
    if pct > 0:
        return f'+{pct:.1f}%'
    if pct < 0:
        return f'{pct:.1f}%'
    return '持平'


# ============================================================
# COST 维度 — 派生自 prices.json
# ============================================================

def build_cost(prices):
    cards = []
    if not prices.get('categories'):
        return cards

    cat_summary = {}
    for cat in prices['categories']:
        materials = []
        for m in cat['materials']:
            h = m.get('historical', [])
            if len(h) >= 2:
                prev, cur = h[-2]['price'], h[-1]['price']
                chg = (cur - prev) / prev * 100
            else:
                chg = 0
            materials.append({
                'name': m['name'], 'unit': m.get('unit', ''),
                'cur': m.get('currentPrice'), 'chg': chg,
                'trend': m.get('trend', '持平'),
                'category': cat['name'],
            })
        cat_summary[cat['name']] = materials

    all_mats = []
    for cat_mats in cat_summary.values():
        all_mats.extend(cat_mats)

    # 1. 涨幅 TOP 5
    upside = sorted([m for m in all_mats if m['chg'] > 0], key=lambda x: -x['chg'])[:5]
    if upside:
        bullets = '；'.join(f"{m['name']} {fmt_chg(m['chg'])}" for m in upside)
        cards.append(make_card(
            '本月涨幅 TOP 5',
            bullets,
            '关注涨价对本月 BOM 成本的边际影响，识别传导效应最显著的子项。',
            severity='high' if any(m['chg'] > 10 for m in upside) else 'medium',
            category='成本上行信号',
            data_sources=['prices.json'],
        ))

    # 2. 跌幅 TOP 5
    downside = sorted([m for m in all_mats if m['chg'] < 0], key=lambda x: x['chg'])[:5]
    if downside:
        bullets = '；'.join(f"{m['name']} {fmt_chg(m['chg'])}" for m in downside)
        sev = 'high' if any(m['chg'] < -10 for m in downside) else 'medium'
        cards.append(make_card(
            '本月跌幅 TOP 5',
            bullets,
            '下跌材料可考虑提前锁价或小幅备库，捕捉短期成本红利。',
            severity=sev,
            category='成本下行信号',
            data_sources=['prices.json'],
        ))

    # 3. 全线涨跌统计
    up_n = sum(1 for m in all_mats if m['chg'] > 0)
    down_n = sum(1 for m in all_mats if m['chg'] < 0)
    flat_n = sum(1 for m in all_mats if m['chg'] == 0)
    if all_mats:
        cards.append(make_card(
            '成本方向分布',
            f'27种主要原材料中，{up_n}种上涨、{down_n}种下跌、{flat_n}种持平。',
            '整体 BOM 成本方向：' + (
                '走高' if up_n > down_n else
                '走低' if down_n > up_n else '横盘'
            ) + '。',
            severity='low',
            category='BOM 全景',
            data_sources=['prices.json'],
        ))

    # 4. 高涨幅 >10% 信号 (KR 信号)
    high_chg = [m for m in all_mats if abs(m['chg']) >= 10]
    if high_chg:
        sev = 'high'
        bullets = '；'.join(f"{m['name']} {fmt_chg(m['chg'])}" for m in high_chg)
        cards.append(make_card(
            '大幅波动信号 (≥10%)',
            bullets,
            '需重点关注此类材料的采购策略、供应商沟通与下游报价节奏。',
            severity=sev,
            category='关键波动',
            data_sources=['prices.json'],
        ))

    # 5. 主分类涨跌幅汇总
    for cat_name, mats in cat_summary.items():
        if not mats:
            continue
        avg = sum(m['chg'] for m in mats) / len(mats)
        if abs(avg) >= 0.5:
            cards.append(make_card(
                f'{cat_name}分类（{len(mats)}种）平均变化',
                f'本分类材料均价 {fmt_chg(avg)}',
                f'{cat_name}板块整体呈现{"上行" if avg > 0 else "下行"}趋势。',
                severity='medium' if abs(avg) >= 5 else 'low',
                category='分类聚合',
                data_sources=['prices.json'],
            ))

    return cards


# ============================================================
# DELIVERY 维度 — 派生自 news.json
# ============================================================

def build_delivery(news, market):
    cards = []
    if not isinstance(news, list) or not news:
        return cards

    today = datetime.now(CST).date()

    def parse_date(s):
        try:
            return datetime.strptime(s[:10], '%Y-%m-%d').date()
        except Exception:
            return None

    # 1. 最近 7 天新闻热度
    recent = [n for n in news if (d := parse_date(n.get('date', ''))) and (today - d).days <= 7]
    cards.append(make_card(
        '本周行业动态',
        f'过去 7 天共 {len(recent)} 条新闻入库（{today - timedelta(days=7)} ~ {today}）。',
        '持续跟踪交付相关动态，关注供应链、客户、订单类信号。',
        severity='medium' if len(recent) >= 5 else 'low',
        category='新闻热度',
        data_sources=['news.json'],
    ))

    # 2. 标签分布 TOP 5
    tags = []
    for n in news:
        for t in n.get('tags', []) or []:
            tags.append(t)
    if tags:
        tag_cnt = Counter(tags).most_common(8)
        bullets = '；'.join(f"{t}×{c}" for t, c in tag_cnt[:5])
        cards.append(make_card(
            '行业话题热度 TOP 5',
            bullets,
            '行业关注焦点，反映产业链上下游热点议题。',
            severity='low',
            category='话题雷达',
            data_sources=['news.json'],
        ))

    # 3. 最新 3 条（带时间）
    news_sorted = sorted(news, key=lambda n: n.get('date', ''), reverse=True)
    if news_sorted:
        top3 = news_sorted[:3]
        bullets = ' | '.join(n.get('title', '')[:40] for n in top3)
        cards.append(make_card(
            f'最新 {len(top3)} 条动态',
            bullets,
            '优先查阅最新头条，跟踪行业短期节奏。',
            severity='low',
            category='快讯',
            data_sources=['news.json'],
        ))

    # 4. 来源分布（反映监控覆盖度）
    sources = Counter(n.get('source', 'unknown') for n in news)
    if sources:
        s_bullets = '；'.join(f"{s}×{c}" for s, c in sources.most_common(5))
        cards.append(make_card(
            '信息来源分布',
            s_bullets,
            '覆盖度评估：监控站点均衡度反映信息源信任度。',
            severity='low',
            category='信源管理',
            data_sources=['news.json'],
        ))

    return cards


# ============================================================
# QUALITY / STANDARDS 维度 — 派生自 standards.json
# ============================================================

def build_quality(standards):
    cards = []
    cats = standards.get('categories', [])
    if not cats:
        return cards

    # 标准类别数
    cards.append(make_card(
        '标准覆盖概况',
        f'已收录 {len(cats)} 个标准类别，合计 {sum(len(c) for c in cats)} 条标准。',
        '关注标准更新与冻结动态，对应研发与合规基线。',
        severity='low',
        category='标准全景',
        data_sources=['standards.json'],
    ))

    # 6 大类标准数据 (3GPP / IEEE / ETSI / 国标 / 行业 / 其他) — 取样前 5
    for cat in cats[:5]:
        items = cat.get('items', []) or cat.get('standards', [])
        if not items:
            continue
        cards.append(make_card(
            f'{cat.get("name", "未命名类别")} ({len(items)} 条)',
            f'本类标准最新动态监控中，关注 {cat.get("name", "")} 演进。',
            '与厂商研发对标，确认标准覆盖度。',
            severity='low',
            category='标准类别',
            data_sources=['standards.json'],
        ))

    return cards


# ============================================================
# TECHNOLOGY 维度 — 派生自 technology.json
# ============================================================

def build_technology(tech):
    cards = []
    if not tech:
        return cards

    overview = tech.get('industryOverview', '') or ''
    if overview:
        cards.append(make_card(
            '行业技术概览',
            overview[:160] + ('...' if len(overview) > 160 else ''),
            '宏观理解当前技术变革期的核心议题。',
            severity='medium',
            category='行业概览',
            data_sources=['technology.json'],
        ))

    tech_details = tech.get('technologyDetail', [])
    if tech_details:
        cards.append(make_card(
            f'技术详情覆盖 {len(tech_details)} 项',
            f'涵盖 {len(tech_details)} 项重点技术，含 hype cycle 阶段标注。',
            '参照 hype cycle 阶段评估技术成熟度与商业化窗口。',
            severity='medium',
            category='技术地图',
            data_sources=['technology.json'],
        ))

    hype = tech.get('hypeCycle', {})
    if hype:
        for stage, items in list(hype.items())[:4]:
            if isinstance(items, list) and items:
                cards.append(make_card(
                    f'Hype cycle · {stage}',
                    f'本阶段列示 {len(items)} 项相关技术。',
                    '判断技术投资节奏与团队对标重点。',
                    severity='low',
                    category='技术阶段',
                    data_sources=['technology.json'],
                ))

    cat_sum = tech.get('categorySummary', [])
    if cat_sum:
        bullets = '；'.join(
            f"{c.get('name', '')} ({len(c.get('items', []))}项)"
            for c in cat_sum[:5]
            if isinstance(c, dict)
        )
        if bullets:
            cards.append(make_card(
                '技术分类汇总',
                bullets,
                '快速对标研发管线分布。',
                severity='low',
                category='技术分类',
                data_sources=['technology.json'],
            ))

    return cards


# ============================================================
# MARKET 维度 — 派生自 market.json
# ============================================================

def build_market(market):
    cards = []
    if not market:
        return cards

    summary = market.get('summary', {})
    if summary:
        size = summary.get('size', summary.get('marketSize', ''))
        growth = summary.get('growth', summary.get('growthRate', ''))
        leader = summary.get('leader', summary.get('topPlayer', ''))
        hotspots = summary.get('hotspots', summary.get('hotTopics', ''))
        lines = []
        if size: lines.append(f'市场规模 {size}')
        if growth: lines.append(f'增速 {growth}')
        if leader: lines.append(f'龙头 {leader}')
        if hotspots: lines.append(f'热点 {hotspots}')
        if lines:
            cards.append(make_card(
                '市场核心摘要',
                '；'.join(lines),
                '战略决策的全局视角基线。',
                severity='high',
                category='市场全景',
                data_sources=['market.json'],
            ))

    segments = market.get('segments', [])
    if segments:
        for seg in segments[:5]:
            name = seg.get('name', '') if isinstance(seg, dict) else str(seg)
            cards.append(make_card(
                f'细分赛道: {name}',
                f'{name} 赛道独立指标跟踪中。',
                '聚焦细分市场趋势，匹配业务线定位。',
                severity='low',
                category='市场细分',
                data_sources=['market.json'],
            ))

    drivers = market.get('keyDrivers', [])
    if drivers:
        bullets = '；'.join(
            d.get('name', '') if isinstance(d, dict) else str(d) for d in drivers[:5]
        )
        if bullets:
            cards.append(make_card(
                '行业核心驱动',
                bullets,
                '识别长期增长驱动 vs 短期波动因子。',
                severity='medium',
                category='驱动力',
                data_sources=['market.json'],
            ))

    return cards


# ============================================================
# 综合摘要 (无 LLM)
# ============================================================

def gen_cross_summary(dimensions):
    bullets = []
    sev_map = {'high': 5, 'medium': 3, 'low': 1}
    pool = []
    for dim_label, dim in [
        ('成本', dimensions.get('cost')),
        ('交付', dimensions.get('delivery')),
        ('质量', dimensions.get('quality')),
        ('技术', dimensions.get('technology')),
        ('市场', dimensions.get('market')),
    ]:
        cards = dim.get('cards', []) if isinstance(dim, dict) else []
        for c in cards:
            score = sev_map.get(c.get('severity', 'low'), 1)
            pool.append((score, dim_label, c))

    pool.sort(key=lambda x: -x[0])
    top = pool[:5]
    if not top:
        return '暂无显著信号，数据持续采集中。'

    parts = []
    for score, dim_label, c in top:
        title = c.get('title', '')[:40]
        parts.append(f'{dim_label}：{title}')

    return '⚠️ 重点信号：' + '；'.join(parts) + '。'


# ============================================================
# 主流程
# ============================================================

def main():
    print('=' * 60, file=__import__('sys').stderr)
    print('派生式 insights dashboard (无 LLM)', file=__import__('sys').stderr)
    print('=' * 60, file=__import__('sys').stderr)

    prices = load('prices.json')
    news = load('news.json')
    standards = load('standards.json')
    technology = load('technology.json')
    market = load('market.json')

    dimensions = {
        'cost':      {'cards': build_cost(prices),       'source': 'derived-from-prices'},
        'delivery':  {'cards': build_delivery(news, market), 'source': 'derived-from-news'},
        'quality':   {'cards': build_quality(standards), 'source': 'derived-from-standards'},
        'technology':{'cards': build_technology(technology), 'source': 'derived-from-technology'},
        'market':    {'cards': build_market(market),     'source': 'derived-from-market'},
    }

    total = sum(len(v['cards']) for v in dimensions.values())
    print(f'派生卡片: total={total}', file=__import__('sys').stderr)
    for k, v in dimensions.items():
        print(f'  {k}: {len(v["cards"])} cards', file=__import__('sys').stderr)

    output = {
        'generatedAt': datetime.now(CST).strftime('%Y-%m-%dT%H:%M:%S+08:00'),
        'configVersion': 'insights-v1.0',
        'mode': 'derived-only',
        'dimensions': dimensions,
        'crossDimensionSummary': gen_cross_summary(dimensions),
    }

    os.makedirs(APP_DATA_DIR, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'\nDone! {OUTPUT_FILE}', file=__import__('sys').stderr)
    print('=' * 60, file=__import__('sys').stderr)


if __name__ == '__main__':
    main()
