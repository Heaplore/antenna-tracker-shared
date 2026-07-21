# Shared Workspace — antenna-tracker 三方协作规范

## 仓库信息

- **本地共享目录**：`E:\shared\antenna-tracker`
- **GitHub 远端**：`https://github.com/Heaplore/antenna-tracker-shared.git`
- **Pages 地址**：`https://heaplore.github.io/antenna-tracker-shared/`

## 三方分工

| Agent | 职责 |
|-------|------|
| hermes（本地） | 主力开发、写代码、跑 build、本地验证、数据层和自动化脚本 |
| openclaw | 审查/补充、文档规范、数据逻辑、跨端一致性检查、review |
| 云端 hermes | GitHub 运维、CI/CD、Actions/Pages 部署、远程验证、推远端 |

## 协作流程

```
老大发布任务
  ↓
openclaw 判断类型，分配开发
  ↓
hermes（本地）主力开发 + 本地 build 验证
  ↓
openclaw review / 补充
  ↓
改完在群里同步变更摘要
  ↓
@ 云端 hermes "可推送"
  ↓
云端 hermes 推远端 + 触发 Actions + Pages 部署
  ↓
云端 hermes 验证页面可用性
```

## 冲突处理规则

1. **同文件冲突** → 谁先改的先保留，后改的 rebase 对齐
2. **无法判断时** → 群里问老大决定
3. **云端 hermes 不主动覆盖本地文件**，只负责推远端和部署验证
4. **本地开发统一改** `E:/shared/antenna-tracker`，避免各写各的分支

## 配置文件管理边界

- CI/CD 配置文件（`.github/workflows/*.yml`、`_config.yml`、部署脚本）由云端 hermes 统一管理
- 本地 hermes / openclaw 不直接改这些文件
- 需要调整时群里 @ 云端 hermes，通过 PR 合并

## 推送信号格式

本地开发完成后在群里 @ 云端 hermes，说明：
- 改了哪些文件/目录
- 本地 build 是否通过
- 是否可以推远端
