# v1.2 context usage bar

## Goal

为 rolline statusLine 增加 **context usage bar**（上下文用量指示器），让用户在编码时实时看到当前会话已经消耗了多少上下文窗口（避免不知不觉撞到上限）。

## What I already know

- 当前 statusline 显示：`◆ <model> · ◎ <folder>`
- 实现位置：`rolline/lib/statusline.js`，从 stdin 读 JSON，向 stdout 输出一行
- Claude Code 通过 stdin 传给 statusline 的 JSON 至少含：
  - `model.display_name`
  - `transcript_path`（JSONL 文件路径，包含完整对话 + 每条 assistant 消息的 `usage`）
  - `session_id` / `cwd` / `workspace.current_dir` / `version` / `cost`（不同版本字段略有差异）
- **token 用量获取方式**：读 `transcript_path` 末尾若干行 JSONL，找到最近一条 assistant 消息的 `message.usage`，
  本轮上下文输入 ≈ `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`
- **上下文上限**：
  - Sonnet 4.x / Opus 4.x 默认：200k
  - Opus 4.x 1M 模式：1M（model id 通常带 `[1m]` 或 `1m` 后缀）
  - Haiku：200k
- 包元信息：`rolline/package.json` v1.1.0，bin 入口 `rolline/bin/install.js`，statusline 脚本 `rolline/lib/statusline.js`

## Assumptions (temporary)

- 用户希望「眼可见」：进度条 + 百分比/数字，比纯数字更直观
- 性能不能拖慢 statusline（Claude Code 要求 <300ms），需控制 transcript 解析量（仅读末尾几 KB）
- 仅当能解析出有效 usage 时显示用量；否则静默隐藏（不报错、不影响现有显示）

## Open Questions

(brainstorm 推进中逐项消除)

## Requirements (evolving)

- 在现有 statusline 末尾追加上下文用量段
- 不破坏 v1.1 已有的 `◆ model · ◎ folder` 显示
- 解析失败时静默降级（不显示用量段，保留原有两段）
- **展示形式（已确认）：进度条 + 百分比 + 绝对值**
  - 格式示例：`▰▰▰▰▱▱▱▱▱▱ 42% (84k/200k)`
  - 实心 `▰` / 空心 `▱`，10 格
  - 数字按千进制压缩（`84k` / `1.2M`），保留 1 位小数
- 颜色阈值（已确认）：< 60% 绿、60–85% 黄、> 85% 红
- **上下文上限检测（已确认）**：自动从 stdin JSON 的 model id 推断
  - id 含 `1m` / `[1m]` → 1,000,000
  - 其他 → 200,000
  - 推断不出（无 model id）→ 默认 200,000
  - 不引入环境变量配置（保持「零配置」原则）

## Acceptance Criteria

- [ ] token=0 或 usage 为空时显示空 bar：`▱▱▱▱▱▱▱▱▱▱ 0% (0/200k)`（绿色）
- [ ] 用量 < 60% → bar 绿色；60–85% → 黄色；> 85% → 红色
- [ ] 1M 模型分母为 1,000,000，200k 模型分母为 200,000
- [ ] `transcript_path` 不存在 / JSONL 不可读 → 不报错、不显示 bar、原有两段正常输出
- [ ] statusline 总耗时目标 <100ms（仅读尾部 32KB）
- [ ] Windows / macOS / Linux 路径均可用

## Definition of Done

- 代码改动集中在 `rolline/lib/statusline.js`，无 Node 原生模块外的新依赖
- 手动验证：在真实 Claude Code 会话中显示正确
- 版本号升级到 `1.2.0`
- README/journal 同步（如有 README）
- 兼容 Windows / macOS / Linux 路径

## Decision (ADR-lite)

**Context**: Expansion sweep 发现三个分叉点：token=0 时是否显示、bar 区域是否预留扩展、是否加跨版本注释  
**Decision**:
- token=0（或无 usage 但 transcript_path 可读）→ 显示空 bar `▱×10 0% (0/200k)`
- bar 段封装为独立函数 `renderContextBar(usage, modelId)`，返回字符串或 null；未来新段直接 push 进 parts 数组  
- 不添加"未来用途"注释（代码结构即文档）  

**Consequences**: bar 函数职责单一，易测试；null 返回保证降级行为；未来加 cost/latency 段只需增加新函数 + push

## Out of Scope (explicit)

- 输出 token 展示（output tokens / cost bar）
- 自定义上下文上限配置（环境变量或 config 文件）
- 128k 以外的新模型自动探测（仅维护已知 1M 规则，其余 fallback 200k）
- 终端宽度自适应（bar 固定 10 格）

## Technical Notes

- 不引入额外 npm 依赖，使用 Node 标准库 `path`
- **实现发现**：Claude Code v2.1.123 在 stdin JSON 中直接传入 `context_window.current_usage`，无需读取 transcript 文件
  - `context_window.context_window_size` → 上下文上限
  - `context_window.current_usage.input_tokens` / `cache_creation_input_tokens` / `cache_read_input_tokens` → token 用量
  - 比 transcript 方案更简单，无文件 I/O，无路径兼容问题
- 颜色：ANSI 转义码；阈值（绿/黄/红）见 Requirements
- 实际运行文件：`~/.claude/rolline.js`（由 `bin/install.js` 从 `lib/statusline.js` 复制）
