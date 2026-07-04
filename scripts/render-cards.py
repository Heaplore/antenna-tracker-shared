#!/usr/bin/env python3
"""render-cards.py v2 - 渲染 KG 卡片 (按 sections[] 自动分类)"""

import json
import sys
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("需要安装 jinja2: pip install jinja2")
    sys.exit(1)

ROOT = Path(r"E:/OH-workspace/antenna-tracker")
TEMPLATES_DIR = ROOT / "public/kg-cards/templates"
SAMPLES_DIR = ROOT / "public/kg-cards/samples"
RENDERED_DIR = ROOT / "public/kg-cards/rendered"


def render_one(json_path: Path) -> Path | None:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    template_type = data.get("template", data.get("type", "technology"))
    template_file = f"{template_type}.html"

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    tmpl = env.get_template(template_file)
    html = tmpl.render(**data)

    out = RENDERED_DIR / f"{data['node_id']}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out


def main():
    RENDERED_DIR.mkdir(parents=True, exist_ok=True)
    targets = list(SAMPLES_DIR.glob("*.json"))
    print(f"渲染卡片: {len(targets)} 个\n")
    for j in targets:
        out = render_one(j)
        if out:
            print(f"  ✅ {j.name}  ->  {out.relative_to(ROOT)}  ({out.stat().st_size//1024} KB)")
        else:
            print(f"  ❌ {j.name}")


if __name__ == "__main__":
    main()
