# 天线知识图谱 每日增量上传 — 执行记录

## 2026-07-15 16:00 (UTC+8) — 中止（工作树不干净）
- 脚本 `scripts/kg_daily_incremental.py --apply` 在 `git_sync_start` 阶段中止
- 报错原文：`RuntimeError: 工作树存在未提交改动，已中止以避免覆盖。请先 git status 处理后再运行。`
- 脏文件：`app/page.tsx`（modified, unstaged，65 insertions / 56 deletions，共 121 行改动）
- 影响：**未上传任何新卡片，README 未改动，knowledge-graph.json 与 public/kg-cards-rendered 已部署卡片均未触碰**
- 上次成功上传 commit：`96b675e2` (2026-07-14 15:56)
- 待人工处理：先决定 `app/page.tsx` 的改动是提交还是丢弃（别乱 checkout），工作树干净后重跑自动化即可
