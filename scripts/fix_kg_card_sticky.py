#!/usr/bin/env python3
# 批量给 144 张 KG 卡片的 header.page-head 加 sticky 常驻
# 让标题栏在 iframe 滚动时钉在顶部，不滚走
import glob, os, re

CARDS_DIR = r'E:\OH-workspace\antenna-tracker\public\kg-cards-rendered'
STICKY_CSS = 'position:sticky;top:0;z-index:20;'

files = sorted(glob.glob(os.path.join(CARDS_DIR, '*.html')))
total = len(files)
done = 0
skipped = 0
for f in files:
    with open(f, encoding='utf-8') as fh:
        txt = fh.read()
    # 已含 sticky 则跳过
    if 'header.page-head' in txt and 'position:sticky' in txt.split('header.page-head')[1].split('}')[0]:
        skipped += 1
        continue
    # 在 header.page-head{ 后插入 sticky
    new_txt, n = re.subn(
        r'(header\.page-head\{)',
        lambda m: m.group(1) + STICKY_CSS,
        txt,
        count=1,
    )
    if n == 0:
        print(f'  [WARN] 未匹配 header.page-head{{ : {os.path.basename(f)}')
        continue
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_txt)
    done += 1

print(f'总计 {total} 张 | 已处理 {done} | 跳过(已有sticky) {skipped}')

# 抽查验证
import random
sample = random.sample(files, min(3, len(files)))
for f in sample:
    with open(f, encoding='utf-8') as fh:
        t = fh.read()
    idx = t.find('header.page-head{')
    print(f'  {os.path.basename(f)}: ...{t[idx:idx+70]}...')
