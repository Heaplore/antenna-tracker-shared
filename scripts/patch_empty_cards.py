#!/usr/bin/env python3
"""patch_empty_cards.py — 把渲染器失败空 main 的 7 张 KG 卡片补上 article.card

策略：直接读 Obsidian markdown 源，把 ## / ### 段落转 article.card 注入 HTML。
同步写 public/ 和 out/。完全无依赖（只用 re）。

用法：
    python patch_empty_cards.py
"""

import re
from pathlib import Path

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
VAULT = Path(r"E:/我的知识库/我的知识库")
OUT_DIR = ROOT / "out/kg-cards-rendered"
PUBLIC_DIR = ROOT / "public/kg-cards-rendered"

# 7 张空卡片对应的 markdown 路径（绝对路径，硬编码）
TARGETS = [
    (
        "technology-metacrystal超晶体3d打印被动智能表面.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-Metacrystal超晶体3D打印被动智能表面-20260628.md",
    ),
    (
        "technology-mit-honibajr反射面天线低功耗抗干扰卫星通信.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-MIT-HoNiBAJR反射面天线低功耗抗干扰卫星通信-20260628.md",
    ),
    (
        "technology-中兴gigamimo空域资源深度重构-20260705.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-中兴GigaMIMO空域资源深度重构-20260705.md",
    ),
    (
        "technology-华为u6ghz全场景产品矩阵-20260705.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-华为U6GHz全场景产品矩阵-20260705.md",
    ),
    (
        "technology-天线ai设计预测-三星lg电子工程实践.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-天线AI设计预测-三星LG电子工程实践-20260619.md",
    ),
    (
        "technology-清华sc-ris自控制智能超表面-20260705.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-清华SC-RIS自控制智能超表面-20260705.md",
    ),
    (
        "technology-超表面天线metasurface-antenna.html",
        r"E:/我的知识库/我的知识库/资料库/天线技术/技术概念-超表面天线Metasurface-Antenna-20260630.md",
    ),
]


# ---------- markdown → HTML（轻量版，够 KG 卡片用） ----------

def md_to_html(text: str) -> str:
    """轻量 markdown 转 HTML：处理段落 / 列表 / 代码块 / 表格 / 引用 / 强调。
    不处理 heading（heading 已经在外层处理为 h2/h3 分组）。
    """
    lines = text.split("\n")
    out = []
    i = 0
    in_code = False
    code_buf = []
    code_lang = ""

    def flush_p():
        """合并连续文本行为 <p>"""
        if not out:
            return
        last = out[-1]
        if isinstance(last, str) and last and not last.startswith("<"):
            # 简洁场景：上一步已经是文本，连一起
            return

    in_list = None  # 'ul' | 'ol' | None
    list_buf = []
    in_table = False
    table_buf = []  # [[row cells], ...]
    table_aligns = []

    def close_list():
        nonlocal in_list, list_buf
        if in_list and list_buf:
            if in_list == "ul":
                out.append("<ul>")
            else:
                out.append("<ol>")
            for li in list_buf:
                # li 里的内联
                out.append(f"<li>{inline_md(li)}</li>")
            out.append(f"</{in_list}>")
            list_buf = []
        in_list = None

    def close_table():
        nonlocal in_table, table_buf, table_aligns
        if in_table and table_buf:
            out.append('<div class="tw"><table>')
            header = table_buf[0]
            out.append("<thead><tr>")
            for c in header:
                out.append(f"<th>{inline_md(c)}</th>")
            out.append("</tr></thead><tbody>")
            for row in table_buf[1:]:
                out.append("<tr>")
                for c in row:
                    out.append(f"<td>{inline_md(c)}</td>")
                out.append("</tr>")
            out.append("</tbody></table></div>")
            table_buf = []
        in_table = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # code block toggle
        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_lang = stripped[3:].strip()
                code_buf = []
            else:
                close_list()
                close_table()
                cls = ' class="language-{}"'.format(code_lang) if code_lang else ""
                code_html = "\n".join(code_buf)
                code_html = code_html.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                out.append(f"<pre><code{cls}>{code_html}</code></pre>")
                in_code = False
                code_buf = []
                code_lang = ""
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # 空行 — 但空行后紧跟 list 项就不关
        if not stripped:
            # peek 下一行
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            nxt = lines[j].strip() if j < len(lines) else ""
            nxt_is_list = bool(re.match(r"^\s*[-*+]\s", nxt) or re.match(r"^\s*\d+\.\s", nxt))
            if not nxt_is_list:
                close_list()
            close_table()
            i += 1
            continue

        # heading (在 article 内部还可能有 h3/h4)
        hm = re.match(r"^(#{2,6})\s+(.+?)\s*$", stripped)
        if hm:
            close_list()
            close_table()
            level = len(hm.group(1))
            content = inline_md(hm.group(2))
            if level <= 4:
                out.append(f"<h{level}>{content}</h{level}>")
            i += 1
            continue

        # blockquote
        if stripped.startswith(">"):
            close_list()
            close_table()
            bq_buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                bq_buf.append(lines[i].strip()[1:].strip())
                i += 1
            bq_text = inline_md(" ".join(bq_buf))
            out.append(f"<blockquote>{bq_text}</blockquote>")
            continue

        # table  - markdown 表格 "a | b | c |" 或 "| a | b | c |"
        # 判定：当前行有 | 且下一行是 align 行（多个 ---）
        if (
            "|" in stripped
            and i + 1 < len(lines)
            and re.search(r"\|\s*:?-{2,}:?\s*\|", lines[i + 1])
        ):
            close_list()

            def parse_table_row(row_line: str) -> list[str]:
                inner = row_line.strip()
                if inner.startswith("|"):
                    inner = inner[1:]
                if inner.endswith("|"):
                    inner = inner[:-1]
                return [c.strip() for c in inner.split("|")]

            # header 行
            table_buf = [parse_table_row(stripped)]
            # skip align 行
            i += 2
            # data 行
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_buf.append(parse_table_row(lines[i].strip()))
                i += 1
            out.append('<div class="tw"><table>')
            for ri, row in enumerate(table_buf):
                tag = "th" if ri == 0 else "td"
                wrap = "thead" if ri == 0 else "tbody"
                if ri == 0:
                    out.append("<thead><tr>")
                elif ri == 1:
                    out.append("<tbody><tr>")
                else:
                    out.append("<tr>")
                for c in row:
                    out.append(f"<{tag}>{inline_md(c)}</{tag}>")
                out.append("</tr>")
                if ri == 0:
                    out.append("</thead>")
                elif ri == len(table_buf) - 1:
                    out.append("</tbody>")
            out.append("</table></div>")
            continue
        else:
            if in_table:
                close_table()

        # list
        ul_m = re.match(r"^(\s*)[-*+]\s+(.+)$", line)
        ol_m = re.match(r"^(\s*)\d+\.\s+(.+)$", line)
        if ul_m or ol_m:
            if in_list == "ol" and not ul_m:
                close_list()
            if in_list == "ul" and not ol_m:
                close_list()
            in_list = "ul" if ul_m else "ol"
            content = ul_m.group(2) if ul_m else ol_m.group(2)
            list_buf.append(content)
            i += 1
            continue
        else:
            close_list()

        # 普通段落：合并相邻非空行到下一段边界
        para = [line]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            nxt_stripped = nxt.strip()
            if not nxt_stripped:
                break
            if (
                nxt_stripped.startswith("#")
                or nxt_stripped.startswith("```")
                or nxt_stripped.startswith(">")
                or nxt_stripped.startswith("|")
                or re.match(r"^\s*[-*+]\s", nxt)
                or re.match(r"^\s*\d+\.\s", nxt)
            ):
                break
            para.append(nxt)
            i += 1
        out.append(f"<p>{inline_md(' '.join(para))}</p>")

    close_list()
    close_table()
    if in_code:
        out.append("<pre><code>" + "\n".join(code_buf) + "</code></pre>")

    return "\n".join(str(o) for o in out)


def inline_md(s: str) -> str:
    """行内 markdown: **bold** *italic* `code` [text](url) [[wikilink]]"""
    s = s.replace("&", "&amp;")
    # 反过来先保护代码
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![*])\*([^*]+)\*(?![*])", r"<em>\1</em>", s)
    # [[wikilink]] -> 显示成链接
    s = re.sub(r"\[\[([^\]]+)\]\]", r"<span class='wl'>\1</span>", s)
    return s


# ---------- markdown sections 提取 ----------

def parse_md_sections(md_text: str) -> list[dict]:
    """提取 ## / ### 段，返回 [{level, title, body}]"""
    # 去除 frontmatter
    body = md_text
    if body.startswith("---"):
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n", body, re.DOTALL)
        if m:
            body = body[m.end():]

    sections = []
    cur = None
    buf = []
    for line in body.split("\n"):
        hm = re.match(r"^(#{2,6})\s+(.+?)\s*$", line)
        if hm:
            if cur is not None:
                cur["body"] = "\n".join(buf).strip()
                sections.append(cur)
            cur = {"level": len(hm.group(1)), "title": hm.group(2).strip()}
            buf = []
        else:
            buf.append(line)
    if cur is not None:
        cur["body"] = "\n".join(buf).strip()
        sections.append(cur)
    return sections


def sections_to_articles(sections: list[dict]) -> str:
    """把 sections 转成 article.card HTML 字符串。

    智能切分规则（适配老大写作风格）：
      - 如果只 1 个 level=2 ## 章（顶级标题），下面全是 level=3 ### 子节：
        每个 ### 一张 article（article 内嵌 ## 顶部标题当 lead）
      - 否则：每个 level=2 ## 一张 article，level 3+ 内嵌
      - 只有一个 ##（且下面没 ###） → 整篇一张 article
    """
    if not sections:
        return ""

    # 智能切分：单 ## + 全部 ###
    n_h2 = sum(1 for s in sections if s["level"] == 2)
    n_h3 = sum(1 for s in sections if s["level"] == 3)
    n_h4p = sum(1 for s in sections if s["level"] >= 4)

    # 模式 A: 单 ## + 任意 ### (老大主笔记风格：超表面、龙勃、AAU)
    # 触发：n_h2 == 1 且下面有 level=3+
    if n_h2 == 1 and n_h3 > 0:
        # 把所有 level <= 3 的 section 当 chapter 边界
        # level >= 4 的 section 内嵌到上一个 chapter
        top = sections[0]
        chapters = []  # [{title, body_lines: []}]
        cur_chapter = None
        for s in sections[1:]:
            if s["level"] <= 3:
                if cur_chapter is not None:
                    chapters.append(cur_chapter)
                cur_chapter = {"title": s["title"], "body_parts": []}
                cur_chapter["body_parts"].append(s.get("body", ""))
            else:
                # level 4+ 内嵌到当前 chapter — 每个 section 占一段（前后留空行）
                if cur_chapter is not None:
                    cur_chapter["body_parts"].append(f"#### {s['title']}\n\n{s.get('body','')}\n\n")
                else:
                    # 没有 chapter 直接是 level 4+ → 当成孤儿 chapter
                    cur_chapter = {"title": s["title"], "body_parts": [s.get("body", "")]}
        if cur_chapter is not None:
            chapters.append(cur_chapter)

        # 顶部 article: 引子 + 哪些 lead specials（类比入口/一句话之类）放在 lead 里
        # 实际很难判定，简单点：只把 body 真正有内容的 chapter 拆出来，其余都进 top article
        SPECIAL_TITLE_KEYS = ["一句话", "类比", "核心结论", "工程笔记", "结论"]
        lead_chapters = []
        chapter_sections = []
        for ch in chapters:
            t = ch["title"]
            if any(k in t for k in SPECIAL_TITLE_KEYS):
                lead_chapters.append(ch)
            else:
                chapter_sections.append(ch)

        articles = []

        # 顶部 article
        if lead_chapters or top.get("body", "").strip():
            top_body_parts = []
            if top.get("body", "").strip():
                top_body_parts.append(top["body"])
            for ch in lead_chapters:
                lead_body = "\n\n".join(ch["body_parts"])
                top_body_parts.append(f"### {ch['title']}\n\n{lead_body}")
            body_html = md_to_html("\n\n".join(top_body_parts))
            title_html = inline_md(top["title"])
            if body_html.strip():
                inner = f"<h2>{title_html}</h2>\n{body_html}"
            else:
                inner = f"<h2>{title_html}</h2>"
            articles.append(f'  <article class="card">\n{inner}\n  </article>')

        # 每个 chapter article
        for ch in chapter_sections:
            body_text = "\n\n".join(ch["body_parts"]).strip()
            body_md = f"### {ch['title']}\n\n{body_text}" if body_text else f"### {ch['title']}"
            body_html = md_to_html(body_md)
            if body_html.strip():
                articles.append(f'  <article class="card">\n{body_html}\n  </article>')

        if articles:
            return "\n".join(articles) + "\n"

    # 模式 C: 0 个 ## + N 个 ### （一些简短笔记只有 ### 标题）
    if n_h2 == 0 and n_h3 > 0:
        articles = []
        for s in sections:
            t = s.get("title", "").strip()
            body = s.get("body", "").strip()
            if not t and not body:
                continue
            body_md = f"### {t}\n{body}" if body else f"### {t}"
            body_html = md_to_html(body_md)
            if body_html.strip():
                # 当成 chapter article（h3 是章节名）
                articles.append(f'  <article class="card">\n{body_html}\n  </article>')
        if articles:
            return "\n".join(articles) + "\n"

    # 模式 B: 每个 level=2 ## 各一张 article（含 level 3+ 子节）
    articles = []
    cur_article = None
    cur_body = []

    def close_article():
        nonlocal cur_article, cur_body
        if cur_article is not None:
            body_html = md_to_html("\n".join(cur_body))
            if body_html.strip() or cur_article.get("title_html"):
                if cur_article.get("title_html") and body_html.strip():
                    inner = f"<h2>{cur_article['title_html']}</h2>\n{body_html}"
                elif cur_article.get("title_html"):
                    inner = f"<h2>{cur_article['title_html']}</h2>"
                else:
                    inner = body_html
                articles.append(f'  <article class="card">\n{inner}\n  </article>')
        cur_article = None
        cur_body = []

    for sec in sections:
        body_text = sec.get("body", "").strip()
        title = sec.get("title", "").strip()

        if sec["level"] == 2:
            close_article()
            cur_article = {"title_html": inline_md(title)}
            cur_body = []
        else:
            cur_body.append(f"{'#' * sec['level']} {title}")
            cur_body.append(body_text)

    close_article()

    # 兜底：完全空 sections
    if not articles:
        return ""

    return "\n".join(articles) + "\n"


# ---------- patch HTML ----------

def patch_html(html_text: str, articles_md: str) -> str:
    """把 articles HTML 注入到 <main> 内，紧跟在 <div class="masonry">...</div> 之后。"""
    if not articles_md.strip():
        return html_text

    # 找 <main> 后的第一个 <div class="masonry">...</div> 块结尾
    masonry_pat = re.compile(r'(<div class="masonry">\s*<div class="masonry-col[^"]*"></div>\s*<div class="masonry-col[^"]*"></div>\s*</div>)', re.DOTALL)
    m = masonry_pat.search(html_text)
    if not m:
        # 退而求其次：找 <main> 后直接插
        return html_text.replace("<main>", f"<main>\n{articles_md}", 1)
    # 在 masonry 占位之后插入
    insert_at = m.end()
    return html_text[:insert_at] + "\n" + articles_md + html_text[insert_at:]


def normalize_lede(html: str, lede_text: str) -> str:
    """如果 </header> 后没有 <p class="lede">，尝试从首段添加一个 lede。"""
    if '<p class="lede">' in html:
        return html
    # 不动它（很多卡片 lede 是空）
    return html


def process_one(html_filename: str, md_path: str) -> tuple[bool, str]:
    md_path_p = Path(md_path)
    if not md_path_p.exists():
        return False, f"❌ {html_filename}: markdown 源不存在 ({md_path})"

    md_text = md_path_p.read_text(encoding="utf-8")
    sections = parse_md_sections(md_text)

    if not sections:
        return False, f"❌ {html_filename}: markdown 无 ## 段落"

    articles_md = sections_to_articles(sections)

    # patch out
    out_html = OUT_DIR / html_filename
    if not out_html.exists():
        return False, f"❌ {html_filename}: out/ 里没有"

    html_text = out_html.read_text(encoding="utf-8")

    if "<article class=\"card\"" in html_text:
        return True, f"⏭️  {html_filename}: 已有 article.card，跳过"

    new_html = patch_html(html_text, articles_md)
    # 对 public 也写一份
    public_html = PUBLIC_DIR / html_filename

    # 双重保险：再写 public 一份
    out_html.write_text(new_html, encoding="utf-8")
    if public_html.exists() or True:  # public 可能没这文件（旧版没同步），照样写
        public_html.parent.mkdir(parents=True, exist_ok=True)
        public_html.write_text(new_html, encoding="utf-8")

    article_count = new_html.count('<article class="card">')
    return True, f"✅ {html_filename}: 注入 {article_count} 张 article.card ({len(sections)} sections)"


def main():
    print(f"=== patch_empty_cards.py ===")
    print(f"ROOT: {ROOT}")
    print(f"OUT:  {OUT_DIR}")
    print(f"PUB:  {PUBLIC_DIR}")
    print(f"VAULT:{VAULT}")
    print()
    print(f"目标: {len(TARGETS)} 张空卡片")
    print()

    ok = 0
    for html_filename, md_path in TARGETS:
        success, msg = process_one(html_filename, md_path)
        print(msg)
        if success:
            ok += 1

    print()
    print(f"=== 完成: {ok}/{len(TARGETS)} 成功 ===")


if __name__ == "__main__":
    main()
