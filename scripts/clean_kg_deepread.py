#!/usr/bin/env python3
# 清理 KG 节点名/卡片标题里的"深度解读"噪声字眼
# 1) knowledge-graph.json: 节点 id/name/filename 去"深度解读"，边引用同步替换
# 2) 卡片 HTML: 文件重命名 + h1.title 内部去"深度解读"
import json, os, re

KG = os.path.join(os.path.dirname(__file__), '..', 'app', '_data', 'knowledge-graph.json')
CARD_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'kg-cards-rendered')

# ---------- 1. JSON ----------
with open(KG, encoding='utf-8') as f:
    data = json.load(f)

mapping = {}
for n in data['nodes']:
    i = n.get('id', '')
    if '深度解读' in i:
        mapping[i] = i.replace('深度解读', '')

for n in data['nodes']:
    if n.get('id') in mapping:
        n['id'] = mapping[n['id']]
    for fld in ('name', 'filename'):
        if fld in n and isinstance(n[fld], str) and '深度解读' in n[fld]:
            n[fld] = n[fld].replace('深度解读', '')

# links: 任意字符串字段值精确匹配脏 id 则替换
for lk in data.get('links', []):
    for k, v in list(lk.items()):
        if isinstance(v, str) and v in mapping:
            lk[k] = mapping[v]

with open(KG, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f'JSON updated. node mapping count = {len(mapping)}')

# ---------- 2. 卡片文件 ----------
renamed = 0
missing = 0
for old_id, new_id in mapping.items():
    old_path = os.path.join(CARD_DIR, old_id + '.html')
    new_path = os.path.join(CARD_DIR, new_id + '.html')
    if not os.path.exists(old_path):
        print('WARN missing card:', old_path)
        missing += 1
        continue
    with open(old_path, encoding='utf-8') as fh:
        html = fh.read()

    def fix_title(m):
        inner = m.group(2).replace('深度解读', '')
        inner = re.sub(r'\s{2,}', ' ', inner).strip()
        return f'<h1{m.group(1)}>{inner}</h1>'

    html2 = re.sub(r'<h1([^>]*class="title"[^>]*)>(.*?)</h1>', fix_title, html, flags=re.S)
    with open(old_path, 'w', encoding='utf-8') as fh:
        fh.write(html2)
    os.rename(old_path, new_path)
    renamed += 1

print(f'cards renamed = {renamed}, missing = {missing}')
for o, nid in mapping.items():
    print(f'  {o} -> {nid}')
