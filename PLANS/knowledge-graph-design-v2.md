# 知识图谱设计方案 v2.0

> 目标：从 23 篇天线技术笔记自动抽取实体和关系，构建可交互的知识图谱页面。
> 数据源：`E:\我的知识库\我的知识库\资料库\天线技术\` 下的 23 篇笔记
> 输出：`antenna-tracker/app/_data/knowledge-graph.json`

---

## 一、实体分类与节点展示

### 1.1 实体类型（3 类）

| 类型 | 标识 | 节点颜色 | 节点大小 | 是否展示趋势 |
|------|------|---------|---------|------------|
| **技术概念** | `tech` | 蓝色 `#3B82F6` | 大（半径 20px） | ✅ 是 |
| **指标术语** | `metric` | 灰色 `#9CA3AF` | 中（半径 14px） | ❌ 否 |
| **零部件** | `component` | 橙色 `#F59E0B` | 中（半径 14px） | ❌ 否 |

### 1.2 23 篇笔记分类

**技术概念（13 篇）→ 主干节点：**
1. 波束赋形 Beamforming
2. 相控阵天线 Phased Array
3. MIMO 天线技术
4. AAU 有源天线单元
5. 微带贴片天线 Patch Antenna
6. 抛物面反射器天线
7. 半波偶极子 Dipole Antenna
8. 圆极化天线 Circular Polarization
9. 极化分集 Polarization Diversity
10. 可转向天线 RA
11. 菲涅尔区 Fresnel Zone
12. Wi-Fi 7 MIMO
13. 电磁屏蔽与 EMC Shielding

**指标术语（7 篇）→ 枝干节点：**
1. 天线增益 Antenna Gain
2. 天线带宽 Bandwidth
3. 天线效率 Antenna Efficiency
4. 天线方向图 Radiation Pattern
5. VSWR 电压驻波比
6. S 参数 S-Parameters
7. 阻抗匹配 Impedance Matching

**零部件（3 篇）→ 枝干节点：**
1. 天线罩 Radome
2. 天线测量 Antenna Measurement
3. 天线隔离度 Antenna Isolation

---

## 二、右侧面板内容规范

所有节点点击后都在右侧面板展示内容，但不同类型展示的内容不同。

### 2.1 技术概念节点（tech）— 5 个 Tab

**Tab 1: 概述**
- 名称 + 一句话版本（从笔记 `## 一句话版本` 提取）
- 类比入口（从笔记 `## 类比入口` 提取）
- 核心公式（1-2 个最重要的公式）
- 关键指标（从笔记表格中提取 3-5 个核心参数）

**Tab 2: 趋势**
- **技术成熟度等级**：标注当前技术处于哪个阶段
  - 来源：从正文"趋势判断"、"产业化"、"商用"等关键词推导
  - 等级定义：`实验室 → 原型验证 → 小规模商用 → 大规模商用 → 成熟`
  - 示例：波束赋形 = 大规模商用（5G 已部署）；RIS 相关 = 小规模商用；6G 近场通信 = 实验室
- **趋势时间轴**：垂直时间线，从起源 → 关键里程碑 → 当前 → 未来
  - 数据来源：正文"技术演进"、"从...到..."、"三代演变"等章节
  - 格式：`{ year: "2020", event: "5G 基站 64T64R 商用", source: "波束赋形" }`
- **演进路径**：水平流程图，展示技术迭代
  - 数据来源：正文中"演进"、"架构演变"、"从...到..."章节
  - 格式：`["模拟波束赋形", "数字波束赋形", "混合波束赋形", "AI 自适应波束"]`
- **趋势预测**：短/中/长期卡片
  - 数据来源：正文中"未来趋势"、"趋势判断"章节
  - 格式：`{ short_term: "...", mid_term: "...", long_term: "..." }`

**Tab 3: 关联技术对比**
- 列出与该实体有直接关联的其他技术概念（从 frontmatter `关联` 字段 + 正文交叉引用中提取）
- 每个关联技术显示：名称 + 一句话差异/关系说明
- 示例：波束赋形 ↔ 相控阵天线（波束赋形是相控阵的核心算法）

**Tab 4: 指标关系**
- 列出与该技术服务相关的指标术语（如：波束赋形 → 改善 → 天线增益）
- 每条关系标注关系类型（improves / affects / measured_by）

**Tab 5: 笔记原文**
- 一键跳转原始笔记链接

### 2.2 指标术语节点（metric）— 4 个 Tab

**Tab 1: 概述**
- 名称 + 一句话版本
- 类比入口
- 核心公式（1-2 个最重要的公式）

**Tab 2: 典型值**
- 从笔记表格中提取"常见值/对照表"
- 格式：`{ 场景: "5G AAU (64T)", 典型值: "20-25 dBi", 说明: "宽带高增益" }`

**Tab 3: 测量方式**
- 从笔记"测量方法"章节提取
- 格式：`{ 方法: "比较法", 精度: "±0.2dB", 适用: "消声室环境" }`

**Tab 4: 关联技术**
- 列出使用该指标或受该指标影响的技术概念
- 示例：天线增益 → 影响 → 波束赋形、相控阵、AAU

### 2.3 零部件节点（component）— 4 个 Tab

**Tab 1: 概述**
- 名称 + 一句话版本
- 类比入口
- 功能描述

**Tab 2: 原材料**
- 从笔记中提取使用的材料
- 示例（天线罩）：`{ 材料: "PTFE 特氟龙", Dk: "2.1", Df: "0.0002", 适用: "Sub-6GHz" }`
- 示例（AAU 功放）：`{ 材料: "GaN 氮化镓", 效率: "55-60%", 适用: "5G 主流" }`

**Tab 3: 加工工艺**
- 从笔记中提取制造工艺
- 示例（贴片天线）：`{ 工艺: "PCB 蚀刻", 精度: "微米级", 适用: "毫米波" }`
- 示例（天线罩）：`{ 工艺: "SCB 发泡工程", 特点: "低 Dk 泡沫" }`

**Tab 4: 关键参数**
- 从笔记表格中提取核心参数
- 关联的技术概念（这个零部件用在哪些技术中）

---

## 三、关系定义

### 3.1 关系类型

| 关系 | 方向 | 说明 | 示例 |
|------|------|------|------|
| `evolves_into` | 单向 | 技术演进 | 模拟波束赋形 → 数字波束赋形 |
| `relates_to` | 双向 | 概念关联 | 波束赋形 ↔ 相控阵 |
| `uses` | 单向 | 使用关系 | 相控阵 使用 波束赋形 |
| `improves` | 单向 | 性能改善 | 波束赋形 改善 天线增益 |
| `affects` | 双向 | 相互影响 | 天线罩 影响 天线增益 |
| `measured_by` | 单向 | 测量关系 | 天线增益 用 S 参数 测量 |
| `part_of` | 单向 | 组成关系 | 功放 是 AAU 的一部分 |
| `compared_with` | 双向 | 对比关系 | RIS vs Metacrystal |

### 3.2 关系可视化

- **实线**：tech ↔ tech 关系
- **虚线**：tech ↔ metric / tech ↔ component 关系
- **颜色**：不同关系类型不同颜色

---

## 四、数据文件格式

### 4.1 knowledge-graph.json 结构

```json
{
  "version": "2.0",
  "lastUpdate": "2026-06-30",
  "source": "资料库/天线技术/",
  
  "entityTypes": {
    "tech": { "label": "技术概念", "color": "#3B82F6", "radius": 20 },
    "metric": { "label": "指标术语", "color": "#9CA3AF", "radius": 14 },
    "component": { "label": "零部件", "color": "#F59E0B", "radius": 14 }
  },
  
  "relationTypes": {
    "evolves_into": { "label": "演进为", "style": "solid", "color": "#3B82F6" },
    "relates_to": { "label": "相关", "style": "solid", "color": "#9CA3AF" },
    "uses": { "label": "使用", "style": "solid", "color": "#F59E0B" },
    "improves": { "label": "改善", "style": "solid", "color": "#10B981" },
    "affects": { "label": "影响", "style": "dashed", "color": "#8B5CF6" },
    "measured_by": { "label": "用...测量", "style": "dashed", "color": "#8B5CF6" },
    "part_of": { "label": "属于", "style": "dashed", "color": "#92400E" },
    "compared_with": { "label": "对比", "style": "dashed", "color": "#EF4444" }
  },
  
  "entities": [
    {
      "id": "tech_bf001",
      "type": "tech",
      "name": "波束赋形 Beamforming",
      "nameEn": "Beamforming",
      "description": "通过控制多天线单元相位和幅度实现定向信号传输",
      "oneLiner": "用许多根天线'按节奏'协同发声，把无线信号变成一束精准的'无形激光'",
      "analogy": "交响乐团指挥——控制每个乐手的节奏，让声音在某个方向特别响",
      "keyFormula": "AF(θ) = Σ w_n · exp(j·n·k·d·cos(θ))",
      "keyMetrics": [
        { "name": "波束宽度", "value": "5°~30°" },
        { "name": "波束切换时间", "value": "微秒级" }
      ],
      "maturity": "大规模商用",
      "maturityLevel": 4,
      "trend": {
        "timeline": [
          { "year": "1960s", "event": "相控阵雷达首次应用", "source": "相控阵天线" },
          { "year": "2010s", "event": "4G Massive MIMO 引入波束赋形", "source": "MIMO天线技术" },
          { "year": "2020s", "event": "5G 全数字/混合波束赋形商用", "source": "波束赋形" },
          { "year": "2026", "event": "华为 U6GHz 256通道 AAU 商用", "source": "AAU有源天线单元" },
          { "year": "2028+", "event": "AI 自适应波束管理 + 6G 三维波束赋形", "source": "波束赋形" }
        ],
        "evolution": [
          "模拟波束赋形",
          "数字波束赋形",
          "混合波束赋形",
          "AI 自适应波束",
          "三维智能波束"
        ],
        "prediction": {
          "short_term": "Massive MIMO 成为基站标配，64T64R → 128T128R",
          "mid_term": "AI 驱动的自适应波束管理，预测用户轨迹提前调相",
          "long_term": "6G 三维波束赋形 + 近场通信 + 太赫兹频段"
        }
      },
      "relatedTechs": [
        {
          "targetId": "tech_pa001",
          "relation": "uses",
          "description": "相控阵天线使用波束赋形实现电子扫描"
        },
        {
          "targetId": "tech_mimo001",
          "relation": "relates_to",
          "description": "波束赋形是 MIMO 的核心使能技术"
        }
      ],
      "relatedMetrics": [
        {
          "targetId": "metric_gain001",
          "relation": "improves",
          "description": "波束赋形改善天线增益"
        }
      ],
      "sourceNote": "笔记-波束赋形Beamforming深度解读-20260618"
    },
    
    {
      "id": "metric_gain001",
      "type": "metric",
      "name": "天线增益 Antenna Gain",
      "nameEn": "Gain",
      "description": "天线在特定方向上的辐射强度与理想全向天线的比值",
      "oneLiner": "不是放大信号，而是重新分配能量——让信号'喊得更准'而不是'喊得更响'",
      "analogy": "手电筒——灯泡功率没变，加反光罩后照射方向更亮了",
      "keyFormula": "G(θ,φ) = η × D(θ,φ)，其中 D = 4π × U_max / P_rad",
      "typicalValues": [
        { "scenario": "手机内置天线", "value": "0-2 dBi", "note": "受限于尺寸" },
        { "scenario": "5G AAU (64T)", "value": "20-25 dBi", "note": "宽带高增益" },
        { "scenario": "抛物面天线 (3m)", "value": "38-42 dBi", "note": "卫星通信" }
      ],
      "measurementMethods": [
        { "method": "比较法", "precision": "±0.2dB", "condition": "消声室环境" },
        { "method": "方向图积分法", "precision": "±0.5dB", "condition": "需完整三维方向图" },
        { "method": "OTA (TRP/TIS)", "precision": "±0.3dB", "condition": "3GPP TS 38.561" }
      ],
      "relatedTechs": [
        { "targetId": "tech_bf001", "relation": "improved_by", "description": "波束赋形改善天线增益" },
        { "targetId": "tech_pa001", "relation": "improved_by", "description": "相控阵提升阵列增益" }
      ],
      "sourceNote": "笔记-天线增益Antenna-Gain-20260629"
    },
    
    {
      "id": "component_radome001",
      "type": "component",
      "name": "天线罩 Radome",
      "nameEn": "Radome",
      "description": "保护天线免受风雨侵蚀同时保持电磁透明的外壳",
      "oneLiner": "天线的'透明盔甲'——扛得住台风冰雹，又要让无线电波毫无阻碍地穿过",
      "analogy": "窗户玻璃——既要坚固防风，又要透明透光",
      "materials": [
        { "material": "PTFE 特氟龙", "Dk": "2.1", "Df": "0.0002", "band": "Sub-6GHz" },
        { "material": "发泡 PBT", "Dk": "1.1-1.5", "Df": "0.001-0.003", "band": "mmWave" },
        { "material": "PTFE@PPS 纳米泡沫", "Dk": "1.19", "Df": "0.000255", "band": "THz (6G)" }
      ],
      "manufacturing": [
        { "process": "SCB 发泡工程", "description": "Furukawa 技术，低 Dk 泡沫" },
        { "process": "A 型夹层结构", "description": "表皮+芯材+表皮，相消干涉抵消反射" },
        { "process": "变厚度流线型", "description": "GA+RT 算法优化厚度分布" }
      ],
      "keyParams": [
        { "param": "插入损耗", "value": "0.1-0.8dB" },
        { "param": "波束指向误差", "value": "< 0.5°" },
        { "param": "工作温度", "value": "-40°C ~ +70°C" }
      ],
      "relatedTechs": [
        { "targetId": "tech_patch001", "relation": "used_in", "description": "贴片天线常配天线罩保护" },
        { "targetId": "tech_bf001", "relation": "affects", "description": "天线罩影响波束赋形精度" }
      ],
      "sourceNote": "笔记-天线罩Radome深度解读-20260629"
    }
  ],
  
  "relations": [
    {
      "source": "tech_bf001",
      "target": "tech_pa001",
      "relation": "uses",
      "description": "相控阵天线使用波束赋形实现电子扫描"
    }
  ]
}
```

---

## 五、笔记模板规范

### 5.1 技术概念笔记模板

写技术概念笔记时，**必须**包含以下结构化章节：

```markdown
---
平台: hanako
作者: 小月
触发源: mcp-hanako: 小月
创建日期: YYYY-MM-DD
更新日期: YYYY-MM-DD
标签: [标签1, 标签2]
状态: 完成
关联:
  - 笔记-XXX
  - 笔记-YYY
---

## 一句话版本
> 一句话概括这个技术是什么、解决什么问题

## 类比入口
> 用生活类比解释核心概念

## 一、核心原理
（正文内容...）

## 二、技术演进
### 第一代：XXX（年份范围）
- 特点：...
- 代表产品/方案：...

### 第二代：XXX（年份范围）
- 特点：...
- 代表产品/方案：...

### 第三代：XXX（年份范围）
- 特点：...
- 代表产品/方案：...

## 三、关键指标
| 指标 | 典型值 | 说明 |
|------|-------|------|
| ... | ... | ... |

## 四、核心公式
（1-2 个最重要的公式）

## 五、应用领域
（应用场景）

## 六、工程挑战
（实际部署中的坑）

## 七、技术成熟度
当前技术所处阶段：□ 实验室 □ 原型验证 □ 小规模商用 □ 大规模商用 □ 成熟
判断依据：...

## 八、未来趋势
### 短期（1-2 年）
- ...

### 中期（3-5 年）
- ...

### 长期（5 年以上）
- ...

## 九、一句话总结
> 给非专业读者的总结
```

**关键字段说明：**
- `## 二、技术演进`：必须用"第一代/第二代/第三代"格式，每代标注年份范围和代表方案
- `## 七、技术成熟度`：必须勾选当前所处阶段（5 选 1）+ 判断依据
- `## 八、未来趋势`：必须分短/中/长期三个时间维度
- `关联`：frontmatter 中的关联字段，列出相关的笔记名（用于构建关系）

### 5.2 指标术语笔记模板

```markdown
---
平台: hanako
作者: 小月
触发源: mcp-hanako: 小月
创建日期: YYYY-MM-DD
更新日期: YYYY-MM-DD
标签: [标签1, 标签2]
状态: 完成
关联:
  - 笔记-XXX
---

## 一句话版本
> 一句话解释这个指标是什么

## 类比入口
> 用生活类比解释

## 一、定义与公式
（核心定义 + 关键公式）

## 二、典型值/范围
| 场景 | 典型值 | 说明 |
|------|-------|------|
| ... | ... | ... |

## 三、测量方法
| 方法 | 精度 | 适用条件 |
|------|------|---------|
| ... | ... | ... |

## 四、关联技术
（这个指标影响/服务于哪些技术概念）

## 五、一句话总结
> 给非专业读者的总结
```

### 5.3 零部件笔记模板

```markdown
---
平台: hanako
作者: 小月
触发源: mcp-hanako: 小月
创建日期: YYYY-MM-DD
更新日期: YYYY-MM-DD
标签: [标签1, 标签2]
状态: 完成
关联:
  - 笔记-XXX
---

## 一句话版本
> 一句话解释这个零部件是什么、干什么用的

## 类比入口
> 用生活类比解释

## 一、功能描述
（这个零部件的功能）

## 二、原材料
| 材料 | 关键参数 | 适用频段/场景 |
|------|---------|-------------|
| ... | ... | ... |

## 三、加工工艺
| 工艺 | 说明 | 特点 |
|------|------|------|
| ... | ... | ... |

## 四、关键参数
| 参数 | 典型值 | 说明 |
|------|-------|------|
| ... | ... | ... |

## 五、所属技术
（这个零部件用在哪些技术概念中）

## 六、一句话总结
> 给非专业读者的总结
```

---

## 六、自动抽取脚本逻辑

### 6.1 从笔记到实体的映射

```python
# 1. 读取笔记 frontmatter
fm = extract_frontmatter(note)
entity = {
    "name": parse_title(note),
    "type": classify_entity(note, fm),  # tech / metric / component
    "oneLiner": extract_section(note, "一句话版本"),
    "analogy": extract_section(note, "类比入口"),
    "keyFormula": extract_formulas(note),
    "keyMetrics": extract_tables(note),
    "relatedNotes": fm.get("关联", []),
    "sourceNote": note_filename
}

# 2. 技术概念特殊处理
if entity.type == "tech":
    entity["trend"] = {
        "timeline": extract_timeline(note),      # 从"技术演进"章节解析
        "evolution": extract_evolution_chain(note),  # 从"第一代/第二代/第三代"提取
        "prediction": extract_predictions(note)    # 从"未来趋势"章节提取
    }
    entity["maturity"] = extract_maturity(note)  # 从"技术成熟度"章节提取

# 3. 指标术语特殊处理
if entity.type == "metric":
    entity["typicalValues"] = extract_table(note, "典型值")
    entity["measurementMethods"] = extract_table(note, "测量方法")

# 4. 零部件特殊处理
if entity.type == "component":
    entity["materials"] = extract_table(note, "原材料")
    entity["manufacturing"] = extract_table(note, "加工工艺")
    entity["keyParams"] = extract_table(note, "关键参数")

# 5. 关系抽取
relations = []
# 从关联字段
for related in fm.get("关联", []):
    relations.append({
        "source": entity.id,
        "target": resolve_note_to_id(related),
        "relation": "relates_to"
    })
```

### 6.2 实体分类规则

```python
def classify_entity(note, fm):
    title = parse_title(note)
    
    # 技术概念关键词
    tech_keywords = ["波束赋形", "相控阵", "MIMO", "AAU", "贴片天线", 
                     "抛物面", "偶极子", "圆极化", "极化分集", "可转向",
                     "菲涅尔区", "Wi-Fi 7", "RIS", "超表面", "EMC"]
    if any(kw in title for kw in tech_keywords):
        return "tech"
    
    # 指标术语关键词
    metric_keywords = ["增益", "带宽", "效率", "方向图", "驻波比", 
                       "VSWR", "S参数", "阻抗匹配", "隔离度"]
    if any(kw in title for kw in metric_keywords):
        return "metric"
    
    # 零部件关键词
    component_keywords = ["天线罩", "天线测量", "天线隔离度"]
    if any(kw in title for kw in component_keywords):
        return "component"
    
    return "metric"  # 默认归类为指标
```

---

## 七、页面交互设计

### 7.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  Navbar: 天线行业情报追踪系统                              │
├─────────────────────────────────────────────────────────┤
│  搜索框  │  类型筛选: [全部] [技术概念] [指标] [零部件]   │
├──────────────────────────┬──────────────────────────────┤
│                          │                              │
│   D3 Force Graph         │   右侧详情面板                 │
│   （图谱可视化）           │                              │
│                          │   Tab 1: 概述                 │
│   - 节点按类型着色        │   Tab 2: 趋势 (仅tech)      │
│   - 节点按类型分大小      │   Tab 3: 关联技术对比       │
│   - 连线按关系类型着色    │   Tab 4: 指标关系           │
│   - 可缩放/拖拽          │   Tab 5: 笔记原文           │
│   - 点击节点高亮子图     │                              │
│   - hover 显示名称       │   ── 指标节点 ──             │
│                          │   Tab 1: 概述                 │
│                          │   Tab 2: 典型值               │
│                          │   Tab 3: 测量方式             │
│                          │   Tab 4: 关联技术             │
│                          │                              │
│                          │   ── 零部件节点 ──            │
│                          │   Tab 1: 概述                 │
│                          │   Tab 2: 原材料               │
│                          │   Tab 3: 加工工艺             │
│                          │   Tab 4: 关键参数             │
├──────────────────────────┴──────────────────────────────┤
│  底部: 统计信息 (实体总数 / 关系总数 / 最近更新)          │
└─────────────────────────────────────────────────────────┘
```

### 7.2 交互行为

1. **鼠标悬停**：显示实体名称 + 类型标签
2. **点击节点**：
   - 高亮该节点及其所有相连的节点和边
   - 其他节点和边变淡
   - 右侧面板加载对应 Tab 内容
3. **双击节点**：聚焦并放大该节点
4. **类型筛选**：只显示指定类型的节点和它们之间的连接
5. **搜索**：输入关键词，高亮匹配的节点
6. **重置视图**：回到初始布局

### 7.3 趋势可视化细节

**成熟度等级**：
- 可视化：5 级进度条，当前等级高亮
- 等级定义：
  - 1 = 实验室（理论研究，无原型）
  - 2 = 原型验证（实验室原型，未商用）
  - 3 = 小规模商用（试点部署，未大规模）
  - 4 = 大规模商用（已广泛部署）
  - 5 = 成熟（标准化，无可疑突破空间）

**时间轴**：
- 垂直时间线，左侧是年份，右侧是事件描述
- 过去的事件用实心圆点，未来的预测用空心圆点
- 每个事件可点击跳转到相关笔记

**演进路径**：
- 水平流程图，箭头表示演进方向
- 当前阶段高亮显示
- 每个阶段可点击查看详细描述

**趋势预测卡片**：
- 三列布局：短期 / 中期 / 长期
- 每张卡片显示时间范围 + 关键判断

---

## 八、实施步骤

### Phase 1: 数据抽取脚本
1. 编写 `scripts/extract-knowledge-graph.ts`
2. 解析 23 篇笔记的 frontmatter + 正文
3. 生成 `app/_data/knowledge-graph.json`
4. 验证数据结构

### Phase 2: 页面重构
1. 重构 `app/knowledge-graph/page.tsx`
2. 实现 D3 Force Graph 可视化
3. 实现右侧详情面板（动态 Tab）
4. 实现趋势可视化组件（时间轴/演进路径/成熟度/预测）
5. 实现搜索 + 类型筛选

### Phase 3: 模板规范
1. 制定 3 种笔记模板（技术概念 / 指标术语 / 零部件）
2. 更新小月的笔记生成 prompt
3. 验证新笔记能正确抽取

### Phase 4: 持续更新
1. 每次新笔记写入后，自动运行抽取脚本
2. 增量更新 knowledge-graph.json
3. 部署到 GitHub Pages

---

## 九、注意事项

1. **节点去重**：同一技术可能在多篇笔记中提到，需要合并
2. **ID 生成**：使用 `type_{name_slug}` 格式生成唯一 ID
3. **关系方向性**：`evolves_into`、`uses`、`part_of` 是有方向的；`relates_to`、`compared_with` 是无方向的
4. **性能**：23 个实体 + 约 50-100 条关系，D3 渲染无压力
5. **可扩展**：未来新增笔记时，只需按模板写，脚本自动抽取
6. **回退**：如果某篇笔记缺少某个结构化章节，对应字段为空数组/对象，不报错
7. **成熟度推导**：如果笔记没有显式的"技术成熟度"章节，脚本从关键词（"实验室"、"商用"、"试点"、"标准"）自动推断
