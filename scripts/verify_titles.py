import re, glob, os
base = "E:/OH-workspace/antenna-tracker/public/kg-cards-rendered"
os.chdir(base)
files = sorted(glob.glob("*.html"))
noise = ["技术概念", "深度解读", "学习笔记"]
date_pat = re.compile(r'20\d{6}')
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    tt = re.search(r"<title>(.*?)</title>", html, re.S)
    tt = tt.group(1) if tt else ""
    h1 = re.search(r'<h1 class="title">(.*?)</h1>', html, re.S)
    h1raw = h1.group(1) if h1 else ""
    # title block text (h1 + title), excluding any 深度解读 that may be in body
    block = tt + " " + h1raw
    problems = []
    for n in noise:
        if n in block:
            problems.append(n)
    if date_pat.search(block):
        problems.append("date")
    if problems:
        bad.append((f, tt, h1raw, problems))
print(f"files with noise in TITLE BLOCK = {len(bad)}")
for f, tt, h1raw, p in bad:
    print(f"  [BAD] {f}  problems={p}")
    print(f"        title: {tt}")
    print(f"        h1   : {h1raw}")

# confirm 中兴/清华 still have 深度解读 in BODY only
print("\n=== body-only 深度解读 check (should still exist) ===")
for f in ["technology-中兴gigamimo空域资源深度重构-20260705.html",
          "technology-清华sc-ris自控制智能超表面-20260705.html"]:
    html = open(f, encoding="utf-8").read()
    in_block = ("深度解读" in re.search(r"<title>.*?</title>", html, re.S).group(1)) or \
               ("深度解读" in re.search(r'<h1 class="title">.*?</h1>', html, re.S).group(1))
    print(f"  {f}: body_has={ '深度解读' in html }  titleblock_has={in_block}")
print("\nVERIFY DONE")
