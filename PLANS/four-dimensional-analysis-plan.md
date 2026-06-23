# 四维交叉分析层 — 细化方案

> 生成日期：2026-06-23
> 目标：从"信息展示"升级为"分析决策"，实现技术/质量/成本/交付四维交叉分析
> 基于：框架设计-v1.md / PROJECT-PLAN.md / SPEC.md

---

## 一、现状盘点

### 已有的
- 6 大板块数据文件齐全（market / companies / news / prices / standards / technology），最后更新 2026-06-20
- 知识图谱页面已上线（D3 力导向图 + 聚焦模式 + 双层 Wiki）
- 数据自动更新脚本（fetch-data.js / fetch-real-data.py）正常运行
- Next.js 14 App Router 项目结构，已静态导出部署到 GitHub Pages

### 缺的
- 无 LLM 集成 — package.json 里没有 MiniMax 或任何 LLM SDK
- 无 API 路由 — app/api/ 目录不存在
- 无分析输出 — 所有页面都是纯数据展示，没有分析结论卡片
- 四维分析层 — 框架设计里写了，但代码里还没实现

### 约束条件
- 静态网站（next build 导出），不支持服务端实时交互
- 分析结论必须是预计算的，存为 JSON 供前端读取
- MiniMax-M3 API 为既定选型（框架设计 ADR-004），需提供 API Key

---

## 二、整体架构设计

### 核心思路

```
数据文件 (JSON) --> Python 预处理脚本 --> LLM API (MiniMax) --> 分析结果 JSON --> 前端页面渲染
```

因为项目是静态导出，LLM 调用放在构建时而不是运行时：

```
npm run build
  +-- step 1: 读取 public/data/*.json
  +-- step 2: 调用 Python 预处理脚本，抽取关键数据片段
  +-- step 3: 调用 MiniMax API，传入数据片段 + Prompt
  +-- step 4: 将 LLM 返回的分析结果写入 app/_data/analysis-output.json
  +-- step 5: Next.js 编译时将 analysis-output.json 内联到页面
```

### 数据流

```
+----------------------------------------------------------+
|                   构建时 (Build Time)                     |
|                                                          |
|  public/data/*.json                                      |
|    |                                                   |
|  scripts/generate-analysis.py                           |
|    +-- 抽取各板块关键数据（压缩到 token 预算内）         |
|    +-- 构造四维 Prompt（技术/质量/成本/交付）           |
|    +-- 调用 MiniMax-M3 API                             |
|    +-- 输出 analysis-output.json                        |
|                                                          |
|  app/_data/analysis-output.json                          |
|    | (Next.js build 内联)                                |
|  前端页面渲染                                            |
+----------------------------------------------------------+
```

---

## 三、四维分析模型设计

### 3.1 分析维度定义

每个维度输出一组标准化的分析卡片，结构如下：

```json
{
  "dimension": "cost",
  "title": "成本维度分析",
  "timestamp": "2026-06-23T10:00:00+08:00",
  "cards": [
    {
      "type": "risk",
      "severity": "high",
      "title": "铜价持续攀升挤压毛利率",
      "summary": "电解铜价格从 2025-12 的 93,100 元/吨涨至 2026-06 的 108,771 元/吨，涨幅 16.8%...",
      "data_source": ["prices.json", "companies.json"],
      "recommendation": "建议关注 LCP 基材替代方案，降低铜用量"
    }
  ]
}
```

### 3.2 四个维度的具体分析内容

#### 技术维度 (technology)
| 分析项 | 数据来源 | 输出内容 |
|--------|---------|---------|
| 技术成熟度评估 | technology.json (hypeCycle) | 各技术所处阶段 + 演进趋势 |
| 技术路线对比 | technology.json + knowledge-graph | 并行技术路线的优劣对比 |
| 技术突破预警 | news.json + technology.json | 近期重大技术突破及其影响范围 |
| 6G 进展跟踪 | news.json + technology.json | 3GPP R19 冻结后的产业化节奏 |

#### 质量维度 (quality)
| 分析项 | 数据来源 | 输出内容 |
|--------|---------|---------|
| 标准合规风险 | standards.json | 新标准发布对现有产品的影响 |
| 认证周期变化 | standards.json + news.json | 认证要求收紧/放宽趋势 |
| 质量事件追踪 | news.json | 行业质量事件汇总及影响评估 |

#### 成本维度 (cost)
| 分析项 | 数据来源 | 输出内容 |
|--------|---------|---------|
| 原材料价格趋势 | prices.json | 铜/铝/PCB/PTFE 价格预测 |
| 成本传导分析 | prices.json + companies.json | 上游涨价对上下游利润的影响链 |
| 期货信号解读 | prices.json + market.json | 期货价格信号对现货的指引 |

#### 交付维度 (delivery)
| 分析项 | 数据来源 | 输出内容 |
|--------|---------|---------|
| 供应链风险评估 | companies.json (supplyChain) | Tier 分层 + 产能利用率 + 依赖度 |
| 集采动态解读 | news.json + market.json | 运营商集采结果对格局的影响 |
| 产能扩张预警 | companies.json + news.json | 新产能投放时间表及过剩风险 |

---

## 四、Prompt 设计

### 4.1 总体策略

- 单次调用 vs 多次调用：采用 4 次独立调用（每维度一次），每次聚焦一个维度，输出更精准
- 数据压缩：各板块数据文件较大（companies.json ~4000 行），需要先做数据抽取
- 输出格式：强制 LLM 输出 JSON，便于前端直接渲染

### 4.2 数据压缩策略

| 板块 | 原始大小 | 压缩后目标 | 策略 |
|------|---------|-----------|------|
| market.json | ~3KB | ~1KB | 只保留 summary + Top 3 segments |
| prices.json | ~30KB | ~3KB | 只保留最近 6 个月价格数据 |
| companies.json | ~160KB | ~10KB | 只保留 isKey=true 的企业 |
| news.json | ~25KB | ~5KB | 最近 30 天，只保留 title/summary/tags |
| standards.json | ~5KB | ~2KB | active 状态的前 20 条 |
| technology.json | ~35KB | ~5KB | industryOverview + hypeCycle 技术列表 |

总压缩后大小：~26KB（约 6,500 tokens），在 MiniMax-M3 的 context window 范围内

### 4.3 四维 Prompt 模板（技术维度示例）

```
你是一位资深天线行业技术分析师。基于以下数据，输出技术维度的交叉分析。

【行业概述】
{industry_overview}

【技术成熟度曲线】
{hype_cycle_data}

【近期技术相关新闻】
{recent_tech_news}

【知识图谱关键实体】
{kg_entities_summary}

请按以下 JSON 格式输出分析结果（不要输出其他内容）：
[{
  "type": "trend|risk|opportunity|assessment",
  "severity": "high|medium|low",
  "title": "分析标题",
  "summary": "分析摘要（100-200字）",
  "details": "详细分析（200-300字）",
  "data_sources": ["引用的数据来源"],
  "recommendation": "建议行动（50-100字）"
}]

分析要求：
1. 关注技术成熟度变化（从 hype cycle 哪个阶段移到哪个阶段）
2. 识别技术路线竞争格局
3. 评估 6G/AI 波束赋形/RIS 等前沿技术的产业化节奏
4. 给出对技术质量管理的 actionable 建议
```

（质量/成本/交付维度类似，各有侧重）

---

## 五、前端展示设计

### 5.1 新增页面：/analysis

```
+--------------------------------------------------------------+
|  四维交叉分析                                                 |
|  最后更新：2026-06-23 10:30                                   |
+--------------------------------------------------------------+
|                                                              |
|  +----------------+  +----------------+                      |
|  | 技术维度        |  | 质量维度        |                     |
|  |                |  |                |                      |
|  | * 卡片 1       |  | * 卡片 1       |                      |
|  | * 卡片 2       |  | * 卡片 2       |                      |
|  | * 卡片 3       |  | * 卡片 3       |                      |
|  +----------------+  +----------------+                      |
|                                                              |
|  +----------------+  +----------------+                      |
|  | 成本维度        |  | 交付维度        |                     |
|  |                |  |                |                      |
|  | * 卡片 1       |  | * 卡片 1       |                      |
|  | * 卡片 2       |  | * 卡片 2       |                      |
|  | * 卡片 3       |  | * 卡片 3       |                      |
|  +----------------+  +----------------+                      |
|                                                              |
+--------------------------------------------------------------+
|  综合分析结论                                                 |
|  +----------------------------------------------------------+ |
|  | 基于四维交叉分析，当前行业关键信号：                        | |
|  |                                                          | |
|  | 1. 成本压力持续上升，铜价 6 个月涨 16.8%...               | |
|  | 2. 6G 标准冻结后产业化加速，Massive MIMO...               | |
|  | 3. 运营商集采格局变化，Tier1 集中度进一步提升...          | |
|  +----------------------------------------------------------+ |
+--------------------------------------------------------------+
```

### 5.2 分析卡片组件

- severity 高 --> 红色边框 + 警告图标
- severity 中 --> 橙色边框 + 闪电图标
- severity 低 --> 蓝色边框 + 信息图标
- type 为 opportunity --> 绿色边框 + 星星图标
- 点击卡片展开 details 和 recommendation

### 5.3 首页增强

在首页底部增加一个分析摘要区域，展示四个维度各一条最重要的结论。

---

## 六、实现步骤拆解

### Step 1：MiniMax API 集成（~1.5h）

文件：scripts/lib/minimax-client.py

- 封装 MiniMax-M3 API 调用
- 支持 temperature、max_tokens 参数
- 需要老大提供 API Key

### Step 2：数据抽取脚本（~2h）

文件：scripts/generate-analysis.py

主要函数：
- extract_for_analysis() -- 从 6 个 JSON 文件抽取关键数据
- build_prompt(dimension, extracted_data) -- 组装四维 Prompt
- run_analysis() -- 循环 4 次调用 MiniMax，合并结果
- write_output(result) -- 写入 app/_data/analysis-output.json

输出文件格式：
```json
{
  "generatedAt": "2026-06-23T10:30:00+08:00",
  "dimensions": {
    "technology": { "cards": [...], "summary": "..." },
    "quality": { "cards": [...], "summary": "..." },
    "cost": { "cards": [...], "summary": "..." },
    "delivery": { "cards": [...], "summary": "..." }
  },
  "crossDimensionSummary": "四维交叉综合分析结论..."
}
```

### Step 3：构建时集成（~1h）

修改 package.json scripts：
```json
"scripts": {
  "analyze": "python scripts/generate-analysis.py",
  "build": "next build"
}
```

CI 流程（.github/workflows/deploy.yml）：
```yaml
- name: Generate analysis
  run: python scripts/generate-analysis.py
  env:
    MINIMAX_API_KEY: ${{ secrets.MINIMAX_API_KEY }}
```

### Step 4：前端页面开发（~2h）

新建文件：
- app/analysis/page.tsx -- 四维分析主页面
- components/AnalysisCard.tsx -- 分析卡片组件
- components/DimensionPanel.tsx -- 维度面板组件
- components/CrossAnalysisSummary.tsx -- 综合分析结论

修改文件：
- app/page.tsx -- 首页底部增加分析摘要区域
- components/Navbar.tsx -- 导航栏增加分析菜单项

### Step 5：数据质量验证（~1h）

文件：scripts/validate-analysis.py
- 验证 analysis-output.json 格式是否符合 schema
- 检查每个 card 都有 severity/title/summary/recommendation
- 检查 data_sources 引用了真实存在的文件

---

## 七、Token 预算与性能优化

### 7.1 缓存策略

LLM 调用有成本且有延迟，需要缓存：

```
CACHE_FILE = app/_data/analysis-cache.json
CACHE_TTL = 86400  # 24 小时

触发条件：
- 数据文件有更新时（对比 lastUpdate 字段）--> 重新调用 LLM
- 数据无更新 --> 使用缓存
```

### 7.2 降级方案

如果 MiniMax API 不可用：
- 使用预置的模板分析（hardcoded baseline analysis）
- 基于规则引擎生成简单分析（价格涨跌 --> 成本风险等级）
- 前端显示分析暂不可用，数据更新中

---

## 八、文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| scripts/generate-analysis.py | 新建 | 主分析脚本：数据抽取 + LLM 调用 + 输出 |
| scripts/lib/minimax-client.py | 新建 | MiniMax API 客户端封装 |
| scripts/validate-analysis.py | 新建 | 分析结果验证脚本 |
| app/analysis/page.tsx | 新建 | 四维分析页面 |
| components/AnalysisCard.tsx | 新建 | 分析卡片组件 |
| components/DimensionPanel.tsx | 新建 | 维度面板组件 |
| components/CrossAnalysisSummary.tsx | 新建 | 综合分析结论 |
| app/_data/analysis-output.json | 生成 | LLM 分析结果（构建时生成） |
| app/_data/analysis-cache.json | 生成 | LLM 调用缓存 |
| app/page.tsx | 修改 | 首页增加分析摘要区域 |
| components/Navbar.tsx | 修改 | 导航栏增加分析入口 |
| .github/workflows/deploy.yml | 修改 | CI 增加分析生成步骤 |
| package.json | 修改 | 增加 analyze 脚本 |

---

## 九、工作量估算

| 步骤 | 工作内容 | 预计耗时 | 负责人 |
|------|---------|---------|--------|
| Step 1 | MiniMax API 集成 | 1.5h | 小月 |
| Step 2 | 数据抽取脚本 | 2h | 小月 |
| Step 3 | 构建时集成 | 1h | 小月 |
| Step 4 | 前端页面开发 | 2h | 小紫 |
| Step 5 | 数据质量验证 | 1h | 小紫 |
| 合计 | | ~7.5h | |

---

## 十、验收标准

- [ ] python scripts/generate-analysis.py 能成功运行并输出 analysis-output.json
- [ ] analysis-output.json 格式符合 schema 验证
- [ ] 四维各至少输出 3 张分析卡片
- [ ] 每张卡片有 severity/title/summary/recommendation
- [ ] 前端 /analysis 页面能正确渲染所有卡片
- [ ] 首页底部显示四维分析摘要
- [ ] 导航栏有分析入口
- [ ] npm run build 能完整通过（含分析生成步骤）
- [ ] GitHub Pages 部署后分析页面可访问
- [ ] 缓存机制生效（数据未更新时使用缓存）
- [ ] API 降级方案可用（无 API Key 时不崩溃）

---

## 十一、后续迭代方向

1. 分析频率提升：从构建时升级为定时任务（GitHub Actions cron），每天自动更新分析
2. 历史对比：记录每次分析结果，支持时间维度对比
3. 知识图谱联动：分析结论中的实体自动关联到知识图谱节点
4. 推送通知：分析结论通过飞书/企业微信推送到老大
5. 个性化配置：老大可以配置关注的维度、阈值、推送频率

---

*方案由小紫生成，待老大确认后执行*
