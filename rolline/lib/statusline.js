#!/usr/bin/env node

// Segment colors [r, g, b]
const C = {
  model:   [220, 100,  30],  // 橙
  cwd:     [ 60, 130, 220],  // 蓝
  branch:  [  0, 180, 160],  // 青
  dur:     [140,  80, 200],  // 紫
  cost:    [ 40, 180,  80],  // 绿
  ctxLow:  [190,  60, 140],  // 粉紫
  ctxMid:  [200, 160,  20],  // 金黄
  ctxHigh: [200,  60,  60],  // 红
};

const PL    = '';  // Nerd Font solid right arrow ▶
const RESET = '\x1b[0m';
const WHITE = '\x1b[97m';

function bg(r, g, b) { return `\x1b[48;2;${r};${g};${b}m`; }
function fg(r, g, b) { return `\x1b[38;2;${r};${g};${b}m`; }

// Powerline 连接：箭头 fg=上一段 bg，bg=下一段 bg，实现无缝色块过渡
function renderLine(segments) {
  if (!segments.length) return '';
  let out = '';
  for (let i = 0; i < segments.length; i++) {
    const [r, g, b] = segments[i].color;
    const next = segments[i + 1];
    out += `${bg(r, g, b)}${WHITE} ${segments[i].text} `;
    if (next) {
      const [nr, ng, nb] = next.color;
      out += `${fg(r, g, b)}${bg(nr, ng, nb)}${PL}`;
    } else {
      out += `${RESET}${fg(r, g, b)}${PL}${RESET}`;
    }
  }
  return out;
}

const path = require('path');
const { execSync } = require('child_process');

function getGitBranch() {
  try {
    return execSync('git branch --show-current', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim() || null;
  } catch (_) { return null; }
}

function fmtDuration(ms) {
  if (!ms) return null;
  const secs  = Math.floor(ms / 1000);
  const hours = Math.floor(secs / 3600);
  const mins  = Math.floor((secs % 3600) / 60);
  if (hours > 0) return `${hours}h${mins}m`;
  if (mins === 0) return null;
  return `${mins}m`;
}

function fmtTokens(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function ctxSegment(contextWindow) {
  if (!contextWindow) return null;
  const usage  = contextWindow.current_usage || {};
  const limit  = contextWindow.context_window_size || 200000;
  const tokens = (usage.input_tokens || 0)
    + (usage.cache_creation_input_tokens || 0)
    + (usage.cache_read_input_tokens || 0);
  if (tokens === 0) return null;

  const pct    = Math.min(tokens / limit, 1);
  const filled = Math.round(pct * 10);
  const bar    = '▰'.repeat(filled) + '▱'.repeat(10 - filled);
  const text   = `${bar} ${Math.round(pct * 100)}% (${fmtTokens(tokens)}/${fmtTokens(limit)})`;
  const color  = pct > 0.85 ? C.ctxHigh : pct > 0.60 ? C.ctxMid : C.ctxLow;
  return { color, text };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(raw); } catch (_) {}

  const model    = data?.model?.display_name ?? 'Claude';
  const folder   = path.basename(process.cwd());
  const branch   = getGitBranch();
  const duration = fmtDuration(data?.cost?.total_duration_ms);
  const costUsd  = data?.cost?.total_cost_usd;
  const cost     = costUsd != null ? `$${costUsd.toFixed(2)}` : null;
  const ctx      = ctxSegment(data?.context_window);

  const segs = [
    { color: C.model, text: `* ${model}` },
    { color: C.cwd,   text: `⌂ ${folder}` },
    duration ? { color: C.dur,  text: `⧗ ${duration}` } : null,
    cost     ? { color: C.cost, text: cost }      : null,
    ctx,
    branch   ? { color: C.branch, text: branch }  : null,
  ].filter(Boolean);

  process.stdout.write(renderLine(segs) + '\n');
});
