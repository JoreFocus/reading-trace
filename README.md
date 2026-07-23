# 阅迹 Reading Trace

把文本结构、读者判断与理解变化，呈现为一个可交互的阅读界面。

阅迹不是摘要工具。它保留原文，让读者在关键位置标记“被击中、认同、部分认同、保留、反对”，写下原因，并导出一份属于自己的阅读轨迹。

当前版本使用梭罗《瓦尔登湖》第二章作为公版示例。

## 它解决什么

普通阅读页面只呈现文本，普通笔记只保存结果。阅迹尝试保存中间发生的事：

- 哪些句子改变了阅读速度；
- 读者在哪里接受、迟疑或反对；
- 判断背后的理由是什么；
- 阅读结束后，理解沿着什么路径发生变化。

## 功能

- 数据驱动的章节、引文、结构角色与碰撞问题；
- 五档读者判断及即时进度统计；
- 对低认同标记自动打开追问；
- 按标记筛选，键盘移动和快捷标注；
- 设备本地自动保存；
- 一键导出 Markdown 阅读轨迹；
- 桌面端与移动端响应式界面。

## 快速开始

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

构建与验证：

```bash
npm test
```

## 换成自己的阅读材料

复制 `data/walden.ts`，按照 `data/types.ts` 的结构填写：

```ts
{
  id: "unique-reading-id",
  title: "文本标题",
  summary: "全文在处理什么",
  thesis: "这一遍阅读的核心张力",
  groups: [
    {
      id: "section-id",
      title: "章节标题",
      items: [
        {
          id: "I-01",
          role: "core",
          quote: "原文",
          context: "必要的上下文或结构说明",
          prompt: "要求读者形成判断的问题"
        }
      ]
    }
  ]
}
```

然后在 `app/page.tsx` 中更换数据导入。界面不要求固定使用某种阅读理论；`core / support / turn` 的显示名称可以在数据文件中自行配置。

## 设计方法

如果你不只想使用面板，还想打造自己的阅读界面，请阅读：

- [`docs/panel-evolution.md`](docs/panel-evolution.md)：这个面板从问题到成形的打磨记录；
- [`docs/build-your-reading-panel.md`](docs/build-your-reading-panel.md)：从实践中提炼出的通用方法。

## 来源与致谢

阅迹诞生于我的 AI 伴读实践。伴读实践受到李继刚先生 [`ljg-read`](https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-read) 的启发，在此致谢。

本项目聚焦阅读界面的呈现问题；界面设计、数据结构、渲染流程与面板设计方法为独立实现。更完整的说明见 [`ACKNOWLEDGEMENTS.md`](ACKNOWLEDGEMENTS.md)。

《瓦尔登湖》示例原文取自 [Project Gutenberg eBook #205](https://www.gutenberg.org/ebooks/205)，该来源页面将此版本标注为美国公版。

## License

项目代码与原创文档采用 [MIT License](LICENSE)。第三方原文、名称及链接不因收录而改变其原有权利状态。
