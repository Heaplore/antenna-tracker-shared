import re, glob, os
base = "E:/OH-workspace/antenna-tracker/public/kg-cards-rendered"
os.chdir(base)
files = sorted(glob.glob("*.html"))
KW = "深度解读"
print("=== files where 深度解读 appears in TITLE BLOCK (h1 or <title>) ===")
title_block_hits = []
for f in files:
    html = open(f, encoding="utf-8").read()
    title_tag = re.search(r"<title>(.*?)</title>", html, re.S)
    tt = title_tag.group(1) if title_tag else ""
    h1 = re.search(r'<h1 class="title">(.*?)</h1>', html, re.S)
    h1raw = h1.group(1) if h1 else ""
    h1text = re.sub(r'<span class="en">.*?</span>', '', h1raw).strip()
    in_title_tag = KW in tt
    in_h1 = KW in h1text
    in_body = KW in html and not in_title_tag and not in_h1
    if in_title_tag or in_h1:
        title_block_hits.append(f)
        print(f"\n[f] {f}")
        print(f"   <title>  has={in_title_tag}: {tt}")
        print(f"   h1.text  has={in_h1}: {h1text}")
print(f"\nTITLE-BLOCK 深度解读 count = {len(title_block_hits)}")

print("\n\n=== files where 深度解读 appears ONLY in body (must NOT touch) ===")
body_only = []
for f in files:
    html = open(f, encoding="utf-8").read()
    tt = re.search(r"<title>(.*?)</title>", html, re.S)
    tt = tt.group(1) if tt else ""
    h1 = re.search(r'<h1 class="title">(.*?)</h1>', html, re.S)
    h1raw = h1.group(1) if h1 else ""
    h1text = re.sub(r'<span class="en">.*?</span>', '', h1raw).strip()
    if KW in html and KW not in tt and KW not in h1text:
        body_only.append(f)
        print(f"   {f}")
print(f"\nBODY-ONLY 深度解读 count = {len(body_only)}")
