# KG Card v2 Spec

> 简化 v2 - 4 个目标 + 6 种 section type + auto-fit grid 布局

## 4 个设计目标（铁律）

1. **笔记内容完整** — sections[] 数组从原文逐段摘抄，不漏不幻觉
2. **顺序忠于笔记** — sections 按笔记 ## 章节顺序排版
3. **信息密度足** — Grid auto-fit 自动分列，无大面空白
4. **全站色彩一致** — 每 type 一套调色板 (technology / metric / component / material)

## 6 种 section type（自动分发）

| type | 渲染 | 例 |
|---|---|---|
| `timeline` | 横排 N 列 | "三代演进" |
| `table` | 表格 | "厂商配置" |
| `comparison` | 表格（高亮列） | "ABF/HBF/DBF 对比" |
| `list` | 多列块（≥4 项 2 列，≥6 项 3 列） | "三大原因 / 六大组件" |
| `text` | 段落 | "一句话 / 类比" |
| `code` | 黑底代码块 | "公式 / ASCII 架构图" |

## JSON 契约

```jsonc
{
  "node_id": "...",
  "type": "technology",
  "name": "中文名",
  "english_name": "English Name",
  "updated": "YYYY-MM-DD",
  "one_liner": "...",
  "analogy": "...",
  "tags": ["t1", "t2"],
  "metrics_row": [{"label":"...","value":"..."}],
  "sections": [
    {
      "order": 1,
      "type": "timeline",
      "title": "章节标题",
      "entries": [
        {"title":"...","body":"...","tag":"..."}
      ]
    },
    {
      "order": 2,
      "type": "list",
      "title": "...",
      "list_class": "components | drivers | variants | trends | challenges | features",
      "entries": [
        {"name":"...","en":"...","desc":"..."}
      ]
    },
    {
      "order": 3,
      "type": "comparison",
      "title": "...",
      "table_headers": ["h1","h2"],
      "highlight_col": 1,
      "table_rows": [["r1c1","r1c2"]],
      "table_footer": "备注"
    }
  ],
  "related": ["笔记 ID 1", ...]
}
```

## 渲染 SOP

1. 读笔记 .md
2. 抽取 `## ` 一级章节 → sections[], 类型自动判断
3. 写 samples/<slug>.json
4. `python scripts/render-cards.py`
5. `python scripts/snapshot-cards.py --node <slug> --system-chrome`
6. 眼检：内容/顺序/密度/色彩

## 布局规则

- 16:9 1920×1080 desktop 浏览器
- 卡片固定 1080 高，溢出滚动
- `grid-template-columns: repeat(auto-fit, minmax(380px, 1fr))`
- Block 色彩分发: timeline → primary(青), table → highlight(紫), list→secondary(琥珀) / warning(红) / 等按 list_class
- table / code / text → 独占整行
- list → 与其他 list 共享 row (auto-fit 自动分列)
- 关联笔记 → 在 sections 后，独占整行，紫色边框

## 调色板 (technology)

```
--primary   青 #0e7490
--secondary 琥珀 #d97706
--warning   红  #dc2626
--highlight 紫  #7c3aed
--bg        米  #f5f1e8
--fg        深蓝 #1f2937
```

每个 type 一套，全站统一。

## 文件结构

```
public/kg-cards/
├── SPEC.md
├── templates/
│   └── technology.html
├── samples/
│   ├── technology-aau.json
│   └── technology-beamforming-architectures.json
├── rendered/
└── snapshots/
```
