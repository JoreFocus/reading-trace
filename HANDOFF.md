# 项目接力说明

这份文件让下一次对话或另一个 Agent 能够继续当前项目。它只记录“现在到了哪里”，长期设计原则仍以 `README.md`、`AGENTS.md` 和 `docs/` 为准。

## 当前状态

- 稳定分支：`main`
- 内容入口：`data/reading.json`
- 交互模板：`templates/reading-trace.html`
- 公开体验页：`public/experience.html`，由脚本生成，不要直接修改
- 当前示例：梭罗《瓦尔登湖》第二章
- 最近完成：增加 Git 检查点与 `HANDOFF.md` 接力机制
- 待接手事项：无

## 如何恢复工作

```bash
npm install
npm test
npm run dev
```

打开 `http://localhost:3000`。如果只更换阅读材料，默认只修改 `data/reading.json`。

## 交给下一个 Agent 前

1. 运行 `npm test`，确认当前版本可以构建。
2. 用 Git 提交一个可恢复的检查点，不要把一组未说明的改动留在工作区。
3. 更新本文件的“当前状态”和“待接手事项”：写清已完成什么、还卡在哪里、下一步先做什么。
4. 如果有未解决的故障，附上复现方法和最后一次成功的提交。

## 最小接力格式

后续可以直接按以下格式替换“待接手事项”：

```markdown
- 已完成：
- 正在处理：
- 已知问题：
- 下一步：
- 最后可用提交：
```
