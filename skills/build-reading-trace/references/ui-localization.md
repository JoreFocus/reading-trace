# 阅迹界面本地化

`language` 使用 BCP 47 标签。中文与英文已有内置界面；其他语言必须在 `data/reading.json` 的 `ui` 中提供下面全部键，生成器会在缺键时停止，避免出现正文已翻译、控件仍是另一种语言的混杂页面。

保持短、自然、像该语言原生产品里的界面文字。不要逐字翻译中文语序。

## 身份与导航

`titleSuffix`、`navigation`、`themeToggle`、`brand`、`brandAction`、`companionReading`、`eyebrow`、`propositionUnit`、`coreLabel`

## 快捷键说明

`markShortcut`、`moveShortcut`、`editNoteShortcut`、`filterShortcut`、`nextUnmarkedShortcut`、`cancelFocusShortcut`、`keyboardShortcuts`、`nextItem`、`previousItem`、`toggleNote`、`exitEditing`、`previousFilter`、`nextFilter`、`saveAndNext`、`newLine`

## 标注与操作

`all`、`unmarked`、`deep`、`strong`、`partial`、`hold`、`disagree`、`firstHintBefore`、`firstHintAfter`、`export`、`restore`、`clear`、`clickToCopyHint`

## 备注与确认

`editNote`、`partialPrompt`、`holdPrompt`、`disagreePrompt`、`defaultPrompt`、`undo`、`confirmClear`、`clearedUndo`、`confirmRestore`、`restoredUndo`

## 完成与主题

`closingSub`、`backToEdit`、`copyResult`、`closingLines`（字符串数组，建议三条）、`copiedForAi`、`copied`、`clickToCopy`、`switchToLight`、`switchToDark`

## 一致性检查

- `title`、`summary`、`thesis`、`invitation`、分组、命题、结构标签与 `ui` 使用同一种语言。
- 品牌名可意译，不必保留中文“阅迹”。
- 快捷键本身不翻译，只翻译动作说明。
- 保留五种标记符号 `💡 ✅ 🟡 ⚪ ❌`，翻译其文字含义。
- 运行 `npm test`，并实际打开页面检查长词、复数、换行与按钮宽度。
