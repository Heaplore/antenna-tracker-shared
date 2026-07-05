#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-kg-images.py
=====================

从 Obsidian 天线技术笔记生成知识图谱卡片科普图 (调用 AGNES 多模态图片接口)。

工作流:
  1. 读取 app/_data/knowledge-graph.json
  2. 遍历每个节点, 基于笔记内容生成"科普图 prompt"
  3. POST AGNES /v1/images/generations, 下载到 public/data/kg-images/{nodeId}.png
  4. 增量: 已有图片且未强制 --force 跳过
  5. 输出 index.json 供前端按 nodeId 查图

特点:
  - 完全脱离 Hermes 内置 image_generate 工具 (该工具后端锁死 FAL/FLUX)
  - 直接 HTTP 调 AGNES /v1/images/generations (OpenAI-compatible)
  - 支持 --node <id> 单节点或 --all 全量
  - 支持 --layout 和 --style 风格选择 (4 个 baoyu 模板)
  - 失败重试 2 次, 失败节点记录到 errors.json

用法:
  python scripts/generate-kg-images.py --node technology-aau-yuanyuan-tianxian-danyuan-shendu-jiedu  # 单节点
  python scripts/generate-kg-images.py --layout hub-spoke --style technical-schematic --node AAU       # 自定义风格
  python scripts/generate-kg-images.py --layout hub-spoke --style technical-schematic --limit 4       # 限 4 张样本
  python scripts/generate-kg-images.py --force                                                       # 全量重建
"""

import os
import re
import json
import time
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from datetime import datetime

# ===== 路径配置 =====
KG_JSON = Path(r"E:/OH-workspace/antenna-tracker/app/_data/knowledge-graph.json")
OUT_DIR = Path(r"E:/OH-workspace/antenna-tracker/public/data/kg-images")
INDEX_FILE = OUT_DIR / "index.json"
ERRORS_FILE = OUT_DIR / "errors.json"

# ===== AGNES 配置 =====
AGNES_BASE = "https://apihub.agnes-ai.com/v1"
AGNES_API_KEY = "trQlNGVo5XZe9EkMZ1WNUki8mESt2DFStGBK5V8nRNBmlpQ2"
IMAGE_MODEL = "agnes-image-2.0-flash"

# ===== 4 个布局 × 风格组合 (baoyu skill 标准, 全部 16:9 横屏) =====
LAYOUT_STYLES = {
    "hub-spoke+technical-schematic": {
        "zh": "技术蓝图风 — 中心辐射 横屏",
        "prompt_block": (
            "Technical schematic / blueprint — clean line drawings, vector blueprint feel, "
            "blueprint background (#e8f1f7 with grid), thin black/dark navy lines + blue dimension "
            "annotations, isometric exploded view, engineering schematic font, like a real "
            "hardware technical manual. Landscape 16:9 horizontal, dense information layout."
        ),
        "structure": (
            "HUB-AND-SPOKE LAYOUT (landscape 16:9):\n"
            "- TITLE BAR (top, full width): main title centered + subtitle below\n"
            "- LEFT COLUMN (15% width): TYPE badge + tag list + key numbers callout\n"
            "- CENTER (45% width): isometric technical drawing of core entity, surrounded by 6-8 spoke annotations (numbered, with arrows)\n"
            "- RIGHT COLUMN (40% width): 2x3 grid of section cards, each card = section title + 2-3 bullet facts\n"
            "- BOTTOM BAR: extra metrics row, 4-6 callouts horizontally"
        ),
    },
    "dense-modules+pop-laboratory": {
        "zh": "实验室精确风 — 高密度模块 横屏",
        "prompt_block": (
            "Pop-laboratory precision style — blueprint grid background, coordinate markers, "
            "macaron pastel colors (mint/lavender/butter-yellow/cream-pink), rounded card shadows, "
            "white background with grid overlay. Landscape 16:9 horizontal canvas. High data-density."
        ),
        "structure": (
            "DENSE MODULES LAYOUT (landscape 16:9):\n"
            "- 12-cell masonry grid filling 16:9 canvas\n"
            "- TITLE (top 1 row, full width)\n"
            "- One-line headline (row 2)\n"
            "- 2-column body: left = core entity diagram, right = key numbers callouts\n"
            "- 4-column section grid (2 rows): each cell = section title + 3 facts\n"
            "- Footer row: tags + type badge + metadata"
        ),
    },
    "linear-progression+chalkboard": {
        "zh": "黑板讲解风 — 时间线 横屏",
        "prompt_block": (
            "Chalkboard / blackboard — black background with white/yellow/blue/orange chalk, "
            "chalk rough texture, hand-drawn vector style, like a teacher's classroom blackboard. "
            "Landscape 16:9 horizontal canvas. Multiple parallel info lanes."
        ),
        "structure": (
            "HORIZONTAL LINEAR PROGRESSION (landscape 16:9):\n"
            "- TOP ROW: title in chalk with underline\n"
            "- LEFT PANEL (20%): type + tags + analogy\n"
            "- CENTER BAND (50%): timeline/flowchart running left-to-right with 5-7 nodes\n"
            "- BOTTOM PANEL (30%, full width): 3-column section breakdown with bullets\n"
            "- Footer: key numbers callouts in chalk"
        ),
    },
    "hub-spoke+craft-handmade": {
        "zh": "手绘纸质风 — 工程师手帐 横屏",
        "prompt_block": (
            "Craft-handmade / paper craft — warm cream background (#f5efe3), paper grain texture, "
            "torn-paper edges, handwriting, watercolor soft colors, washi tape, like an engineer's "
            "personal notebook collage. Landscape 16:9 horizontal canvas. Cozy warmth."
        ),
        "structure": (
            "HUB-AND-SPOKE JOURNAL LAYOUT (landscape 16:9):\n"
            "- TITLE (top center, washi taped): main title + subtitle on a paper slip\n"
            "- LEFT: hand-drawn main entity sketch\n"
            "- RIGHT: 4-5 paper-note cards (washi taped) arranged in 2x3 grid, each = section title + facts\n"
            "- BOTTOM: handwritten key numbers on a kraft paper strip\n"
            "- Background: kraft paper texture with masking-tape decorations"
        ),
    },
}


# ===== 工具: 从笔记内容抽画面要素 =====

def extract_visual_payload(node: dict, max_sections: int = 12) -> dict:
    """从节点的 sections + oneLiner + tags 抽画面要素 (提取量提升, 覆盖笔记全部内容)。

    输出 keys:
    - name / type / oneLiner / analogy / tags
    - sectionTitles:所有 ## 段标题, 跳过元数据段
    - sectionSnippets:每个段的精简正文 (每段 ≤ 200 字, 供 prompt 使用)
    - keyNumbers:全部关键数字, 最多 12 个
    - facts:每段的 key bullet (按句子切片)
    """
    name = node.get("name", "概念")
    one_liner = node.get("oneLiner", "") or node.get("one_liner", "")
    analogy = node.get("analogy", "")
    tags = node.get("tags", []) or []
    sections = node.get("sections", []) or []

    skip_keywords = ("一句话版本", "类比入口", "关联笔记", "参考资料", "延伸阅读")

    # 全部章节 (不只是标题)
    useful_sections = []
    for s in sections:
        title = s.get("title", "").strip()
        content = (s.get("content") or "").strip()
        if not title or not content:
            continue
        if any(kw in title for kw in skip_keywords):
            continue
        useful_sections.append({"title": title, "content": content})
        if len(useful_sections) >= 20:  # 安全上限
            break

    # 关键数字
    key_numbers = []
    pat_num = re.compile(
        r"(\d{1,4}(?:[\.\-]\d+)?)\s*(?:%|GHz|MHz|dB|W|kg|μm|nm|°|度|通道|路|bit|×|x|元)"
        r"|(?:[1-9]\d{0,3}\s*~\s*[1-9]\d{0,3})\s*(?:MHz|GHz|W|dB|μm|通道|路|颗|个|单元|米|瓦|频段|阵)"
    )
    for s in useful_sections:
        for m in pat_num.finditer(s["content"]):
            num = m.group(0)
            if num and len(num) < 60:
                key_numbers.append(num)
            if len(key_numbers) >= 12:
                break
        if len(key_numbers) >= 12:
            break
    key_numbers = list(dict.fromkeys(key_numbers))[:12]  # 去重保序

    # 每段精简正文 (前 250 字) 给 prompt 喂肉
    section_snippets = []
    for s in useful_sections[: max_sections]:
        snippet = re.sub(r"\s+", " ", s["content"]).strip()
        section_snippets.append({
            "title": s["title"],
            "snippet": snippet[:250],
        })

    # 每段前 3 个事实句子 (top-3 key facts)
    facts_by_section = []
    for s in useful_sections[: max_sections]:
        sents = re.split(r"(?<=[。！？!?\.])\s+", s["content"])
        bullets = [t.strip().rstrip("。. ") for t in sents if 8 <= len(t.strip()) <= 140][:3]
        if bullets:
            facts_by_section.append({
                "title": s["title"],
                "bullets": bullets,
            })

    return {
        "name": name,
        "type": node.get("type", ""),
        "oneLiner": (one_liner or "")[:240],
        "analogy": (analogy or "")[:200],
        "tags": (tags or [])[:8],
        "keyNumbers": key_numbers,
        "sectionTitles": [s["title"] for s in section_snippets],
        "sectionSnippets": section_snippets,
        "factsBySection": facts_by_section,
        "totalSections": len(useful_sections),
    }


# ===== Prompt 构造 =====

def build_prompt(payload: dict, layout_style: str) -> str:
    """基于 payload + layout_style 构造英文 prompt (横版 16:9 适配电脑端,
    内容覆盖全笔记, 不只是演化)。
    """
    cfg = LAYOUT_STYLES[layout_style]
    name = payload["name"]
    one_liner = payload["oneLiner"]
    analogy = payload["analogy"]
    key_numbers = payload["keyNumbers"]
    section_snippets = payload["sectionSnippets"]
    facts_by_section = payload["factsBySection"]
    section_titles = payload["sectionTitles"]
    node_type_zh = {
        "technology": "技术概念",
        "metric": "指标术语",
        "component": "零部件",
        "material": "材料",
    }.get(payload["type"], "概念")

    parts = [
        "Educational technical infographic in Simplified Chinese.",
        "Landscape 16:9 horizontal layout for desktop browser viewing.",
        "Aspect ratio 16:9. Dense information layout. Use FULL canvas - no empty space.",
        "",
        f"Style: {cfg['prompt_block']}",
        "",
        f"Layout: {cfg['structure']}",
        "",
        f"Topic: {name} ({node_type_zh}) - total sections in source: {payload['totalSections']}",
        f"Subtitle (one-line headline): {one_liner}",
    ]
    if analogy:
        parts.append(f"Analogy (vernacular): {analogy}")
    if key_numbers:
        parts.append(f"All key numbers to highlight: {', '.join(key_numbers)}")

    # 把每个段的标题 + 关键事实列出来 — 确保笔记全部内容都被覆盖到画面里
    parts.append("")
    parts.append("SECTIONS TO COVER (must include every section's key facts):")
    for i, s in enumerate(section_snippets, 1):
        parts.append(f"\n[{i}] {s['title']}")
        # 优先用 bullets (更具象)
        bullets_for_section = None
        for f in facts_by_section:
            if f["title"] == s["title"]:
                bullets_for_section = f["bullets"]
                break
        if bullets_for_section:
            for b in bullets_for_section:
                parts.append(f"    - {b}")
        else:
            parts.append(f"    - {s['snippet'][:140]}")

    parts.append("")
    parts.append(f"Total sections shown: {len(section_snippets)}. Use 16:9 landscape.")
    parts.append(
        "Use clear small-medium Chinese sans-serif typography. "
        "Data-dense, no white space waste. Visual hierarchy clear (title > sections > bullets). "
        "Mandarin text must render EXACTLY as given - no romanization, no pinyin substitutions."
    )

    return "\n".join(parts)


# ===== AGNES API 调用 =====

def agnes_generate(prompt: str, size: str = "1536x864", max_retries: int = 2) -> bytes | None:
    """调 AGNES /v1/images/generations, 返回 PNG bytes。
    默认 size = 1536x864 (16:9 横屏, 适配电脑浏览器 KG 卡片查看)。
    """
    import ssl
    ctx = ssl.create_default_context()

    url = f"{AGNES_BASE}/images/generations"
    # 注意: AGNES 后端 agnes-t2i-general-model 不支持 response_format 参数
    # 必须省略 (LiteLLM proxy 不会自动 drop, 必须客户端清掉)
    payload = json.dumps({
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "size": size,
        "n": 1,
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={
            "Authorization": f"Bearer {AGNES_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    last_err = None
    for attempt in range(max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=180, context=ctx) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            url_out = body["data"][0].get("url")
            if not url_out:
                raise RuntimeError(f"no url in response: {body!r}")
            # 下载 PNG
            with urllib.request.urlopen(url_out, timeout=60, context=ctx) as img_resp:
                return img_resp.read()
        except (urllib.error.URLError, urllib.error.HTTPError, KeyError, RuntimeError) as e:
            last_err = e
            time.sleep(2 + attempt * 3)
    print(f"  ❌ {last_err}")
    return None


# ===== 主流程 =====

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--layout", default="hub-spoke", choices=list({k.split("+")[0] for k in LAYOUT_STYLES}))
    ap.add_argument("--style", default="technical-schematic", choices=list({k.split("+")[1] for k in LAYOUT_STYLES}))
    ap.add_argument("--node", help="只生成指定 nodeId (前缀匹配)")
    ap.add_argument("--limit", type=int, default=None, help="最多生成 N 张")
    ap.add_argument("--all", action="store_true", help="全量生成")
    ap.add_argument("--force", action="store_true", help="即使已存在也覆盖")
    ap.add_argument("--all-styles", action="store_true",
                    help="每个节点跑 4 个 layout+style 组合 (用于样本对比)")
    ap.add_argument("--output-dir", help="覆盖默认输出目录 (样本对比用)")
    ap.add_argument("--name-suffix", default="", help="输出文件名后缀 (样本对比用)")
    args = ap.parse_args()

    # 输出目录可覆盖
    global OUT_DIR
    if args.output_dir:
        OUT_DIR = Path(args.output_dir)
        OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not KG_JSON.exists():
        raise FileNotFoundError(f"先跑 build-kg-from-notes.py 生成 {KG_JSON}")

    kg = json.loads(KG_JSON.read_text(encoding="utf-8"))
    all_nodes = kg["nodes"]

    # 过滤
    nodes = all_nodes
    if args.node:
        nodes = [n for n in all_nodes if args.node.lower() in n["id"].lower()]
    if args.limit:
        nodes = nodes[: args.limit]

    # 选择 layout+style 组合
    if args.all_styles:
        styles_to_run = list(LAYOUT_STYLES.keys())
    else:
        styles_to_run = [f"{args.layout}+{args.style}"]
        if styles_to_run[0] not in LAYOUT_STYLES:
            styles_to_run = ["hub-spoke+technical-schematic"]

    print(f"🎨 节点: {len(nodes)} 张, 风格组合: {len(styles_to_run)} ({styles_to_run})")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index = {"lastUpdate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
             "images": {}, "mode": "multi-style" if args.all_styles else "single"}

    errors = []
    if ERRORS_FILE.exists():
        try:
            errors = json.loads(ERRORS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass

    success_count = 0
    skip_count = 0

    for i, node in enumerate(nodes, 1):
        node_id = node["id"]
        payload = extract_visual_payload(node)

        for style_key in styles_to_run:
            suffix = style_key.replace("+", "-")
            out_path = OUT_DIR / f"{node_id}{args.name_suffix}-{suffix}.png"
            print(f"  [{i}/{len(nodes)}] {node_id}  << {style_key}")

            # 增量跳过
            if out_path.exists() and not args.force:
                print(f"    ⏭️  跳过 (已存在)")
                skip_count += 1
                continue

            prompt = build_prompt(payload, style_key)

            png_bytes = agnes_generate(prompt)
            if png_bytes:
                out_path.write_bytes(png_bytes)
                print(f"    ✅ {len(png_bytes)//1024} KB -> {out_path.name}")
                success_count += 1
            else:
                errors.append({
                    "nodeId": node_id,
                    "styleKey": style_key,
                    "ts": datetime.now().isoformat(),
                })
            time.sleep(1.0)

    INDEX_FILE_LOCAL = OUT_DIR / "index.json"
    index["lastUpdate"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    index["totalSuccess"] = success_count
    index["totalSkip"] = skip_count
    index["totalErrors"] = len(errors)
    INDEX_FILE_LOCAL.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ 完成: 成功 {success_count}, 跳过 {skip_count}, 失败 {len(errors)}")
    print(f"📁 输出: {OUT_DIR}")


if __name__ == "__main__":
    main()
