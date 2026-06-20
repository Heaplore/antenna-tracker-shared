# Antenna Tracker — 项目规划文档 (PROJECT-PLAN.md)

> **生成日期**: 2026-06-19
> **生成方式**: Agency Experts 项目启动流水线（4 agent 串联）
> **基于文档**: 框架设计-v1.md, SPEC.md, PROJECT_PLAN.md
> **状态**: 已批准，可进入开发

---

## 流水线产出

本规划文档由以下 4 个专业 agent 串联生成：

1. **🧭 Product Manager** — 需求讨论 + PRD + MVP 定义 → [01-PRD.md](01-PRD.md)
2. **♟️ Business Strategist** — 竞品分析 + 差异化策略 → [02-STRATEGY.md](02-STRATEGY.md)
3. **🏛️ Software Architect** — 系统架构 + 技术选型 → [03-ARCHITECTURE.md](03-ARCHITECTURE.md)
4. **📝 Senior Project Manager** — 任务拆解 + 工时估算 → [04-TASKPLAN.md](04-TASKPLAN.md)

各 agent 的完整输出保存在 OUTPUT/ 目录下，可作为开发时的参考文档。

---

## 一、项目概要

**项目名称**: 天线情报追踪系统（Antenna Industry Intelligence Tracker）
**一句话定位**: 一站式天线行业情报展示 + 四维交叉分析决策支持系统
**技术栈**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + recharts
**部署**: Gitee Pages 静态导出
**目标用户**: 技术质量管理人员（老大）

---

## 二、核心需求（来自 PRD）

### 2.1 问题陈述
技术质量管理人员需要掌握天线行业信息，但当前面临：
1. 信息碎片化 — 数据分散在不同渠道
2. 缺乏分析能力 — 无法多维交叉分析
3. 知识无法复用 — 笔记停留在个人层面

### 2.2 MVP 范围
- **Phase 1**: 市场板块试点（抓取→清洗→入库→验证 pipeline）
- **Phase 2**: 知识图谱 + LLM 四维交叉分析
- **Phase 3**: 其他 5 大板块逐个扩展
- **Phase 4**: Gitee Pages 部署 + 移动端适配

### 2.3 Non-Goals（明确不做什么）
- 不做实时交互大模型界面（静态网站限制）
- 不做移动端 App
- 不做用户注册/登录系统
- 不替代专业金融终端

---

## 三、战略定位（来自 Strategy）

### 3.1 竞争分析
- **没有直接竞品** — 现有方案要么"太贵太泛"（Wind），要么"免费但低效"（手动搜集）
- **差异化定位**: 垂直领域 + 低成本 + 结构化分析
- **知识图谱是核心壁垒** — 竞品没有的能力

### 3.2 为什么是现在
1. 天线行业技术迭代加速（Massive MIMO、AiP、卫星互联网）
2. LLM 技术成熟，低成本自动分析成为可能
3. 框架设计已完成，只差执行

---

## 四、系统架构（来自 Architecture）

### 4.1 架构决策记录 (ADRs)
- **ADR-001**: 静态网站（Next.js export）→ 零部署成本
- **ADR-002**: JSON 静态文件 → 零数据库依赖
- **ADR-003**: 知识图谱两层加载 → entities.jsonl + relations.json
- **ADR-004**: MiniMax-M3 API → 低成本 LLM 分析
- **ADR-005**: 手动脚本 + 定时任务 → 初期可控

### 4.2 模块划分
- **前端**: app/ 目录（7 个页面 + 布局）
- **组件**: components/（Navbar + Search）
- **数据**: data/（8 个 JSON/JSONL 文件）
- **脚本**: scripts/（抓取/清洗/入库）

---

## 五、开发任务（来自 TaskPlan）

### 5.1 里程碑计划

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 项目基础结构 | 2026-06-20 | Next.js 项目可运行 |
| M2: 市场板块试点 | 2026-06-22 | 市场 + 价格页面 |
| M3: 知识图谱上线 | 2026-06-26 | 知识图谱 + LLM 分析 |
| M4: 全板块完成 | 2026-07-05 | 6 大板块全部就绪 |
| M5: Gitee Pages 部署 | 2026-07-10 | 公开可访问站点 |

### 5.2 总工作量估算
- **Phase 1（市场板块）**: ~8h（小月 4.5h + 小紫 3.5h）
- **Phase 2（知识图谱+分析）**: ~7h（小月 3.5h + 小紫 3.5h）
- **Phase 3（其他板块）**: ~7h（小紫）
- **Phase 4（部署优化）**: ~5.5h（小月 1h + 小紫 4.5h）
- **总计**: ~27.5h（约 5.5 个工作日）

---

## 六、风险与对策

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 数据源网站改版 | High | Medium | 多源冗余 + 手动录入 |
| LLM API 限流 | Medium | High | 缓存结果 + 降级 |
| 知识图谱渲染性能 | Medium | Medium | 节点数限制 + 分页 |
| 移动端适配超预期 | Low | Medium | 优先核心页面 |

---

## 七、各 Agent 可执行的下一步

### 🧭 Product Manager 说：
> "Phase 1 市场板块试点是最小可行产品。先跑通 pipeline，验证数据质量和知识图谱接入效果，再扩展其他板块。"

### ♟️ Business Strategist 说：
> "知识图谱是差异化武器，优先投入资源做好。四维交叉分析是核心价值主张，LLM prompt 需要反复打磨。"

### 🏛️ Software Architect 说：
> "技术选型已确认（Next.js + JSON + MiniMax），没有变更必要。重点关注知识图谱的力导向图渲染性能。"

### 📝 Senior Project Manager 说：
> "27.5 小时总工作量，5 个里程碑。每个任务 30min-2h，适合单人开发节奏。建议每天专注一个任务，完成后立即 commit。"

---

## 八、文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| PROJECT-PLAN.md | 根目录 | 本文档（规划总览） |
| 01-PRD.md | OUTPUT/ | Product Manager 输出 |
| 02-STRATEGY.md | OUTPUT/ | Business Strategist 输出 |
| 03-ARCHITECTURE.md | OUTPUT/ | Software Architect 输出 |
| 04-TASKPLAN.md | OUTPUT/ | Senior Project Manager 输出 |
| 框架设计-v1.md | 知识库 | 原有框架文档 |
| SPEC.md | 根目录 | 功能规格说明书 |

---

*文档由 Agency Experts 项目启动流水线自动生成*
*批准人: 老大*
*批准日期: 待定*
