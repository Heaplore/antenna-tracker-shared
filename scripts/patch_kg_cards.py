#!/usr/bin/env python3
"""patch_kg_cards.py — 批量修复 144 个已渲染 KG 卡片的三类问题：

1. 关联笔记 href/文本乱码（嵌套中括号 [技术概念-XXX]].html）
   → href 改为 technology-XXX.html，文本改为 XXX（去前缀）
2. 宽度调整：max-width: 1200px → 100%（卡片撑满浏览器，左右 24px padding 防贴边）
3. 自检清单：实际渲染出的 HTML 中已经 0 出现，无需修复

Usage:
    python scripts/patch_kg_cards.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
RENDERED_DIR = ROOT / "public/kg-cards-rendered"
KG_FILE = ROOT / "app/_data/knowledge-graph.json"


def load_id_to_name():
    """从 KG JSON 构建 id → 中文名 映射（用于兜底解析失败时）"""
    try:
        kg = json.loads(KG_FILE.read_text(encoding="utf-8"))
        return {n["id"]: n["name"] for n in kg.get("nodes", [])}
    except Exception as e:
        print(f"⚠️  读取 KG JSON 失败: {e}")
        return {}


def fix_rel_card(match: re.Match, id_to_name: dict) -> str:
    """修复 <a class="rel-card" href="[XXX]]">XXX]]"><span class="ico">[</span><span>...</span></a>

    正则只有 2 组：group(1) = href（带 [ ]），group(2) = 显示文本（带 [ ]）
    """
    inner_href = match.group(1)  # [技术概念-6g信道建模范式转移-从统计拟合到数字孪生]
    inner_text = match.group(2)  # [技术概念-6G信道建模范式转移-从统计拟合到数字孪生]

    # 去所有中括号 → "技术概念-6g信道建模范式转移-从统计拟合到数字孪生"
    slug = re.sub(r"[\[\]]+", "", inner_href).strip()
    # 去前缀 "技术概念-" → "6g信道建模范式转移-从统计拟合到数字孪生"
    if slug.startswith("技术概念-"):
        slug = slug[len("技术概念-"):]
    # 去后缀 ".html"（原始 href 已带 .html）
    if slug.endswith(".html"):
        slug = slug[:-5]

    # href = technology-{slug}.html
    new_href = f"technology-{slug}.html"

    # 显示文本优先从 KG JSON 拿准确中文名，兜底用 slug（用 inner_text 进一步清理）
    target_id = f"technology-{slug}"
    display_name = id_to_name.get(target_id, slug)
    # 兜底时再清一次显示文本
    if display_name == slug:
        display_name = re.sub(r"[\[\]]+", "", inner_text).strip()
        if display_name.startswith("技术概念-"):
            display_name = display_name[len("技术概念-"):]

    return (
        f'<a class="rel-card" href="{new_href}">'
        f'<span class="ico">→</span>'
        f'<span>{display_name}</span>'
        f'</a>'
    )


def patch_html(html_text: str, id_to_name: dict) -> str:
    """单文件 patch：宽度 + 关联笔记"""
    # 1. 宽度调整：max-width:1200px;margin:0 auto → max-width:100%
    # 只针对三处 max-width:1200px;margin:0 auto 的容器
    html_text = html_text.replace(
        "max-width:1200px;margin:0 auto;",
        "max-width:100%;padding-left:24px;padding-right:24px;"
    )
    # 补一下 main 的 padding（原来 main 是 padding:28px，现在变成 padding:28px 24px）
    html_text = html_text.replace(
        "main{max-width:100%;padding-left:24px;padding-right:24px;padding:28px}",
        "main{max-width:100%;padding:28px 24px;}",
    )
    # 如果 main 那行刚好没有变（max-width:1200px;margin:0 auto; 后面跟 \n 加 padding:28px）
    html_text = html_text.replace(
        "main{max-width:100%;padding-left:24px;padding-right:24px;\n  padding:28px}",
        "main{max-width:100%;padding:28px 24px;}",
    )

    # 2. 关联笔记 href + 文本修复
    # 匹配模式：
    #   <a class="rel-card" href="([技术概念-XXX]].html)"><span class="ico">[</span><span>([技术概念-XXX]])</span></a>
    #   注意原始 href 可能嵌套了 [[ 或 [ 后面 ]] 这种乱码
    rel_pattern = re.compile(
        r'<a class="rel-card" href="(\[[^\"]*?\.html)">'
        r'<span class="ico">[^<]*</span>'
        r'<span>([^<]+)</span>'
        r'</a>'
    )

    def replace_rel(m):
        return fix_rel_card(m, id_to_name)

    return rel_pattern.sub(replace_rel, html_text)


def main():
    if not RENDERED_DIR.is_dir():
        print(f"❌ 找不到目录: {RENDERED_DIR}")
        sys.exit(1)

    print("=" * 70)
    print("🔧 批量修复 144 个 KG 卡片（宽度 + 关联笔记）")
    print("=" * 70)

    # 加载 id → 中文名 映射
    print("\n📥 加载 KG JSON ...")
    id_to_name = load_id_to_name()
    print(f"   ✅ {len(id_to_name)} 个节点")

    files = sorted(RENDERED_DIR.glob("*.html"))
    print(f"\n📄 待修复: {len(files)} 个 HTML")

    success = 0
    failed = 0
    fixed_rel = 0
    fixed_width = 0

    for i, fp in enumerate(files, 1):
        try:
            html = fp.read_text(encoding="utf-8")

            # 统计原始状态
            had_max1200 = "max-width:1200px" in html
            had_broken_rel = bool(re.search(
                r'<a class="rel-card" href="\[[^\"]*?\.html">', html
            ))

            new_html = patch_html(html, id_to_name)

            # 统计修复量
            if had_max1200 and "max-width:1200px" not in new_html:
                fixed_width += 1
            if had_broken_rel and not re.search(
                r'<a class="rel-card" href="\[[^\"]*?\.html">', new_html
            ):
                fixed_rel += 1

            if new_html != html:
                fp.write_text(new_html, encoding="utf-8")
                success += 1
            else:
                success += 1  # 没改也视为成功

            if i % 20 == 0:
                print(f"   [{i}/{len(files)}] 已处理")
        except Exception as e:
            print(f"   [{i}/{len(files)}] ❌ {fp.name}: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print("📊 修复汇总")
    print("=" * 70)
    print(f"  ✅ 成功: {success}/{len(files)}")
    print(f"  ❌ 失败: {failed}")
    print(f"  🎨 修复宽度: {fixed_width}")
    print(f"  🔗 修复关联笔记: {fixed_rel}")

    # 二次验证
    print("\n🔍 二次验证 ...")
    remaining_broken = 0
    remaining_1200 = 0
    for fp in files:
        html = fp.read_text(encoding="utf-8")
        if re.search(r'<a class="rel-card" href="\[[^\"]*?\.html">', html):
            remaining_broken += 1
        if "max-width:1200px" in html:
            remaining_1200 += 1
    print(f"  残留死链: {remaining_broken}")
    print(f"  残留 max-width:1200px: {remaining_1200}")
    print()


if __name__ == "__main__":
    main()