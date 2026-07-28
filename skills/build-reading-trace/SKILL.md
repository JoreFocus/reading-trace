---
name: build-reading-trace
description: Turn articles, book excerpts, transcripts, companion-reading notes, or personal review annotations into an original interactive Reading Trace experience. Use when the user wants to create a new 阅迹, adapt the Reading Trace repository to new material, convert an existing reading analysis into the project's JSON content model, or evolve the interface when the material requires a new reading interaction.
---

# 构建阅迹

把材料转化为“读者可以进入并留下判断”的界面。保留材料自己的声音，以原则引导创作，不套用固定章节数、固定提问或固定叙事模板。

## 工作路径

1. 定位 Reading Trace 项目根目录。确认存在 `data/reading.json`、`AGENTS.md` 与 `package.json`。
2. 完整阅读根目录 `AGENTS.md`。
3. 阅读用户提供的原文、伴读记录或复盘标注，先区分哪些是来源内容、已有分析和用户自己的判断。
4. 阅读 `docs/creating-with-agents.md` 与 `docs/build-your-reading-panel.md`。让材料的独特结构决定分组方式。
5. 需要字段细节或质量检查时，读取 `references/content-contract.md`。
6. 默认只重写 `data/reading.json`。不要为了生成新内容复制页面组件。
7. 运行 `npm run validate:content`，再运行 `npm test`。
8. 向用户说明采用了什么阅读路径、保留了什么来源边界，以及是否存在公开传播风险。

## 核心判断

- 把 `quote` 当作来源层，只放作者或讲者确实表达的内容。
- 把 `context` 当作系统判断层，解释这一位置的结构意义，不伪装成原文。
- 把 `prompt` 当作读者入口，不替读者回答，不设置标准答案。
- 按矛盾、转折、论证依赖、时间变化或认知运动组织材料，不默认按原文段落切块。
- 只选择能够生成判断的位置。金句若不能使读者形成判断，就不必收录。
- 保留材料的词汇、节奏与立场差异，避免把所有内容统一成一种 AI 文风。

## 何时改变界面

只有当材料需要现有页面无法表达的认知动作时，才修改 `templates/reading-trace.html`。例如多方对话、时间演化、证据与反证、“当时 / 现在”双重判断。先说明新增关系，再设计最小交互；不要只为风格变化增加组件。`public/experience.html` 是自动生成文件，不要直接编辑。

## 来源与边界

公开发布前判断用户是否有权传播材料。对直播文稿、付费内容、内部资料或他人作品，减少原文复现，保留来源与授权说明；不确定时仅制作本地或私有版本。

本 Skill 构建的是阅迹的界面与内容关系，不复刻、重写或重新分发第三方伴读 Skill。若用户只提供原始材料，可以进行独立理解，但不要声称使用了某个未提供的专有伴读方法。

## 完成条件

- JSON 内容通过校验，页面构建与测试通过。
- 原文、系统判断、读者判断清晰分层。
- 每个阅读位置都值得一次真实判断。
- 作品仍然保留这份材料自身的声音。
- 来源、授权和公开范围已被明确处理。
