# 📝 Senior Project Manager — Task Breakdown & Timeline

**Date**: 2026-06-19
**Based on**: PRD + Strategy + Architecture

---

## 1. Specification Summary

**Original Requirements**:
- 6 大板块数据覆盖（市场/企业/标准/行业动态/技术/知识图谱）
- 分析决策层：四维分析（技术/质量/成本/交付）+ LLM 多源信息梳理
- 知识图谱：实体-关系图结构，双层 Wiki（专业介绍 + 通俗解释）
- 静态网站形态（Next.js 导出），Gitee Pages 部署
- 市场板块试点跑通完整 pipeline（抓取→清洗→入库→验证）

**Technical Stack**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- recharts (图表)
- JSON 静态数据
- PyInstaller 不适用（Web 项目）
- 数据脚本: Python + Node.js

---

## 2. Development Tasks

### Phase 1: 市场板块试点 (2026-06-20 ~ 2026-06-22)

#### Task 1.1: 搭建项目基础结构 (30min)
- **Description**: 初始化 Next.js 项目，配置 Tailwind + shadcn/ui
- **Acceptance Criteria**:
  - [ ] 
pm run dev 能启动开发服务器
  - [ ] Tailwind CSS 配置生效
  - [ ] shadcn/ui 组件库可用
- **Owner**: 小月
- **Estimate**: 30min

#### Task 1.2: 创建页面骨架 (1h)
- **Description**: 创建 app/ 目录结构和所有页面路由
- **Acceptance Criteria**:
  - [ ] 所有路由可访问（即使内容为空）
  - [ ] Navbar 组件在所有页面显示
  - [ ] 页面布局与框架设计一致
- **Owner**: 小月
- **Estimate**: 1h

#### Task 1.3: 市场板块数据抓取脚本 (1.5h)
- **Description**: 编写 Python 脚本从长江有色金属网抓取铜铝价格
- **Acceptance Criteria**:
  - [ ] 脚本能成功抓取数据
  - [ ] 输出格式符合 market.json schema
  - [ ] 错误处理完善（网络超时、页面改版）
- **Owner**: 小月
- **Estimate**: 1.5h

#### Task 1.4: 市场板块前端页面 (1h)
- **Description**: 实现 market 页面，展示价格趋势折线图
- **Acceptance Criteria**:
  - [ ] 折线图正常渲染
  - [ ] 数据从 market.json 读取
  - [ ] 响应式布局适配
- **Owner**: 小紫
- **Estimate**: 1h

#### Task 1.5: 价格走势页面 (1h)
- **Description**: 实现 prices 页面，展示铜/铝/PCB/PTFE 四条折线
- **Acceptance Criteria**:
  - [ ] 4 条折线正常显示
  - [ ] 图例可切换显示/隐藏
  - [ ] 数据从 prices.json 读取
- **Owner**: 小紫
- **Estimate**: 1h

#### Task 1.6: 首页 KPI 卡片 + 趋势图 (1h)
- **Description**: 实现首页概览，显示 KPI 指标和中标趋势折线图
- **Acceptance Criteria**:
  - [ ] KPI 卡片正常显示数字
  - [ ] 折线图正常渲染（空数据不报错）
  - [ ] 饼图正常显示市场细分占比
- **Owner**: 小紫
- **Estimate**: 1h

#### Task 1.7: 数据验证用例 (1h)
- **Description**: 编写数据质量检查脚本
- **Acceptance Criteria**:
  - [ ] 检查 JSON 格式合法性
  - [ ] 检查必填字段是否存在
  - [ ] 检查数据范围合理性
- **Owner**: 小紫
- **Estimate**: 1h

### Phase 2: 知识图谱 + 分析决策层 (2026-06-23 ~ 2026-06-26)

#### Task 2.1: 知识图谱页面 (2h)
- **Description**: 实现 knowledge-graph 页面，展示力导向图
- **Acceptance Criteria**:
  - [ ] 力导向图正常渲染
  - [ ] 节点按类型着色
  - [ ] 点击节点显示详情侧边栏
- **Owner**: 小紫
- **Estimate**: 2h

#### Task 2.2: 实体提取脚本 (1.5h)
- **Description**: 从技术解读笔记中提取实体并生成 entities.jsonl
- **Acceptance Criteria**:
  - [ ] 脚本能从小月笔记中提取实体
  - [ ] 输出格式符合 schema
  - [ ] 支持去重合并
- **Owner**: 小月
- **Estimate**: 1.5h

#### Task 2.3: LLM 分析引擎 (2h)
- **Description**: 实现四维交叉分析，调用 MiniMax-M3 API
- **Acceptance Criteria**:
  - [ ] 能读取多板块 JSON 数据
  - [ ] 调用 LLM 生成分析结论
  - [ ] 输出格式为建议卡片 JSON
- **Owner**: 小月
- **Estimate**: 2h

#### Task 2.4: 建议卡片组件 (1h)
- **Description**: 实现建议卡片 UI 组件
- **Acceptance Criteria**:
  - [ ] 卡片样式美观
  - [ ] 支持四种维度标签（技术/质量/成本/交付）
  - [ ] 置信度显示
- **Owner**: 小紫
- **Estimate**: 1h

### Phase 3: 其他板块扩展 (2026-06-27 ~ 2026-07-05)

#### Task 3.1: 企业板块 (2h)
- **Description**: 企业数据 + 页面实现
- **Acceptance Criteria**:
  - [ ] Tab 切换正常（上游/中游/下游）
  - [ ] 企业卡片点击弹出详情
  - [ ] 数据从 companies.json 读取
- **Owner**: 小紫
- **Estimate**: 2h

#### Task 3.2: 标准板块 (1.5h)
- **Description**: 标准数据 + 页面实现
- **Acceptance Criteria**:
  - [ ] 标准列表正常显示
  - [ ] 分类筛选功能正常
  - [ ] 数据从 standards.json 读取
- **Owner**: 小紫
- **Estimate**: 1.5h

#### Task 3.3: 行业动态板块 (1.5h)
- **Description**: 新闻数据 + 页面实现
- **Acceptance Criteria**:
  - [ ] 新闻列表正常显示
  - [ ] 分类标签筛选正常
  - [ ] 数据从 news.json 读取
- **Owner**: 小紫
- **Estimate**: 1.5h

#### Task 3.4: 技术板块 (2h)
- **Description**: 技术数据 + Gartner Hype Cycle 气泡图
- **Acceptance Criteria**:
  - [ ] Scatter 气泡图正常渲染
  - [ ] 点击气泡跳转到技术详情
  - [ ] 技术详情面板显示完整信息
- **Owner**: 小紫
- **Estimate**: 2h

### Phase 4: 部署与优化 (2026-07-06 ~ 2026-07-10)

#### Task 4.1: Gitee Pages 部署 (1h)
- **Description**: 配置 GitHub Actions 自动部署到 Gitee Pages
- **Acceptance Criteria**:
  - [ ] push 到 main 分支自动触发构建
  - [ ] 构建成功后自动部署
  - [ ] 部署地址可访问
- **Owner**: 小月
- **Estimate**: 1h

#### Task 4.2: 移动端适配 (2h)
- **Description**: 响应式布局优化
- **Acceptance Criteria**:
  - [ ] 所有页面在手机端正常显示
  - [ ] 图表在小屏设备可交互
  - [ ] 导航栏折叠正常
- **Owner**: 小紫
- **Estimate**: 2h

#### Task 4.3: 性能优化 (1h)
- **Description**: Lighthouse 评分优化
- **Acceptance Criteria**:
  - [ ] Performance score ≥ 80
  - [ ] 首屏加载时间 < 2s
  - [ ] 图片懒加载
- **Owner**: 小紫
- **Estimate**: 1h

#### Task 4.4: 全局搜索 (1.5h)
- **Description**: 跨页面搜索功能
- **Acceptance Criteria**:
  - [ ] 搜索企业/技术/新闻
  - [ ] 搜索结果高亮匹配词
  - [ ] 搜索框键盘快捷键
- **Owner**: 小紫
- **Estimate**: 1.5h

---

## 3. Milestone Schedule

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 项目基础结构 | 2026-06-20 | Next.js 项目可运行 |
| M2: 市场板块试点 | 2026-06-22 | 市场 + 价格页面可访问 |
| M3: 知识图谱上线 | 2026-06-26 | 知识图谱页面 + LLM 分析 |
| M4: 全板块完成 | 2026-07-05 | 6 大板块全部就绪 |
| M5: Gitee Pages 部署 | 2026-07-10 | 公开可访问站点 |

---

## 4. Risk Register

| 风险 | 概率 | 影响 | 缓解措施 | 负责人 |
|------|------|------|---------|--------|
| 数据源网站改版 | High | Medium | 多源冗余 + 手动录入 | 小月 |
| LLM API 限流 | Medium | High | 缓存结果 + 降级 | 小月 |
| 知识图谱渲染性能 | Medium | Medium | 节点数限制 + 分页 | 小紫 |
| 移动端适配工作量超预期 | Low | Medium | 优先核心页面 | 小紫 |

---

## 5. Dependencies

| 任务 | 前置任务 |
|------|---------|
| 所有前端页面 | Task 1.1 (项目基础结构) |
| 知识图谱页面 | Task 2.2 (实体提取脚本) |
| LLM 分析引擎 | Task 1.6 (首页 KPI) |
| Gitee Pages 部署 | Task 4.1 (所有页面完成) |

---

## 6. Notes

- 每个任务完成后，在 CHANGELOG.md 记录 [FEATURE] 或 [FIX]
- 数据更新频率请遵守框架设计文档 7.4 节约定
- 代码审查在每个 Phase 完成后进行
