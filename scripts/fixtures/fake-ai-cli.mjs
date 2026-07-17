#!/usr/bin/env node

import {appendFileSync} from 'node:fs';

const supportedModes = new Set(['success', 'empty', 'fail', 'stdout-fail', 'hang']);
const mode = process.env.FAKE_MODE
  ?? process.argv.slice(2).find((argument) => supportedModes.has(argument))
  ?? 'success';
let input = '';

for await (const chunk of process.stdin) {
  input += chunk;
}

if (process.env.FAKE_CALL_LOG) {
  appendFileSync(process.env.FAKE_CALL_LOG, `${process.pid}\n`);
}

const failMatch = process.env.FAKE_FAIL_MATCH;

if (mode === 'hang') {
  setInterval(() => {}, 1000);
} else if (mode === 'stdout-fail') {
  process.stdout.write('{"is_error":true,"result":"OAuth access token has expired"}\n');
  process.exitCode = 1;
} else if (mode === 'fail' || (failMatch && input.includes(failMatch))) {
  process.stderr.write(`${process.env.FAKE_ERROR ?? 'fixture failure'}\n`);
  process.exitCode = 7;
} else if (mode === 'empty') {
  process.stdout.write('  \n');
} else {
  process.stdout.write(`# DRY RUN\n\n${input.trim()}\n`);
}
