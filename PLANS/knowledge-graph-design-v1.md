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
13. 电磁屏蔽与 EMC Shielding（有演进历程）

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

### 1.3 节点点击展示内容

#### 技术概念节点（主干）

点击后右侧面板分 3 个 Tab：

**Tab 1: 概述**
- 名称 + 一句话版本（从笔记 `## 一句话版本` 提取）
- 类比入口（从笔记 `## 类比入口` 提取）
- 核心公式（从笔记中提取 1-2 个关键公式）
- 关联笔记（从 frontmatter `关联` 字段提取）

**Tab 2: 趋势**（核心功能）
- **时间轴**：垂直时间线，从起源 → 关键里程碑 → 当前 → 未来
  - 数据来源：正文中"第一代/第二代/第三代"、年份数字（2024/2025/2026）、"演进"章节
  - 格式：`{ year: "2020", event: "5G 基站 64T64R 商用", source: "波束赋形" }`
- **演进路径**：水平流程图，展示技术迭代
  - 数据来源：正文中"演进"、"架构演变"、"从...到..."章节
  - 格式：`["模拟波束赋形", "数字波束赋形", "混合波束赋形", "AI 自适应波束"]`
- **趋势预测**：短/中/长期卡片
  - 数据来源：正文中"未来三年"、"趋势"章节
  - 格式：`{ short_term: "...", mid_term: "...", long_term: "..." }`

**Tab 3: 关联**
- 与该技术直接相关的所有实体列表（从关联字段 + 正文引用中提取）
- 每条关联标注关系类型（uses / evolved_from / related_to / component_of）

#### 指标术语节点（枝干）

点击后右侧面板只显示一个 Tab：

**概述**
- 名称 + 一句话版本
- 关键公式（1-2 个）
- 典型值/范围表格
- 关联的技术概念（点击可跳转到技术概念节点）

#### 零部件节点（枝干）

点击后右侧面板只显示一个 Tab：

**概述**
- 名称 + 功能描述
- 关键参数/规格
- 应用场景（属于哪些技术概念）
- 关联的技术概念

#### 标准节点（枝干）

点击后右侧面板只显示一个 Tab：

**概述**
- 标准号 + 全称
- 涉及的技术/领域
- 发布/更新时间

---

## 二、关系定义

### 2.1 关系类型

| 关系 | 方向 | 说明 | 示例 |
|------|------|------|------|
| `evolves_into` | 单向 | 技术演进 | 模拟波束赋形 → 数字波束赋形 |
| `relates_to` | 双向 | 概念关联 | 波束赋形 ↔ 相控阵 |
| `uses` | 单向 | 使用关系 | 相控阵 使用 波束赋形 |
| `improves` | 单向 | 性能改进 | 波束赋形 改善 天线增益 |
| `measured_by` | 单向 | 测量关系 | 天线增益 用 S 参数 测量 |
| `part_of` | 单向 | 组成关系 | 功放 是 AAU 的一部分 |
| `enabled_by` | 单向 | 使能关系 | 毫米波通信 使能 6G |
| `compared_with` | 双向 | 对比关系 | RIS vs Metacrystal |

### 2.2 关系可视化

- **实线**：主干之间的关系（tech ↔ tech）
- **虚线**：枝干之间的关系（metric ↔ tech）
- **颜色**：不同关系类型用不同颜色
  - `evolves_into`: 蓝色渐变箭头
  - `relates_to`: 灰色
  - `uses`: 橙色
  - `improves`: 绿色
  - `measured_by`: 紫色
  - `part_of`: 棕色
  - `compared_with`: 红色

---

## 三、数据文件格式

### 3.1 knowledge-graph.json

```json
{
  "version": "1.0",
  "lastUpdate": "2026-06-30",
  "source": "资料库/天线技术/",
  
  "entityTypes": {
    "tech": { "label": "技术概念", "color": "#3B82F6", "radius": 20 },
    "metric": { "label": "指标术语", "color": "#9CA3AF", "radius": 14 },
    "component": { "label": "零部件", "color": "#F59E0B", "radius": 14 },
    "standard": { "label": "标准", "color": "#10B981", "radius": 10 }
  },
  
  "relationTypes": {
    "evolves_into": { "label": "演进为", "style": "solid", "color": "#3B82F6" },
    "relates_to": { "label": "相关", "style": "solid", "color": "#9CA3AF" },
    "uses": { "label": "使用", "style": "solid", "color": "#F59E0B" },
    "improves": { "label": "改善", "style": "solid", "color": "#10B981" },
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
      "relatedNotes": [
        "笔记-MIMO天线技术解读-20260616",
        "笔记-AAU有源天线单元深度解读-20260622"
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
      "keyFormula": "G(θ,φ) = η × D(θ,φ)，其中 D = 4π × U_max / P_rad",
      "keyMetrics": [
        { "name": "手机内置天线", "value": "0-2 dBi" },
        { "name": "5G AAU (64T)", "value": "20-25 dBi" },
        { "name": "抛物面天线 (3m)", "value": "38-42 dBi" }
      ],
      "relatedTech": ["tech_bf001", "tech_pa001", "tech_mimo001"],
      "sourceNote": "笔记-天线增益Antenna-Gain-20260629"
    }
  ],
  
  "relations": [
    {
      "source": "tech_bf001",
      "target": "tech_pa001",
      "relation": "uses",
      "description": "相控阵天线使用波束赋形技术"
    },
    {
      "source": "metric_gain001",
      "target": "tech_bf001",
      "relation": "improves",
      "description": "波束赋形改善天线增益"
    }
  ]
}
```

---

## 四、笔记模板规范

### 4.1 技术概念笔记模板

写技术概念笔记时，必须包含以下结构化字段：

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

## 七、未来趋势
### 短期（1-2 年）
- ...

### 中期（3-5 年）
- ...

### 长期（5 年以上）
- ...

## 八、一句话总结
> 给非专业读者的总结
```

**关键字段说明：**
- `## 二、技术演进`：必须用"第一代/第二代/第三代"格式，每代标注年份范围和代表方案
- `## 七、未来趋势`：必须分短/中/长期三个时间维度
- `关联`：frontmatter 中的关联字段，列出相关的笔记名

### 4.2 指标术语笔记模板

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
（如何测量/计算）

## 四、与其他指标的关系
（这个指标和哪些其他指标相关）

## 五、一句话总结
> 给非专业读者的总结
```

### 4.3 零部件笔记模板

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

## 二、关键参数
| 参数 | 典型值 | 说明 |
|------|-------|------|
| ... | ... | ... |

## 三、应用场景
（用在哪些技术/产品中）

## 四、一句话总结
> 给非专业读者的总结
```

---

## 五、自动抽取脚本逻辑

### 5.1 从笔记到实体的映射

```python
# 1. 读取笔记 frontmatter
fm = extract_frontmatter(note)
entity = {
    "name": parse_title(note),
    "type": classify_entity(note, fm),  # tech/metric/component/standard
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
        "timeline": extract_timeline(note),  # 从"技术演进"章节解析
        "evolution": extract_evolution_chain(note),  # 从"第一代/第二代/第三代"提取
        "prediction": extract_predictions(note)  # 从"未来趋势"章节提取
    }

# 3. 关系抽取
relations = []
# 从关联字段
for related in fm.get("关联", []):
    relations.append({
        "source": entity.id,
        "target": resolve_note_to_id(related),
        "relation": "relates_to"
    })
# 从正文关键词
for keyword in find_cross_references(note):
    relations.append({...})
```

### 5.2 实体分类规则

```python
def classify_entity(note, fm):
    title = parse_title(note)
    
    # 技术概念判断
    tech_keywords = ["波束赋形", "相控阵", "MIMO", "AAU", "贴片天线", 
                     "抛物面", "偶极子", "圆极化", "极化分集", "可转向",
                     "菲涅尔区", "Wi-Fi 7", "RIS", "超表面", "EMC"]
    if any(kw in title for kw in tech_keywords):
        return "tech"
    
    # 指标术语判断
    metric_keywords = ["增益", "带宽", "效率", "方向图", "驻波比", 
                       "VSWR", "S参数", "阻抗匹配", "隔离度"]
    if any(kw in title for kw in metric_keywords):
        return "metric"
    
    # 零部件判断
    component_keywords = ["天线罩", "测量", "天线测量"]
    if any(kw in title for kw in component_keywords):
        return "component"
    
    return "metric"  # 默认归类为指标
```

---

## 六、页面交互设计

### 6.1 整体布局

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
│   - 节点按类型分大小      │   Tab 3: 关联               │
│   - 连线按关系类型着色    │                              │
│   - 可缩放/拖拽          │                              │
│   - 点击节点高亮子图     │   趋势时间轴                  │
│   - hover 显示名称       │   [2020]──●──[2023]──●──[2026]│
│                          │                              │
│                          │   演进路径                    │
│                          │   [模拟]→[数字]→[混合]→[AI]  │
│                          │                              │
│                          │   趋势预测                    │
│                          │   ┌────────┬────────┐        │
│                          │   │ 短期   │ 中期   │ 长期   │        │
│                          │   └────────┴────────┴────────┘        │
├──────────────────────────┴──────────────────────────────┤
│  底部: 统计信息 (实体总数 / 关系总数 / 最近更新)          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 交互行为

1. **鼠标悬停**：显示实体名称 + 类型标签
2. **点击节点**：
   - 高亮该节点及其所有相连的节点和边
   - 其他节点和边变淡
   - 右侧面板加载详情
3. **双击节点**：聚焦并放大该节点
4. **类型筛选**：只显示指定类型的节点和它们之间的连接
5. **搜索**：输入关键词，高亮匹配的节点
6. **重置视图**：回到初始布局

### 6.3 趋势可视化细节

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
- 卡片可点击展开详细内容

---

## 七、实施步骤

### Phase 1: 数据抽取脚本
1. 编写 `scripts/extract-knowledge-graph.ts`
2. 解析 23 篇笔记的 frontmatter + 正文
3. 生成 `app/_data/knowledge-graph.json`
4. 验证数据结构

### Phase 2: 页面重构
1. 重构 `app/knowledge-graph/page.tsx`
2. 实现 D3 Force Graph 可视化
3. 实现右侧详情面板（3 Tab）
4. 实现趋势可视化组件
5. 实现搜索 + 类型筛选

### Phase 3: 模板规范
1. 制定笔记模板（技术概念 / 指标术语 / 零部件）
2. 更新小月的笔记生成 prompt
3. 验证新笔记能正确抽取

### Phase 4: 持续更新
1. 每次新笔记写入后，自动运行抽取脚本
2. 增量更新 knowledge-graph.json
3. 部署到 GitHub Pages

---

## 八、注意事项

1. **节点去重**：同一技术可能在多篇笔记中提到，需要合并
2. **ID 生成**：使用 `type_{name_hash}` 格式生成唯一 ID
3. **关系方向**：`evolves_into`、`uses`、`part_of` 是有方向的；`relates_to`、`compared_with` 是无方向的
4. **性能**：23 个实体 + 约 50-100 条关系，D3 渲染无压力
5. **可扩展**：未来新增笔记时，只需按模板写，脚本自动抽取
6. **回退**：如果某篇笔记没有"技术演进"章节，trend.timeline 为空数组，不报错
