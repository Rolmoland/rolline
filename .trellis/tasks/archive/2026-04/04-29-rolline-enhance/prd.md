# rolline statusline 增强 v1.1

## Goal

在现有"模型 · 文件夹"基础上，为 rolline 添加图标、卸载命令、项目级安装支持，并升级到 v1.1.0。

## Requirements

* 为模型和文件夹显示分别添加 Unicode 图标
* 增加 `rolline uninstall` 卸载命令（全局）
* 增加 `rolline --project` 安装到项目级 `.claude/settings.json`
* 增加 `rolline uninstall --project` 卸载项目级配置
* 版本号升级为 `1.1.0`

## Acceptance Criteria

* [ ] statusline 显示带图标：`◆ ModelName · ◎ FolderName`
* [ ] `npx rolline` 安装到全局（行为不变）
* [ ] `npx rolline --project` 安装到 `./.claude/settings.json`
* [ ] `npx rolline uninstall` 移除全局 statusLine 配置 + 删除 rolline.js
* [ ] `npx rolline uninstall --project` 仅移除当前项目的 statusLine 配置
* [ ] `package.json` version 为 `1.1.0`

## Out of Scope

* 切换到 Rust/Go 重写
* 主题系统
* Git 信息显示

## Technical Notes

* 脚本入口：`rolline/bin/install.js`
* 状态栏脚本：`rolline/lib/statusline.js`
* 全局脚本目标：`~/.claude/rolline.js`
* 全局设置：`~/.claude/settings.json`
* 项目设置：`<cwd>/.claude/settings.json`
* 卸载时：全局卸载同时删除 rolline.js；项目卸载只改 settings，不删脚本
