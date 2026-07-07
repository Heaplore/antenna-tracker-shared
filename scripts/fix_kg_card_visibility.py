"""
批量修复 KG 卡片 visibility:hidden bug
根因：masonry JS 在 innerWidth<=760 时跳过，不添加 masonry-ready，
     导致 article.card 保持 visibility:hidden 永久不可见。
修复：移除 visibility:hidden 防闪烁机制，卡片始终可见。
"""
import os, re, glob

DIR = r"E:\OH-workspace\antenna-tracker\public\kg-cards-rendered"
PATTERN_VH = re.compile(r'\s*main\s*>\s*article\.card\{visibility:hidden\}')
PATTERN_VV = re.compile(r'\s*main\.masonry-ready\s*>\s*article\.card\{visibility:visible\}')

count_fixed = 0
count_skipped = 0

for html_file in sorted(glob.glob(os.path.join(DIR, "*.html"))):
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否有这两行
        has_hidden = bool(PATTERN_VH.search(content))
        has_visible = bool(PATTERN_VV.search(content))
        
        if not (has_hidden or has_visible):
            count_skipped += 1
            continue
        
        # 移除这两行（保留换行格式）
        new_content = PATTERN_VH.sub('', content)
        new_content = PATTERN_VV.sub('', new_content)
        
        if new_content != content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count_fixed += 1
    except Exception as e:
        print(f"ERROR {os.path.basename(html_file)}: {e}")

total_files = len(list(glob.glob(os.path.join(DIR, "*.html"))))
print(f"Done: {count_fixed} files fixed / {count_skipped} skipped (no match) / {total_files} total")

# 验证：抽样检查 3 个文件是否干净
print("\n--- Verification ---")
sample_files = sorted(glob.glob(os.path.join(DIR, "*.html")))[:3]
for sf in sample_files:
    with open(sf, 'r', encoding='utf-8') as f:
        txt = f.read()
    still_has = PATTERN_VH.search(txt) or PATTERN_VV.search(txt)
    print(f"{os.path.basename(sf)}: {'STILL HAS BUG' if still_has else 'CLEAN'}")
