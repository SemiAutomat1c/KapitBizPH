import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

import {
  buildInvocation,
  createStageDefinitions,
  parseArgs,
  resolveCommands,
  runDebate,
  runProcess,
} from '../ai-debate.mjs';

const root = '/tmp/hackathontagum';
const runDir = '/tmp/hackathontagum/planning/debate/runs/test-run';
const fakeProvider = fileURLToPath(new URL('../fixtures/fake-ai-cli.mjs', import.meta.url));

async function debateFixture(extra = {}) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'ai-debate-'));
  const brief = join(fixtureRoot, 'brief.md');
  await writeFile(brief, '# Debate brief\n\nCompare the candidate concepts.\n');

  return {
    root: fixtureRoot,
    brief,
    resume: null,
    timeoutMs: 2000,
    dryRun: false,
    commands: {
      claude: {command: process.execPath, prefixArgs: [fakeProvider]},
      codex: {command: process.execPath, prefixArgs: [fakeProvider]},
    },
    env: {...process.env},
    ...extra,
  };
}

test('parseArgs applies bounded defaults', () => {
  assert.deepEqual(parseArgs([]), {
    brief: 'planning/debate/brief.md',
    resume: null,
    timeoutMs: 720_000,
    dryRun: false,
  });
});

test('parseArgs accepts brief, resume, timeout, and dry-run options', () => {
  assert.deepEqual(
    parseArgs([
      '--brief',
      'custom.md',
      '--resume',
      'planning/debate/runs/previous',
      '--timeout',
      '30',
      '--dry-run',
    ]),
    {
      brief: 'custom.md',
      resume: 'planning/debate/runs/previous',
      timeoutMs: 30_000,
      dryRun: true,
    },
  );
});

test('parseArgs rejects missing values and invalid timeouts', () => {
  assert.throws(() => parseArgs(['--brief']), /requires a value/);
  assert.throws(() => parseArgs(['--timeout', '0']), /positive number/);
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
});

test('stage definitions contain six ordered outputs', () => {
  const stages = createStageDefinitions({root, runDir});

  assert.deepEqual(
    stages.map(({id, provider, output}) => ({id, provider, output})),
    [
      {id: 'claude-position', provider: 'claude', output: '01-claude-position.md'},
      {id: 'codex-position', provider: 'codex', output: '02-codex-position.md'},
      {id: 'claude-rebuttal', provider: 'claude', output: '03-claude-rebuttal.md'},
      {id: 'codex-rebuttal', provider: 'codex', output: '04-codex-rebuttal.md'},
      {id: 'claude-synthesis', provider: 'claude', output: '05-claude-synthesis.md'},
      {id: 'final-verdict', provider: 'codex', output: '06-final-verdict.md'},
    ],
  );
});

test('Claude invocation limits tools and disables session persistence', () => {
  const invocation = buildInvocation('claude', {
    root,
    commands: {claude: '/usr/local/bin/claude', codex: '/usr/local/bin/codex'},
  });

  assert.equal(invocation.command, '/usr/local/bin/claude');
  assert.deepEqual(invocation.args, [
    '--print',
    '--effort',
    'medium',
    '--no-session-persistence',
    '--permission-mode',
    'dontAsk',
    '--allowedTools',
    'Read,Glob,Grep',
  ]);
});

test('Codex invocation uses an ephemeral read-only sandbox', () => {
  const invocation = buildInvocation('codex', {
    root,
    commands: {claude: '/usr/local/bin/claude', codex: '/Applications/Codex'},
  });

  assert.equal(invocation.command, '/Applications/Codex');
  assert.deepEqual(invocation.args, [
    'exec',
    '--cd',
    root,
    '--sandbox',
    'read-only',
    '--skip-git-repo-check',
    '--ephemeral',
    '-',
  ]);
});

test('command resolution honors explicit provider overrides', async () => {
  const commands = await resolveCommands({
    env: {CLAUDE_BIN: '/fake/claude', CODEX_BIN: '/fake/codex'},
    probe: async () => true,
  });

  assert.deepEqual(commands, {claude: '/fake/claude', codex: '/fake/codex'});
});

test('runProcess returns provider stdout', async () => {
  const result = await runProcess({
    command: process.execPath,
    args: [fakeProvider, 'success'],
    input: 'round prompt',
    cwd: process.cwd(),
    timeoutMs: 2000,
  });

  assert.match(result.stdout, /round prompt/);
  assert.equal(result.exitCode, 0);
});

test('runProcess reports a non-zero provider exit', async () => {
  await assert.rejects(
    runProcess({
      command: process.execPath,
      args: [fakeProvider, 'fail'],
      input: 'round prompt',
      cwd: process.cwd(),
      timeoutMs: 2000,
    }),
    /exited with code 7.*fixture failure/s,
  );
});

test('runProcess reports provider stdout when stderr is empty', async () => {
  await assert.rejects(
    runProcess({
      command: process.execPath,
      args: [fakeProvider, 'stdout-fail'],
      input: 'round prompt',
      cwd: process.cwd(),
      timeoutMs: 2000,
    }),
    /exited with code 1.*OAuth access token has expired/s,
  );
});

test('runProcess rejects empty provider output', async () => {
  await assert.rejects(
    runProcess({
      command: process.execPath,
      args: [fakeProvider, 'empty'],
      input: 'round prompt',
      cwd: process.cwd(),
      timeoutMs: 2000,
    }),
    /empty output/,
  );
});

test('runProcess terminates a provider after timeout', async () => {
  await assert.rejects(
    runProcess({
      command: process.execPath,
      args: [fakeProvider, 'hang'],
      input: '',
      cwd: process.cwd(),
      timeoutMs: 50,
    }),
    /timed out/,
  );
});

test('runDebate creates six outputs and a complete manifest', async () => {
  const options = await debateFixture();
  const result = await runDebate(options);
  const manifest = JSON.parse(await readFile(join(result.runDir, 'manifest.json'), 'utf8'));

  assert.equal(manifest.status, 'complete');
  assert.equal(manifest.stages.filter((stage) => stage.status === 'complete').length, 6);
  assert.equal(manifest.stages.every((stage) => stage.command && stage.exitCode === 0), true);
  assert.equal(result.executedStages, 6);
  assert.match(await readFile(result.finalPath, 'utf8'), /Stage: final-verdict/);
});

test('opening positions do not reference the opponent output', async () => {
  const result = await runDebate(await debateFixture());
  const claudeOpening = await readFile(join(result.runDir, '01-claude-position.md'), 'utf8');
  const codexOpening = await readFile(join(result.runDir, '02-codex-position.md'), 'utf8');

  assert.doesNotMatch(claudeOpening, /02-codex-position\.md/);
  assert.doesNotMatch(codexOpening, /01-claude-position\.md/);
});

test('failed debate preserves completed stages and records the failure', async () => {
  const options = await debateFixture({
    env: {...process.env, FAKE_FAIL_MATCH: 'Stage: claude-rebuttal'},
  });

  let failure;
  try {
    await runDebate(options);
  } catch (error) {
    failure = error;
  }

  assert.ok(failure);
  assert.ok(failure.runDir);
  const manifest = JSON.parse(await readFile(join(failure.runDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.status, 'failed');
  assert.deepEqual(manifest.stages.slice(0, 3).map((stage) => stage.status), [
    'complete',
    'complete',
    'failed',
  ]);
  assert.equal(manifest.stages[2].exitCode, 7);
});

test('resume skips completed stages and executes only remaining calls', async () => {
  const callLog = join(await mkdtemp(join(tmpdir(), 'ai-debate-calls-')), 'calls.log');
  const failing = await debateFixture({
    env: {
      ...process.env,
      FAKE_CALL_LOG: callLog,
      FAKE_FAIL_MATCH: 'Stage: claude-rebuttal',
    },
  });

  let failedRun;
  try {
    await runDebate(failing);
  } catch (error) {
    failedRun = error.runDir;
  }

  const resumed = await runDebate({
    ...failing,
    resume: failedRun,
    env: {...process.env, FAKE_CALL_LOG: callLog},
  });
  const calls = (await readFile(callLog, 'utf8')).trim().split('\n');

  assert.equal(resumed.executedStages, 4);
  assert.equal(calls.length, 7);
  assert.equal(JSON.parse(await readFile(join(resumed.runDir, 'manifest.json'), 'utf8')).status, 'complete');
});

test('dry run never resolves or invokes configured real providers', async () => {
  const options = await debateFixture({
    dryRun: true,
    commands: {
      claude: '/does/not/exist/claude',
      codex: '/does/not/exist/codex',
    },
  });

  const result = await runDebate(options);

  assert.equal(result.executedStages, 6);
  assert.match(await readFile(result.finalPath, 'utf8'), /# DRY RUN/);
});

test('shell entry point completes a default dry run from any project root', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'ai-debate-wrapper-'));
  const debateDir = join(fixtureRoot, 'planning', 'debate');
  await mkdir(debateDir, {recursive: true});
  await writeFile(join(debateDir, 'brief.md'), '# Wrapper test brief\n');

  const result = await runProcess({
    command: join(process.cwd(), 'scripts', 'run-ai-debate.sh'),
    args: ['--dry-run'],
    input: '',
    cwd: process.cwd(),
    timeoutMs: 5000,
    env: {...process.env, AI_DEBATE_ROOT: fixtureRoot},
  });
  const finalPath = result.stdout.trim();

  assert.match(finalPath, /06-final-verdict\.md$/);
  assert.match(await readFile(finalPath, 'utf8'), /# DRY RUN/);
});

test('failed provider secrets are redacted from persisted diagnostics', async () => {
  const options = await debateFixture({
    env: {
      ...process.env,
      FAKE_FAIL_MATCH: 'Stage: claude-position',
      FAKE_ERROR: 'ANTHROPIC_API_KEY=top-secret sk-test-secret',
    },
  });

  let runDir;
  try {
    await runDebate(options);
  } catch (error) {
    runDir = error.runDir;
  }

  const manifestText = await readFile(join(runDir, 'manifest.json'), 'utf8');
  const logText = await readFile(join(runDir, 'run.log'), 'utf8');
  assert.doesNotMatch(manifestText + logText, /top-secret|sk-test-secret/);
  assert.match(manifestText + logText, /\[REDACTED\]/);
});
