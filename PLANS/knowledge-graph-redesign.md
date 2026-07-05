# 知识图谱页面重构方案

## 目标

将知识图谱页面改造为**纯粹的天线行业知识图谱**，数据来源从小月/银月的解读笔记中自动抽取，不与其他页面联动。

## 核心功能

### 1. 图谱可视化（D3 Force Graph）
- 节点 = 实体（技术/企业/标准/材料/概念）
- 连线 = 关系（related_to / evolves_into / uses / developed_by / compared_with）
- 支持搜索、类型筛选、缩放、拖拽
- 点击节点 → 右侧显示详情 + 趋势图

### 2. 技术发展趋势可视化（新增核心功能）
点击任意技术节点后，右侧面板显示：
- **时间轴**：该技术从起源 → 关键里程碑 → 当前状态 → 未来预测
- **演进路径**：该技术如何演变为下一代技术（如：相控阵 → 有源相控阵 → 混合相控阵 → 超表面天线）
- **关联技术对比**：与同类/替代技术的对比（如：RIS vs Metacrystal vs 传统波束赋形）
- **趋势判断**：从笔记中提取的趋势分析

### 3. 数据源
- 从 `_hanako_activity_staging/小月/activity/` 下的天线相关笔记自动抽取
- 从 `天线技术/` 和 `天线行业/` 目录下的笔记抽取
- 每篇笔记提取：
  - 技术概念 → 实体（type: technology）
  - 企业名称 → 实体（type: company）
  - 标准号 → 实体（type: standard）
  - 材料/器件 → 实体（type: material）
  - 概念/术语 → 实体（type: concept）
- 关系从笔记的"关联"字段、竞品对比表、演进描述中抽取

## 数据结构

### knowledge-graph.json（重构）

```json
{
  "lastUpdate": "2026-06-30",
  "version": "3.0",
  "entities": [
    {
      "id": "tech_bf001",
      "type": "technology",
      "name": "波束赋形 Beamforming",
      "description": "通过控制多天线单元相位和幅度实现定向信号传输",
      "timeline": [
        {"year": "1960s", "event": "相控阵雷达首次应用", "source": "天线技术/笔记-波束赋形"},
        {"year": "2010s", "event": "4G Massive MIMO 引入", "source": "天线技术/笔记-波束赋形"},
        {"year": "2020s", "event": "5G 全数字/混合波束赋形", "source": "天线技术/笔记-波束赋形"},
        {"year": "2026", "event": "华为 U6GHz 256通道 AAU 商用", "source": "天线技术/笔记-波束赋形"},
        {"year": "2028+", "event": "AI 自适应波束管理 + 6G 三维波束赋形", "source": "天线技术/笔记-波束赋形"}
      ],
      "evolution": ["模拟波束赋形", "数字波束赋形", "混合波束赋形", "AI 自适应波束", "三维智能波束"],
      "trend_prediction": {
        "short_term": "Massive MIMO 成为基站标配",
        "mid_term": "AI 驱动的自适应波束管理",
        "long_term": "三维波束赋形 + 太赫兹频段"
      }
    }
  ],
  "relations": [
    {
      "source": "tech_bf001",
      "target": "tech_ris001",
      "relation": "compared_with",
      "evidence": "RIS 是被动式波束赋形"
    }
  ]
}
```

### 实体类型

| 类型 | 说明 | 示例 |
|------|------|------|
| technology | 技术概念 | 波束赋形、RIS、超表面天线、相控阵 |
| company | 企业 | 华为、中兴、银河航天、中信科 |
| standard | 标准 | ITU-R M.3393、3GPP Rel-18 |
| material | 材料/器件 | GaN、Metacrystal、PIN 二极管 |
| concept | 概念/术语 | 6G、通感融合、OTA 测试 |

### 关系类型

| 关系 | 说明 | 示例 |
|------|------|------|
| evolves_into | 技术演进 | 相控阵 → 有源相控阵 → 超表面天线 |
| uses | 使用 | 波束赋形 使用 Massive MIMO |
| developed_by | 企业开发 | 超表面天线 由 中信科移动 开发 |
| compared_with | 对比 | RIS vs Metacrystal |
| enables | 使能 | 波束赋形 使能 毫米波通信 |
| competes_with | 竞争 | 反射面天线 vs 相控阵 |

## 页面设计

### 左侧：图谱可视化
- D3 force graph，节点按类型着色
- 顶部：搜索框 + 类型筛选按钮
- 点击节点 → 右侧面板高亮该节点及其关联子图

### 右侧：详情面板（分 Tab）
1. **概况**：名称、类型、一句话描述、来源笔记
2. **趋势**（核心技术节点）：
   - 时间轴可视化（垂直时间线）
   - 演进路径（流程图形式）
   - 趋势预测（短/中/长期卡片）
3. **关联**：与该实体相关的所有实体列表，可点击跳转

## 自动化脚本

### parse_notes_to_kg.py
1. 遍历所有天线解读笔记
2. 使用正则 + LLM 抽取实体和关系
3. 生成 knowledge-graph.json
4. 增量更新（追加新实体，不覆盖旧的）

### 抽取规则
- 实体识别：标题中的技术名、正文中的技术术语、企业名称、标准号
- 关系识别：
  - "关联" frontmatter 字段 → related_to
  - 竞品对比表 → compared_with
  - 演进描述 → evolves_into
  - "由 XX 开发" → developed_by
  - "使能/支撑" → enables

## 实施步骤

1. 编写 `parse_notes_to_kg.py` 脚本
2. 运行脚本生成初始 `knowledge-graph.json`
3. 重构 `app/knowledge-graph/page.tsx`
4. 更新 `scripts/generate-knowledge-graph.js`（如有）
5. 提交并部署

## 注意事项

- 趋势数据需要从笔记的结构化字段中提取（timeline / evolution / trend_prediction）
- 如果笔记中没有这些字段，需要从正文中用 NLP 抽取
- 实体去重：同一技术可能在不同笔记中被提及，需要合并
- 关系方向性：有些关系是有方向的（evolves_into），有些是无方向的（compared_with）
