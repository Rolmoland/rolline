#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CLAUDE_DIR    = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const SCRIPT_SRC    = path.join(__dirname, '..', 'lib', 'statusline.js');
const SCRIPT_DEST   = path.join(CLAUDE_DIR, 'rolline.js');

// Ensure ~/.claude exists
if (!fs.existsSync(CLAUDE_DIR)) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
}

// Copy statusline script
fs.copyFileSync(SCRIPT_SRC, SCRIPT_DEST);

// Read or initialize settings.json
let settings = {};
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (_) {}
}

// Inject statusLine config
settings.statusLine = {
  type: 'command',
  command: `node "${SCRIPT_DEST}"`,
};

fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

console.log('✓ rolline installed');
console.log(`  script → ${SCRIPT_DEST}`);
console.log(`  settings → ${SETTINGS_FILE}`);
console.log('\nRestart Claude Code to activate.');
