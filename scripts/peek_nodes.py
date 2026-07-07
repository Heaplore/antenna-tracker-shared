import json, re
base = "E:/OH-workspace/antenna-tracker"
data = json.load(open(f"{base}/app/_data/knowledge-graph.json", encoding="utf-8"))
nodes = {n["id"]: n for n in data["nodes"]}

# the 8 problematic card filenames (minus .html)
targets = [
    "technology-6g信道建模范式转移-从统计拟合到数字孪生",
    "technology-metacrystal超晶体3d打印被动智能表面",
    "technology-mit-honibajr反射面天线低功耗抗干扰卫星通信",
    "technology-中兴gigamimo空域资源深度重构",
    "technology-华为u6ghz全场景产品矩阵",
    "technology-天线ai设计预测-三星lg电子工程实践",
    "technology-清华sc-ris自控制智能超表面",
    "technology-超表面天线metasurface-antenna",
]
for t in targets:
    n = nodes.get(t)
    if not n:
        print(f"[MISS] {t}")
        continue
    print(f"id={t}")
    print(f"  name   = {n.get('name')}")
    print(f"  nameEn = {n.get('nameEn')!r}")
    print(f"  filename = {n.get('filename')}")
    print()

# also check: does JSON still contain 深度解读 in any node NAME?
print("===== node names containing 深度解读 =====")
cnt=0
for n in data["nodes"]:
    if "深度解读" in n["name"]:
        print(f"  {n['id']}  ->  name={n['name']!r}")
        cnt+=1
print(f"  count={cnt}")
