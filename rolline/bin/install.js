#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CLAUDE_GLOBAL_DIR = path.join(os.homedir(), '.claude');
const GLOBAL_SETTINGS   = path.join(CLAUDE_GLOBAL_DIR, 'settings.json');
const SCRIPT_SRC        = path.join(__dirname, '..', 'lib', 'statusline.js');
const SCRIPT_DEST       = path.join(CLAUDE_GLOBAL_DIR, 'rolline.js');

const args        = process.argv.slice(2);
const isUninstall = args.includes('uninstall');
const isProject   = args.includes('--project');

const settingsPath = isProject
  ? path.join(process.cwd(), '.claude', 'settings.json')
  : GLOBAL_SETTINGS;

if (isUninstall) {
  uninstall(settingsPath, isProject);
} else {
  install(settingsPath, isProject);
}

function readSettings(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return {}; }
}

function writeSettings(file, settings) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf8');
}

function install(settingsPath, isProject) {
  if (!fs.existsSync(CLAUDE_GLOBAL_DIR)) fs.mkdirSync(CLAUDE_GLOBAL_DIR, { recursive: true });
  fs.copyFileSync(SCRIPT_SRC, SCRIPT_DEST);

  const settings = readSettings(settingsPath);
  settings.statusLine = { type: 'command', command: `node "${SCRIPT_DEST}"` };
  writeSettings(settingsPath, settings);

  const scope = isProject ? 'project' : 'global';
  console.log(`✓ rolline installed (${scope})`);
  console.log(`  script   → ${SCRIPT_DEST}`);
  console.log(`  settings → ${settingsPath}`);
  console.log('\nRestart Claude Code to activate.');
}

function uninstall(settingsPath, isProject) {
  if (fs.existsSync(settingsPath)) {
    const settings = readSettings(settingsPath);
    delete settings.statusLine;
    writeSettings(settingsPath, settings);
  }

  if (!isProject && fs.existsSync(SCRIPT_DEST)) {
    fs.unlinkSync(SCRIPT_DEST);
  }

  const scope = isProject ? 'project' : 'global';
  console.log(`✓ rolline uninstalled (${scope})`);
  console.log(`  settings → ${settingsPath}`);
  console.log('\nRestart Claude Code to apply.');
}
