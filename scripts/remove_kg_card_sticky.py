#!/usr/bin/env python3
# 移除 144 张 KG 卡片 header.page-head 的 sticky 固定（让标题块随滚动条一起动）
import glob, os, re

CARD_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'kg-cards-rendered')
pattern = os.path.join(CARD_DIR, '*.html')

# 紧凑/多行都能匹配：position:sticky; top:0; z-index:20; （顺序固定，我脚本写入的）
RE_STICKY = re.compile(r'position:\s*sticky;\s*top:\s*0;\s*z-index:\s*20;')

hit = 0
miss = 0
for path in sorted(glob.glob(pattern)):
    with open(path, encoding='utf-8') as f:
        txt = f.read()
    if 'page-head' not in txt:
        continue
    if RE_STICKY.search(txt):
        new = RE_STICKY.sub('', txt)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
        hit += 1
    else:
        miss += 1

print(f'sticky removed: {hit} files')
print(f'no sticky found (skip): {miss} files')
