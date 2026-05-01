# fix: 启动时显示上下文占用条

## Goal

v1.2 新增的上下文占用条在刚打开 Claude Code 时不显示，需要第一次对话后才出现。原因是启动时 `current_usage` 为 null，`renderContextBar` 提前返回 null。

## Root Cause

`statusline.js:renderContextBar` 中：
```js
const usage = contextWindow.current_usage;
if (!usage) return null;  // 启动时 usage 为 null，直接返回，条状图不显示
```

## Requirements

- 启动时（无对话）也显示上下文占用条，显示 0% 状态
- 有对话后正常显示实际占用百分比

## Acceptance Criteria

- [ ] 打开 Claude Code 立即显示 `▱▱▱▱▱▱▱▱▱▱ 0% (0/200k)` 格式的条状图
- [ ] 第一次对话后正常更新为实际用量
- [ ] 颜色逻辑不变（绿/黄/红）

## Out of Scope

- 不改变已有的颜色阈值
- 不改变 bar 格式

## Technical Notes

- 文件: `rolline/lib/statusline.js`
- 修改: 当 `usage` 为 null 时，用全零值代替，而非返回 null
