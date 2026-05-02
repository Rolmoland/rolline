#!/usr/bin/env node

const MODEL_COLOR  = '\x1b[36m';
const FOLDER_COLOR = '\x1b[33m';
const BRANCH_COLOR = '\x1b[35m';
const GREEN        = '\x1b[32m';
const YELLOW       = '\x1b[33m';
const RED          = '\x1b[31m';
const SEP          = ' \x1b[90m·\x1b[0m ';
const RESET        = '\x1b[0m';

const MODEL_ICON  = '🧠';
const FOLDER_ICON = '📂';
const BRANCH_ICON = '🌲';

const path = require('path');
const { execSync } = require('child_process');

function getGitBranch() {
  try {
    return execSync('git branch --show-current', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch (_) {
    return null;
  }
}

function fmtTokens(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function renderContextBar(contextWindow) {
  if (!contextWindow) return null;
  const usage = contextWindow.current_usage || {};

  const limit = contextWindow.context_window_size || 200000;
  const inputTokens = (usage.input_tokens || 0)
    + (usage.cache_creation_input_tokens || 0)
    + (usage.cache_read_input_tokens || 0);

  const pct = Math.min(inputTokens / limit, 1);
  const filled = Math.round(pct * 10);
  const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);
  const pctStr = Math.round(pct * 100) + '%';
  const numStr = `(${fmtTokens(inputTokens)}/${fmtTokens(limit)})`;

  let color;
  if (pct > 0.85)      color = RED;
  else if (pct > 0.60) color = YELLOW;
  else                 color = GREEN;

  return `${color}${bar} ${pctStr} ${numStr}${RESET}`;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(raw); } catch (_) {}

  const model  = data?.model?.display_name ?? 'Claude';
  const folder = path.basename(process.cwd());

  const branch = getGitBranch();

  const parts = [
    `${MODEL_COLOR}${MODEL_ICON} ${model}${RESET}`,
    `${FOLDER_COLOR}${FOLDER_ICON} ${folder}${RESET}`,
  ];

  if (branch) parts.push(`${BRANCH_COLOR}${BRANCH_ICON} ${branch}${RESET}`);

  const bar = renderContextBar(data?.context_window);
  if (bar) parts.push(bar);

  process.stdout.write(parts.join(SEP) + '\n');
});
