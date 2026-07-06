#!/usr/bin/env python3
"""fix_kg_rel_links.py — 把 64 个死链 href 自动 fuzzy 匹配到现有 HTML 文件名

策略：
1. 收集所有 rendered/*.html 的真实文件名
2. 对每个死链 href，去掉 .html 后缀后做 fuzzy match
3. 替换 href

匹配规则（按优先级）：
- 去 "-深度解读" / "-20260704" 等常见后缀后精确匹配
- 连续 token 共现率 + LCS（最长公共子序列）
- 阈值：匹配度 >= 0.85 才替换，否则保留原 href（容错）
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
RENDERED_DIR = ROOT / "public/kg-cards-rendered"


def lcs_len(a: str, b: str) -> int:
    """最长公共子序列长度"""
    m, n = len(a), len(b)
    if m == 0 or n == 0:
        return 0
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]


def similarity(a: str, b: str) -> float:
    """Jaccard + LCS 加权相似度"""
    if not a or not b:
        return 0.0
    a_clean = re.sub(r"[\s\-_\.\[\]]+", "", a)
    b_clean = re.sub(r"[\s\-_\.\[\]]+", "", b)
    if not a_clean or not b_clean:
        return 0.0
    set_a = set(a_clean)
    set_b = set(b_clean)
    inter = len(set_a & set_b)
    union = len(set_a | set_b)
    jaccard = inter / union if union else 0
    lcs = lcs_len(a_clean, b_clean)
    lcs_ratio = lcs / min(len(a_clean), len(b_clean))
    return 0.5 * jaccard + 0.5 * lcs_ratio


def find_best_match(dead_href: str, real_files: list) -> tuple[str, float]:
    """找最相似的真实文件名

    先做类型前缀修正（technology-指标术语-XXX → metric-XXX 等），再 fuzzy match。
    """
    dead_base = dead_href[:-5] if dead_href.endswith(".html") else dead_href

    # 手动一对一的死链映射（针对渲染器把名字/拼写搞错的特例）
    manual_map = {
        "technology-天线罩radome深度解读": "component-天线罩radome深度解读",
        "technology-零部件-t/r模块transmit-receive-module": "component-t-r模块transmit-receive-module",
        "technology-零部件-八木天线yagi-uda-antenna": "component-八木天线yagi-uda",
        "technology-零部件-功分器合路器": "component-功分器合路器power-divider-combiner",
        "technology-零部件-环形器隔离器": "component-环形器隔离器circulator-isolator",
        "technology-零部件-电机motor-mechanical-tilt": "component-电机motor",
        "technology-指标术语-天线带宽bandwidth": None,  # 没有带宽对应的卡片，移除
    }
    if dead_base in manual_map:
        target_base = manual_map[dead_base]
        if target_base is None:
            return "__DELETE__", 1.0
        if (RENDERED_DIR / (target_base + ".html")).exists():
            return target_base + ".html", 1.0

    # 类型前缀修正：渲染器把所有 wiki-link 都加了 technology- 前缀
    prefix_fixes = [
        ("technology-指标术语-", "metric-"),
        ("technology-零部件-", "component-"),
        ("technology-材料-", "material-"),
        ("technology-度量单位-", "metric-"),
        ("technology-组件-", "component-"),
        ("technology-物料-", "material-"),
    ]
    for wrong, right in prefix_fixes:
        if dead_base.startswith(wrong):
            candidate = right + dead_base[len(wrong):]
            if (RENDERED_DIR / (candidate + ".html")).exists():
                return candidate + ".html", 1.0

    best, best_score = None, 0.0
    for real in real_files:
        real_base = real[:-5] if real.endswith(".html") else real
        score = similarity(dead_base, real_base)
        if score > best_score:
            best, best_score = real, score
    return best, best_score


def main():
    print("=" * 70)
    print("🔧 批量修复关联笔记 href 死链 → 真实文件名")
    print("=" * 70)

    real_files = sorted([f.name for f in RENDERED_DIR.glob("*.html")])
    print(f"\n📂 rendered HTML: {len(real_files)} 个")

    # 收集所有 rel-card href
    href_pattern = re.compile(r'<a class="rel-card" href="([^"]+)">')
    href_set = set()
    file_to_hrefs = {}
    for fp in RENDERED_DIR.glob("*.html"):
        html = fp.read_text(encoding="utf-8")
        hrefs = href_pattern.findall(html)
        href_set.update(hrefs)
        file_to_hrefs[fp.name] = hrefs

    print(f"🔗 唯一 href: {len(href_set)} 个")

    # 找出死链
    dead_hrefs = sorted([h for h in href_set if not (RENDERED_DIR / h).exists()])
    live_hrefs = sorted([h for h in href_set if (RENDERED_DIR / h).exists()])
    print(f"✅ 活链: {len(live_hrefs)}")
    print(f"❌ 死链: {len(dead_hrefs)}")

    # 对每个死链找最佳匹配
    print("\n🔍 Fuzzy matching ...")
    mapping = {}  # dead_href -> real_file
    unmatched = []
    for dead in dead_hrefs:
        real, score = find_best_match(dead, real_files)
        if score >= 0.85:
            mapping[dead] = (real, score)
            print(f"  {dead} → {real}  ({score:.3f})")
        else:
            unmatched.append((dead, real, score))
            print(f"  ⚠️  {dead} → {real}  ({score:.3f}) score<0.85, 跳过")

    print(f"\n📊 匹配结果: {len(mapping)} 个可替换, {len(unmatched)} 个低分")

    if not mapping:
        print("❌ 无匹配，退出")
        return

    # 应用替换
    print("\n🛠️  应用替换 ...")
    fixed_files = 0
    fixed_links = 0
    deleted_links = 0
    for fp in RENDERED_DIR.glob("*.html"):
        html = fp.read_text(encoding="utf-8")
        original = html
        for dead, (real, _score) in mapping.items():
            if real == "__DELETE__":
                # 删除整条 <a class="rel-card" ...> 链接（保留周围的空格）
                # 包括前后的换行（如果有）
                link_pattern = re.compile(
                    r'\n?\s*<a class="rel-card" href="' + re.escape(dead) + r'">.*?</a>',
                    re.DOTALL
                )
                deleted_count = len(link_pattern.findall(html))
                html = link_pattern.sub("", html)
                deleted_links += deleted_count
            else:
                # 精确替换 href="dead.html" → href="real.html"
                html = html.replace(f'href="{dead}"', f'href="{real}"')
                if f'href="{dead}"' in original:
                    fixed_links += original.count(f'href="{dead}"')
        if html != original:
            fp.write_text(html, encoding="utf-8")
            fixed_files += 1

    print(f"  ✅ 改写文件: {fixed_files}")
    print(f"  ✅ 替换链接数: {fixed_links}")
    print(f"  🗑️  删除无效链接数: {deleted_links}")

    # 二次验证
    print("\n🔍 二次验证 ...")
    remaining_dead = 0
    for fp in RENDERED_DIR.glob("*.html"):
        html = fp.read_text(encoding="utf-8")
        for m in href_pattern.finditer(html):
            href = m.group(1)
            if not (RENDERED_DIR / href).exists():
                remaining_dead += 1
    print(f"  残留死链: {remaining_dead}")

    if unmatched:
        print(f"\n⚠️  {len(unmatched)} 个未匹配（保留原 href）：")
        for dead, real, score in unmatched[:10]:
            print(f"    {dead} → {real}  ({score:.3f})")


if __name__ == "__main__":
    main()