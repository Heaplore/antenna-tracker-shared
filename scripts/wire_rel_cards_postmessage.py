"""
wire_rel_cards_postmessage.py
给 144 个 HTML 卡片的 .rel-card 链接注入 click 拦截：
- preventDefault 阻止浏览器跳转
- postMessage({type:'kg-nav', id:'canonical_id'}, '*') 通知父页面
父页面 page.tsx 监听 → setSelectedId(newId) → iframe 自动 remount

id 解析规则（从 href 反推）：
  /antenna-tracker/kg-cards-rendered/<type>-<name>.html
  type ∈ {technology, metric, component, material}
  decodeURI 后 filename 去 .html → canonical_id

用法：
    python scripts/wire_rel_cards_postmessage.py public/kg-cards-rendered/
    python scripts/wire_rel_cards_postmessage.py public/kg-cards-rendered/ --target out/kg-cards-rendered/
"""

import argparse
import re
import sys
from pathlib import Path

# 注入的 <script>，放在 body 结尾。
# 监听 root 上所有 .rel-card click，拦截 + postMessage
INJECT_SCRIPT = """
<script>
(function(){
  function wire(){
    document.querySelectorAll('a.rel-card[href*="kg-cards-rendered/"]').forEach(function(a){
      if (a.__kgWired) return;
      a.__kgWired = true;
      a.addEventListener('click', function(e){
        try {
          e.preventDefault();
          e.stopPropagation();
          var href = a.getAttribute('href') || '';
          var fn = href.split('/').pop() || '';
          fn = decodeURIComponent(fn).replace(/\\.html$/i, '');
          var id = fn;
          if (id && window.parent !== window) {
            window.parent.postMessage({type:'kg-nav', id:id}, '*');
          } else {
            window.location.href = href;
          }
        } catch(err) {
          console.warn('kg-card nav error', err);
        }
        return false;
      }, true);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
</script>
""".strip()


def process_dir(p: Path) -> tuple[int, int, int]:
    p = Path(p)
    if not p.is_dir():
        print(f"[ERR] {p} not a dir", file=sys.stderr)
        return (0, 0, 0)

    files = sorted(p.glob("*.html"))
    patched = 0
    skipped = 0
    failed = 0

    for f in files:
        try:
            html = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            try:
                html = f.read_text(encoding="gbk")
            except Exception as e:
                print(f"[FAIL] {f.name}: {e}", file=sys.stderr)
                failed += 1
                continue

        # 已注入过就跳过（用独特 token 判断）
        if "__kgWired" in html or "/kg-cards-rendered/" in html and "type:'kg-nav'" in html:
            skipped += 1
            continue

        # 在 </body> 前注入
        if "</body>" in html.lower():
            # case-insensitive 替换
            pat = re.compile(r"</body>", re.IGNORECASE)
            new_html = pat.sub(INJECT_SCRIPT + "\n</body>", html, count=1)
        else:
            # 没 </body> 就追加到尾部
            new_html = html + "\n" + INJECT_SCRIPT + "\n"

        try:
            f.write_text(new_html, encoding="utf-8")
            patched += 1
        except Exception as e:
            print(f"[FAIL] {f.name}: {e}", file=sys.stderr)
            failed += 1

    return (patched, skipped, failed)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", help="待处理的目录（包含 .html）")
    ap.add_argument("--target", help="可选，把处理完的内容镜像到另一目录（用于 同步到 out/）")
    args = ap.parse_args()

    src = Path(args.dir)
    patched, skipped, failed = process_dir(src)
    print(f"[src={src}] patched={patched} skipped={skipped} failed={failed}")

    if args.target:
        # 把处理后的 src 内容拷一份到 target（用 file copy，因为内容已经 patch 完毕）
        import shutil
        tgt = Path(args.target)
        tgt.mkdir(parents=True, exist_ok=True)
        copied = 0
        for f in src.glob("*.html"):
            shutil.copy2(f, tgt / f.name)
            copied += 1
        print(f"[mirror] {copied} files → {tgt}")


if __name__ == "__main__":
    main()
