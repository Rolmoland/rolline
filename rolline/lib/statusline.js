#!/usr/bin/env node

const MODEL_COLOR  = '\x1b[36m';
const FOLDER_COLOR = '\x1b[33m';
const SEP          = ' \x1b[90m·\x1b[0m ';
const RESET        = '\x1b[0m';

const MODEL_ICON  = '◆';
const FOLDER_ICON = '◎';

const path = require('path');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(raw); } catch (_) {}

  const model  = data?.model?.display_name ?? 'Claude';
  const folder = path.basename(process.cwd());

  const parts = [
    `${MODEL_COLOR}${MODEL_ICON} ${model}${RESET}`,
    `${FOLDER_COLOR}${FOLDER_ICON} ${folder}${RESET}`,
  ];

  process.stdout.write(parts.join(SEP) + '\n');
});
