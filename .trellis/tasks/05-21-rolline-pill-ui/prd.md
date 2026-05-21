# rolline statusLine 视觉升级 v2.0

## Goal

将 `rolline/lib/statusline.js` 改写为 Capsule 胶囊风格：彩色背景块 + ASCII 符号前缀 + 2 行布局，无 emoji，无切换机制，写死单一风格。

## Confirmed Requirements

* **风格**：Capsule 胶囊——每段独立彩色背景块，两侧空格 padding，段间有间隙
* **布局**：2 行，左对齐
* **无 emoji**：用简洁 ASCII 符号（`§` `*` `$` `⊙`）替代，或直接无前缀
* **无切换机制**：硬编码单一风格
* API 配额（每日/每周/到期）：**不在此版本 scope 内**

## Layout

```
Row 1:  statueLine    master    * Sonnet 4.6
Row 2:  1m    $0.08    ▰▰▱▱▱▱▱▱▱▱ 11% (21.8k/200k)
```

## Segment Spec（与现版本种类完全一致，共 6 段）

| 段 | 前缀 | 数据来源 | 颜色（初版） | 可选 |
|---|---|---|---|---|
| 项目名 | 无 | `path.basename(cwd)` | 橙色 `rgb(220,100,30)` | 否 |
| Git 分支 | 无 | `git branch --show-current` | 青色 `rgb(0,180,160)` | 是（无 git 时跳过） |
| 模型名 | `*` | `data.model.display_name` | 蓝色 `rgb(60,130,220)` | 否 |
| 会话时长 | 无 | `data.cost.total_duration_ms` | 紫色 `rgb(140,80,200)` | 是（0 时跳过） |
| 费用 | `$` | `data.cost.total_cost_usd` | 绿色 `rgb(40,180,80)` | 是（null 时跳过） |
| 上下文条 | 无 | `context_window`（进度条格式） | 动态：绿/黄/红 | 是（无数据时跳过） |

**上下文条格式保持不变**：`▰▰▱▱▱▱▱▱▱▱ 11% (21.8k/200k)`，颜色随占用率变化（≤60% 绿，≤85% 黄，>85% 红），整体包裹在胶囊背景块内。

## Acceptance Criteria

* [ ] 每段显示为独立彩色背景块（背景色 + 白色文字 + 两侧 1 空格 padding）
* [ ] 2 行布局：Row1 = 项目名/分支/模型；Row2 = tokens/费用/上下文/时长
* [ ] 无 emoji
* [ ] git 分支不存在时跳过该段
* [ ] 费用为 null 时跳过费用段
* [ ] 会话时长为 0 时跳过时长段

## Definition of Done

* 在本机 Claude Code 中视觉测试通过
* `rolline.js` 同步更新到 `C:\Users\22067\.claude\`

## Out of Scope

* Powerline 箭头风格、TUI 网格风格
* API 配额（每日/每周/到期天数）
* SQLite 历史统计
* npm 发布流程

## Technical Notes

* 源文件：`rolline/lib/statusline.js`
* 部署目标：`C:\Users\22067\.claude\rolline.js`
* Claude Code settings：`"command": "node \"C:\\Users\\22067\\.claude\\rolline.js\""`
* ANSI 真彩色背景：`\x1b[48;2;R;G;Bm`，白色前景：`\x1b[97m`，重置：`\x1b[0m`
* 多行：stdout 直接输出 `\n`
* stdin JSON 已知字段：`data.model.display_name`、`data.cost.total_duration_ms`、`data.cost.total_cost_usd`、`data.context_window.current_usage`、`data.context_window.context_window_size`
* 零依赖，不引入 chalk 等第三方库
