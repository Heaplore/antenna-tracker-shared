import re, glob, os
base = "E:/OH-workspace/antenna-tracker/public/kg-cards-rendered"
os.chdir(base)
files = sorted(glob.glob("*.html"))
print(f"total={len(files)}")
rows=[]
for f in files:
    html = open(f, encoding="utf-8").read()
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    title_tag = m.group(1).strip() if m else ""
    m2 = re.search(r'<h1 class="title">(.*?)</h1>', html, re.S)
    h1 = m2.group(1).strip() if m2 else ""
    en = ""
    m3 = re.search(r'<span class="en">(.*?)</span>', h1, re.S)
    if m3: en = m3.group(1).strip()
    h1_text = re.sub(r'<span class="en">.*?</span>', '', h1).strip()
    rows.append((f, title_tag, h1_text, en))

import re as _re
date_pat = _re.compile(r'-?20\d{6}')
prefixes = ["技术概念-","技术-","指标-","零件-","材料-","组件-","概念-","技术概念","技术/"]
print("\n===== PROBLEMATIC (prefix or date) =====")
prob=[]
for f, tt, ht, en in rows:
    bad=False
    reason=[]
    for p in prefixes:
        if p in ht or p in tt:
            bad=True; reason.append(f"prefix:{p}")
    if date_pat.search(ht) or date_pat.search(tt):
        bad=True; reason.append("date")
    if bad:
        prob.append((f, tt, ht, en, reason))
        print(f"\n[f] {f}")
        print(f"   <title>: {tt}")
        print(f"   h1.text: {ht}")
        print(f"   .en: {en}")
        print(f"   reason: {reason}")
print(f"\nPROBLEMATIC COUNT = {len(prob)}")

print("\n\n===== ALL h1.text (for review) =====")
for f, tt, ht, en in rows:
    print(f"{f} || {ht} || .en={en}")
