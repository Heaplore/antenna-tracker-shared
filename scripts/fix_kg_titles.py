import re, os
base = "E:/OH-workspace/antenna-tracker/public/kg-cards-rendered"
os.chdir(base)

DRY = os.environ.get("DRY", "1") == "1"

# Part A: full rebuild (prefix + date cards)
partA = {
  "technology-6g信道建模范式转移-从统计拟合到数字孪生.html": ("6G信道建模范式转移-从统计拟合到数字孪生", "ChannelLM"),
  "technology-metacrystal超晶体3d打印被动智能表面.html": ("Metacrystal超晶体3D打印被动智能表面", "Metacrystal"),
  "technology-mit-honibajr反射面天线低功耗抗干扰卫星通信.html": ("MIT-HoNiBAJR反射面天线低功耗抗干扰卫星通信", "MIT-HoNiBAJR"),
  "technology-中兴gigamimo空域资源深度重构-20260705.html": ("中兴GigaMIMO空域资源深度重构", "GigaMIMO"),
  "technology-华为u6ghz全场景产品矩阵-20260705.html": ("华为U6GHz全场景产品矩阵", "U6GHz"),
  "technology-天线ai设计预测-三星lg电子工程实践.html": ("天线AI设计预测-三星LG电子工程实践", "AI"),
  "technology-清华sc-ris自控制智能超表面-20260705.html": ("清华SC-RIS自控制智能超表面", "SC-RIS"),
  "technology-超表面天线metasurface-antenna.html": ("超表面天线", "Metasurface Antenna"),
}

# Part B: strip 深度解读 from h1 + title
partB = [
  "component-天线罩radome.html",
  "metric-s参数s-parameters.html",
  "metric-vswr电压驻波比.html",
  "metric-天线增益antenna-gain.html",
  "metric-天线带宽bandwidth.html",
  "metric-天线效率antenna-efficiency.html",
  "metric-天线方向图radiation-pattern.html",
  "metric-天线测量antenna-measurement.html",
  "metric-天线隔离度antenna-isolation.html",
  "metric-阻抗匹配impedance-matching.html",
  "technology-aau有源天线单元.html",
  "technology-mimo天线技术解读.html",
  "technology-wi-fi-7-mimo天线技术-20260623-2.html",
  "technology-半波偶极子dipole-antenna.html",
  "technology-可转向天线ra-6g通感融合.html",
  "technology-圆极化天线circular-polarization.html",
  "technology-微带贴片天线patch-antenna.html",
  "technology-抛物面反射器天线.html",
  "technology-智能反射面ris.html",
  "technology-极化分集polarization-diversity-20260623-1.html",
  "technology-波束赋形beamforming.html",
  "technology-电磁屏蔽与emc-shielding.html",
  "technology-相控阵天线phased-array-antenna.html",
  "technology-菲涅尔区天线.html",
]

def cur_h1(html):
    m = re.search(r'<h1 class="title">(.*?)</h1>', html, re.S)
    return m.group(1).strip() if m else ""
def cur_title(html):
    m = re.search(r'<title>(.*?)</title>', html, re.S)
    return m.group(1).strip() if m else ""

def apply(html, new_h1, new_title):
    html = re.sub(r'(<h1 class="title">).*?(</h1>)', lambda m: m.group(1)+new_h1+m.group(2), html, count=1, flags=re.S)
    html = re.sub(r'(<title>).*?(</title>)', lambda m: m.group(1)+new_title+m.group(2), html, count=1, flags=re.S)
    return html

total = 0
for f, (cn, en) in partA.items():
    html = open(f, encoding="utf-8").read()
    old_h1, old_t = cur_h1(html), cur_title(html)
    new_h1 = f'{cn} <span class="en">{en}</span>'
    new_t = f'{cn}（{en}） · 知识卡片' if en else f'{cn} · 知识卡片'
    if DRY:
        print(f"[A] {f}")
        print(f"    h1: {old_h1}  ==>  {new_h1}")
        print(f"    t  : {old_t}  ==>  {new_t}")
    else:
        open(f, "w", encoding="utf-8").write(apply(html, new_h1, new_t))
    total += 1

for f in partB:
    html = open(f, encoding="utf-8").read()
    old_h1, old_t = cur_h1(html), cur_title(html)
    # strip 深度解读 from h1 content and title
    new_h1_raw = old_h1.replace('深度解读', '')
    new_h1_raw = re.sub(r'\s{2,}', ' ', new_h1_raw).strip()
    new_t_raw = old_t.replace('深度解读', '')
    new_t_raw = re.sub(r'\s{2,}', ' ', new_t_raw).strip()
    if DRY:
        print(f"[B] {f}")
        print(f"    h1: {old_h1}  ==>  {new_h1_raw}")
        print(f"    t  : {old_t}  ==>  {new_t_raw}")
    else:
        # apply, preserving the .en span structure (only text changed)
        html2 = re.sub(r'(<h1 class="title">).*?(</h1>)', lambda m: m.group(1)+new_h1_raw+m.group(2), html, count=1, flags=re.S)
        html2 = re.sub(r'(<title>).*?(</title>)', lambda m: m.group(1)+new_t_raw+m.group(2), html2, count=1, flags=re.S)
        open(f, "w", encoding="utf-8").write(html2)
    total += 1

print(f"\nTOTAL files to change = {total}  (DRY={DRY})")
