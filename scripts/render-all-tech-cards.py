#!/usr/bin/env python3
"""render-all-tech-cards.py — 从 knowledge-graph.json 批量渲染技术概念类 KG 卡片。

用法:
    python scripts/render-all-tech-cards.py          # 渲染全部 67 个
    python scripts/render-all-tech-cards.py --node technology-aau有源天线单元深度解读  # 只渲染一个
    python scripts/render-all-tech-cards.py --dry    # 预览不渲染
"""

import json
import re
import sys
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("需要安装 jinja2: pip install jinja2")
    sys.exit(1)

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
TEMPLATES_DIR = ROOT / "public/kg-cards/templates"
RENDERED_DIR = ROOT / "public/kg-cards/rendered"
KG_FILE = ROOT / "app/_data/knowledge-graph.json"


def strip_markdown(text: str) -> str:
    """Strip common markdown formatting for HTML card rendering."""
    if not text:
        return ""
    # Strip bold/italic markers
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'```[\s\S]*?```', '', text)  # code fences
    text = re.sub(r'^[-*+] ', '', text, flags=re.MULTILINE)  # list bullets
    text = re.sub(r'^\d+\. ', '', text, flags=re.MULTILINE)  # numbered lists
    text = text.strip()
    return text


def parse_pipe_table(raw: str) -> tuple[list[str], list[list[str]], str | None]:
    """Parse pipe-style markdown tables. Returns (headers, rows, footer_or_none)."""
    lines = [l.strip() for l in raw.strip().split('\n') if l.strip()]
    if not lines:
        return [], [], None

    # Find header line (must have at least 2 pipes)
    header_line = None
    separator_idx = None
    for i, line in enumerate(lines):
        parts = [p.strip() for p in line.split('|') if p.strip() != '']
        if len(parts) >= 2:
            header_line = parts
            # Find separator line (---, |---|---|, etc.)
            for j in range(i + 1, len(lines)):
                sep = lines[j]
                sep_parts = [p.strip() for p in sep.split('|') if p.strip() != '']
                if all(re.match(r'^[-:]+$', p) for p in sep_parts):
                    separator_idx = j
                    break
            break

    if header_line is None:
        return [], [], None

    rows = []
    footer_parts = []
    for i, line in enumerate(lines):
        if i <= separator_idx:
            continue
        parts = [p.strip() for p in line.split('|') if p.strip() != '']
        if len(parts) == len(header_line):
            rows.append(parts)
        else:
            footer_parts.append(line)

    footer = '\n'.join(footer_parts) if footer_parts else None
    return header_line, rows, footer


def detect_and_parse_table(raw: str) -> dict | None:
    """Detect if raw text is a table (pipe or ASCII box) and parse it.
    Returns normalized section dict, or None if not a table."""
    raw_stripped = raw.strip()

    # 1. Check for pipe-style markdown table
    pipe_lines = [l for l in raw_stripped.split('\n') if l.strip() and '|' in l]
    if len(pipe_lines) >= 3:
        # At least 3 lines with pipes (header + separator + 1 data row minimum)
        header_match = False
        sep_found = False
        for i, line in enumerate(pipe_lines):
            parts = [p.strip() for p in line.split('|') if p.strip() != '']
            if len(parts) >= 2:
                header_match = True
                # Check if next line is a separator
                if i + 1 < len(pipe_lines):
                    next_parts = [p.strip() for p in pipe_lines[i+1].split('|') if p.strip() != '']
                    if all(re.match(r'^[-:]+$', p) for p in next_parts):
                        sep_found = True
                        break
        if header_match and sep_found:
            headers, rows, footer = parse_pipe_table(raw_stripped)
            if rows:
                result = {
                    "type": "comparison",
                    "table_headers": headers,
                    "table_rows": [[strip_markdown(cell) for cell in row] for row in rows],
                }
                if footer:
                    result["table_footer"] = strip_markdown(footer)
                return result

    # 2. Check for ASCII box-drawing table
    if "┌" in raw_stripped or ("│" in raw_stripped and "─" in raw_stripped):
        lines = [l for l in raw_stripped.split('\n') if l.strip() and not l.strip().startswith('┌') and not l.strip().startswith('└')]
        if lines:
            return {
                "type": "table",
                "table_headers": ["内容"],
                "table_rows": [[strip_markdown(l.strip())] for l in lines],
            }

    return None


def normalize_node(node: dict) -> dict:
    """把 KG JSON 节点映射成 technology.html 模板需要的字段。"""
    sections = []
    for s in node.get("sections", []):
        # 过滤掉 自检清单 等作者元数据
        title = s.get("title", "")
        if "自检清单" in title or "TODO" in title or "Checklist" in title:
            continue

        sec = {"title": strip_markdown(title)}
        level = s.get("level", 2)
        raw = s.get("raw", "") or ""
        content = s.get("content", "") or ""

        # 跳过一级标题（"一、概述" 这种）
        if level == 2 and len(raw.strip()) < 200:
            continue

        if level == 3:
            # 代码块 → code 类型
            if raw.strip().startswith("```"):
                sec["type"] = "code"
                sec["content"] = strip_markdown(raw.strip().replace("```", "").strip())
                sec["code_language"] = "markdown"
            else:
                # 尝试检测是否为表格（优先 pipe 表格，其次 ASCII 表格）
                table_result = detect_and_parse_table(raw)
                if table_result:
                    sec.update(table_result)
                else:
                    # 不是表格就是普通文本（段落/列表），统一走 text 类型
                    sec["type"] = "text"
                    sec["content"] = strip_markdown(raw.strip())
        else:
            sec["type"] = "text"
            sec["content"] = strip_markdown(raw.strip())

        sections.append(sec)

    # 构建 related 列表
    related = []
    for o in node.get("outgoing", []):
        related.append(o.get("targetId", ""))

    return {
        "node_id": node["id"],
        "type": node.get("type", "technology"),
        "name": node.get("name", ""),
        "english_name": node.get("nameEn", ""),
        "updated": node.get("updatedAt", ""),
        "one_liner": node.get("oneLiner", ""),
        "analogy": node.get("analogy", ""),
        "tags": node.get("tags", []),
        "sections": sections,
        "related": related,
    }


def render_one(normalized: dict) -> Path:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    tmpl = env.get_template("technology.html")
    html = tmpl.render(**normalized)

    out = RENDERED_DIR / f"{normalized['node_id']}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out


def main():
    RENDERED_DIR.mkdir(parents=True, exist_ok=True)

    # 加载 KG 数据
    kg = json.loads(KG_FILE.read_text(encoding="utf-8"))
    nodes = kg.get("nodes", [])

    # 过滤技术概念类
    tech_nodes = [n for n in nodes if n.get("type") == "technology"]

    # 支持 --node 参数
    if "--node" in sys.argv:
        idx = sys.argv.index("--node")
        if idx + 1 < len(sys.argv):
            target_id = sys.argv[idx + 1]
            tech_nodes = [n for n in tech_nodes if n["id"] == target_id]
            if not tech_nodes:
                print(f"❌ 未找到节点: {target_id}")
                sys.exit(1)

    # 支持 --dry 参数
    dry = "--dry" in sys.argv

    print(f"技术概念节点: {len(tech_nodes)} 个")
    if dry:
        print("(dry run，不写入文件)")

    success = 0
    for i, node in enumerate(tech_nodes, 1):
        norm = normalize_node(node)
        if dry:
            print(f"  [{i}/{len(tech_nodes)}] {norm['name']} → {norm['node_id']}.html")
            success += 1
            continue

        try:
            out = render_one(norm)
            size_kb = out.stat().st_size // 1024
            print(f"  [{i}/{len(tech_nodes)}] ✅ {norm['name']} ({size_kb} KB)")
            success += 1
        except Exception as e:
            print(f"  [{i}/{len(tech_nodes)}] ❌ {norm['name']}: {e}")

    print(f"\n完成: {success}/{len(tech_nodes)}")


if __name__ == "__main__":
    main()
