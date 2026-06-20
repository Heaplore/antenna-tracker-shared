# 🏛️ Software Architect — Antenna Tracker System Design

**Date**: 2026-06-19
**Based on**: PRD (01-PRD.md) + Strategy (02-STRATEGY.md) + FRAMEWORK (框架设计-v1.md)

---

## 1. System Architecture Overview

`
┌─────────────────────────────────────────────┐
│  MoonDeck Canvas (透明画布)                  │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js 14 Static Site (Gitee Pages)  │  │
│  │                                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │  Market │ │Companies│ │ Standards│ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │ Dynamics│ │Technology│ │ Knowledge│ │  │
│  │  └─────────┘ └─────────┘ │ Graph   │ │  │
│  │                         └─────────┘ │  │
│  │  ┌───────────────────────────────┐  │  │
│  │  │  Analysis Decision Layer (LLM)│  │  │
│  │  │  四维交叉分析 + 建议卡片        │  │  │
│  │  └───────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Data Layer (JSON 静态文件)            │  │
│  │  ├── data/market.json                 │  │
│  │  ├── data/companies.json              │  │
│  │  ├── data/standards.json              │  │
│  │  ├── data/news.json                   │  │
│  │  ├── data/technology.json             │  │
│  │  ├── data/knowledge-graph/            │  │
│  │  │   ├── entities.jsonl               │  │
│  │  │   └── relations.json               │  │
│  │  └── data/prices.json                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Scripts Layer (数据管道)              │  │
│  │  ├── scripts/crawl-*.py/js            │  │
│  │  ├── scripts/clean-*.py               │  │
│  │  └── scripts/ingest-*.py              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
`

## 2. Technical Decision Records (ADRs)

### ADR-001: 静态网站 vs 动态网站
- **Status**: Accepted
- **Decision**: Next.js 静态导出 (output: 'export')
- **Rationale**: 老大需要零部署成本，Gitee Pages 免费托管，不需要后端服务器
- **Trade-off**: 失去实时交互能力（已在框架设计中否决交互层）

### ADR-002: JSON 静态文件 vs 数据库
- **Status**: Accepted
- **Decision**: JSON 文件存储在 data/ 目录
- **Rationale**: 零部署成本，Git 可追踪，版本管理简单
- **Trade-off**: 数据量大时查询性能受限（当前数据量 < 10MB，无问题）

### ADR-003: 知识图谱数据格式
- **Status**: Accepted
- **Decision**: entities.jsonl (实体) + relations.json (关系) 分离存储
- **Rationale**: 两层加载策略，前端按需加载，避免单次加载过大文件
- **Trade-off**: 关系查询需要前端处理，无法做服务端复杂查询

### ADR-004: LLM 分析引擎
- **Status**: Proposed
- **Decision**: MiniMax-M3 API（已有密钥，成本低）
- **Rationale**: 四维交叉分析需要 LLM 能力，MiniMax 成本低且已有集成
- **Trade-off**: 依赖外部 API，需要处理 API 限流和失败降级

### ADR-005: 数据更新策略
- **Status**: Accepted
- **Decision**: 手动脚本 + 定时任务（cron）
- **Rationale**: 初期数据量不大，手动更新可控；后期可接入自动爬取
- **Trade-off**: 手动更新有延迟风险，需要明确的更新频率约定

## 3. Module Boundaries

### 3.1 前端模块 (app/)
| 模块 | 职责 | 依赖 |
|------|------|------|
| pp/page.tsx | 首页概览（KPI + 趋势图） | market.json, companies.json |
| pp/market/page.tsx | 市场数据页面 | market.json, prices.json |
| pp/companies/page.tsx | 企业图谱页面 | companies.json |
| pp/news/page.tsx | 新闻动态页面 | news.json |
| pp/standards/page.tsx | 标准规范页面 | standards.json |
| pp/technology/page.tsx | 技术页面（Hype Cycle） | technology.json |
| pp/knowledge-graph/page.tsx | 知识图谱可视化 | entities.jsonl, relations.json |
| pp/layout.tsx | 全局布局（导航栏 + Footer） | — |

### 3.2 组件模块 (components/)
| 组件 | 职责 |
|------|------|
| Navbar.tsx | 顶部导航栏 |
| GlobalSearch.tsx | 全局搜索组件 |
| SearchTrigger.tsx | 搜索触发按钮 |

### 3.3 数据模块 (data/)
| 文件 | 职责 |
|------|------|
| market.json | 市场板块数据 |
| companies.json | 企业板块数据 |
| standards.json | 标准板块数据 |
| 
ews.json | 行业动态数据 |
| 	echnology.json | 技术板块数据 |
| prices.json | 价格走势数据 |
| entities.jsonl | 知识图谱实体 |
| elations.json | 知识图谱关系 |

### 3.4 脚本模块 (scripts/)
| 文件 | 职责 |
|------|------|
| crawl-*.py/js | 数据抓取 |
| clean-*.py | 数据清洗 |
| ingest-*.py | 数据入库 |
| generate-knowledge-graph.js | 知识图谱生成 |

## 4. Data Flow

`
数据源 (网站/API)
    ↓ [抓取脚本]
原始数据 (HTML/JSON/XML)
    ↓ [清洗脚本]
结构化数据 (JSON)
    ↓ [入库脚本]
data/*.json / entities.jsonl / relations.json
    ↓ [Next.js 构建时读取]
前端页面渲染
    ↓ [LLM 分析]
分析决策层 (四维交叉分析)
    ↓ [展示]
建议卡片 / 分析报告
`

## 5. Key Interfaces

### 5.1 数据接口 (JSON Schema)
所有数据文件遵循框架设计文档 7.2 节定义的格式规范。

### 5.2 知识图谱接口
- **Entity**: { id, type, name, description, summary, summary_vernacular, metadata }
- **Relation**: { subject, predicate, object, confidence, evidence }

### 5.3 LLM 分析接口
- **Input**: 多板块 JSON 数据
- **Processing**: 四维交叉分析 prompt
- **Output**: 分析结论 + 建议卡片 JSON

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| JSON 文件过大导致加载慢 | 分页加载 + 懒加载 |
| LLM API 限流或失败 | 缓存分析结果 + 降级为静态分析 |
| 数据源网站改版 | 多数据源冗余 + 手动录入 fallback |
| 知识图谱实体提取不准 | prompt 优化 + 人工校验流程 |

## 7. Open Questions

- [ ] 知识图谱的力导向图使用什么库？(推荐: vis.js 或 d3-force)
- [ ] LLM 分析结果的缓存策略？(推荐: 基于日期缓存，每天更新一次)
- [ ] 数据更新的自动化程度？(Phase 1 手动，Phase 3 考虑 cron 定时)
