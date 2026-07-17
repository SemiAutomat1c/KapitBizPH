#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {
  access,
  appendFile,
  copyFile,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import {delimiter, isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_BRIEF = 'planning/debate/brief.md';
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1000;
const APP_CODEX = '/Applications/ChatGPT.app/Contents/Resources/codex';

export function parseArgs(argv) {
  const options = {
    brief: DEFAULT_BRIEF,
    resume: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];

    if (option === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (option === '--brief' || option === '--resume' || option === '--timeout') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${option} requires a value`);
      }
      index += 1;

      if (option === '--brief') options.brief = value;
      if (option === '--resume') options.resume = value;
      if (option === '--timeout') {
        const seconds = Number(value);
        if (!Number.isFinite(seconds) || seconds <= 0) {
          throw new Error('--timeout must be a positive number of seconds');
        }
        options.timeoutMs = seconds * 1000;
      }
      continue;
    }

    throw new Error(`Unknown option: ${option}`);
  }

  return options;
}

async function canAccess(command) {
  try {
    await access(command);
    return true;
  } catch {
    return false;
  }
}

async function commandWorks(command) {
  if (!(await canAccess(command))) return false;

  return new Promise((resolve) => {
    const child = spawn(command, ['--version'], {stdio: 'ignore'});
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(false);
    }, 3000);

    child.once('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

async function findOnPath(name, env) {
  const directories = (env.PATH ?? '').split(delimiter).filter(Boolean);
  for (const directory of directories) {
    const candidate = join(directory, name);
    if (await canAccess(candidate)) return candidate;
  }
  return null;
}

export async function resolveCommands({
  env = process.env,
  probe = commandWorks,
} = {}) {
  const claudeCandidates = [env.CLAUDE_BIN, await findOnPath('claude', env)].filter(Boolean);
  const codexCandidates = [env.CODEX_BIN, await findOnPath('codex', env), APP_CODEX].filter(Boolean);

  const select = async (provider, candidates) => {
    for (const candidate of [...new Set(candidates)]) {
      if (await probe(candidate)) return candidate;
    }
    throw new Error(`Unable to find a working ${provider} CLI`);
  };

  return {
    claude: await select('Claude', claudeCandidates),
    codex: await select('Codex', codexCandidates),
  };
}

export function createStageDefinitions() {
  return [
    {
      id: 'claude-position',
      provider: 'claude',
      output: '01-claude-position.md',
      inputs: [],
      instruction: 'Produce an independent opening position. Do not infer or anticipate the other model response.',
    },
    {
      id: 'codex-position',
      provider: 'codex',
      output: '02-codex-position.md',
      inputs: [],
      instruction: 'Produce an independent opening position. Do not infer or anticipate the other model response.',
    },
    {
      id: 'claude-rebuttal',
      provider: 'claude',
      output: '03-claude-rebuttal.md',
      inputs: ['02-codex-position.md'],
      instruction: 'Rebut the opposing opening. Concede valid points and identify unsupported claims.',
    },
    {
      id: 'codex-rebuttal',
      provider: 'codex',
      output: '04-codex-rebuttal.md',
      inputs: ['01-claude-position.md'],
      instruction: 'Rebut the opposing opening. Concede valid points and identify unsupported claims.',
    },
    {
      id: 'claude-synthesis',
      provider: 'claude',
      output: '05-claude-synthesis.md',
      inputs: [
        '01-claude-position.md',
        '02-codex-position.md',
        '03-claude-rebuttal.md',
        '04-codex-rebuttal.md',
      ],
      instruction: 'Propose a synthesis. Preserve unresolved disagreements and give a ranked recommendation with kill criteria.',
    },
    {
      id: 'final-verdict',
      provider: 'codex',
      output: '06-final-verdict.md',
      inputs: [
        '01-claude-position.md',
        '02-codex-position.md',
        '03-claude-rebuttal.md',
        '04-codex-rebuttal.md',
        '05-claude-synthesis.md',
      ],
      instruction: 'Audit the synthesis and issue the final verdict. Do not hide unresolved disagreement or missing validation.',
    },
  ];
}

export function buildInvocation(provider, {root, commands}) {
  const commandSpec = commands[provider];
  const command = typeof commandSpec === 'string' ? commandSpec : commandSpec.command;
  const prefixArgs = typeof commandSpec === 'string' ? [] : (commandSpec.prefixArgs ?? []);

  if (provider === 'claude') {
    return {
      command,
      args: [
        ...prefixArgs,
        '--print',
        '--effort',
        'medium',
        '--no-session-persistence',
        '--permission-mode',
        'dontAsk',
        '--allowedTools',
        'Read,Glob,Grep',
      ],
    };
  }

  if (provider === 'codex') {
    return {
      command,
      args: [
        ...prefixArgs,
        'exec',
        '--cd',
        root,
        '--sandbox',
        'read-only',
        '--skip-git-repo-check',
        '--ephemeral',
        '-',
      ],
    };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export function runProcess({
  command,
  args = [],
  input = '',
  cwd,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  env = process.env,
}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 250).unref();
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.once('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Unable to start ${command}: ${error.message}`));
    });

    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`${command} timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        const detail = (stderr.trim() || stdout.trim() || 'no provider error output').slice(0, 4000);
        const error = new Error(`${command} exited with code ${code}: ${detail}`);
        error.exitCode = code;
        reject(error);
        return;
      }
      if (!stdout.trim()) {
        reject(new Error(`${command} returned empty output`));
        return;
      }
      resolve({stdout, stderr, exitCode: code});
    });

    child.stdin.end(input);
  });
}

function redactDiagnostics(message) {
  return String(message)
    .replace(/\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD))\s*=\s*([^\s]+)/gi, '$1=[REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]');
}

function timestamp(date = new Date()) {
  return date.toISOString().replace(/:/g, '').replace('T', '-').replace(/\.\d{3}Z$/, '');
}

async function fileHasContent(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

function stagePrompt(stage, runDir) {
  const briefPath = join(runDir, '00-brief.md');
  const inputSection = stage.inputs.length
    ? `Read these opposing rounds before answering:\n${stage.inputs.map((file) => `- ${join(runDir, file)}`).join('\n')}`
    : 'This is an independent opening. Do not read or reference an opponent output.';

  return [
    'You are one participant in a bounded Claude-Codex product debate.',
    `Stage: ${stage.id}`,
    `Read the shared brief: ${briefPath}`,
    inputSection,
    '',
    stage.instruction,
    '',
    'Rules:',
    '- Distinguish verified facts, reasonable inferences, and unsupported assumptions.',
    '- Evidence that a problem exists is not evidence that users demand the proposed solution.',
    '- Evaluate Tagum relevance, one-day feasibility, honest demo credibility, dependencies, and kill criteria.',
    '- Do not modify files or request another round.',
    '- Return only the Markdown content for this stage.',
  ].join('\n');
}

async function appendLog(runDir, message) {
  await appendFile(join(runDir, 'run.log'), `${new Date().toISOString()} ${message}\n`, 'utf8');
}

export async function runDebate(options) {
  const root = resolve(options.root ?? process.cwd());
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = options.env ?? process.env;
  const onProgress = options.onProgress ?? (() => {});
  const resumePath = options.resume
    ? (isAbsolute(options.resume) ? options.resume : resolve(root, options.resume))
    : null;
  const runDir = resumePath ?? join(root, 'planning', 'debate', 'runs', timestamp(options.now?.()));
  const manifestPath = join(runDir, 'manifest.json');
  const briefInput = isAbsolute(options.brief ?? '')
    ? options.brief
    : resolve(root, options.brief ?? DEFAULT_BRIEF);
  const briefSnapshot = join(runDir, '00-brief.md');
  const definitions = createStageDefinitions();

  await mkdir(runDir, {recursive: true});

  let manifest;
  if (resumePath) {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!(await fileHasContent(briefSnapshot))) {
      throw new Error(`Resume directory is missing 00-brief.md: ${runDir}`);
    }
  } else {
    if (!(await fileHasContent(briefInput))) {
      throw new Error(`Debate brief is missing or empty: ${briefInput}`);
    }
    await copyFile(briefInput, briefSnapshot);
    const now = new Date().toISOString();
    manifest = {
      version: 1,
      status: 'running',
      brief: '00-brief.md',
      createdAt: now,
      updatedAt: now,
      stages: definitions.map((stage) => ({
        id: stage.id,
        provider: stage.provider,
        output: stage.output,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        error: null,
        command: null,
        exitCode: null,
      })),
    };
    await writeJsonAtomic(manifestPath, manifest);
  }

  const fixture = fileURLToPath(new URL('./fixtures/fake-ai-cli.mjs', import.meta.url));
  const commands = options.dryRun
    ? {
        claude: {command: process.execPath, prefixArgs: [fixture]},
        codex: {command: process.execPath, prefixArgs: [fixture]},
      }
    : (options.commands ?? await resolveCommands({env}));
  const providerEnv = options.dryRun ? {...env, FAKE_MODE: 'success'} : env;
  let executedStages = 0;

  for (const definition of definitions) {
    const state = manifest.stages.find((stage) => stage.id === definition.id);
    const outputPath = join(runDir, definition.output);

    if (state.status === 'complete' && await fileHasContent(outputPath)) {
      onProgress(`Skip ${definition.id}: already complete`);
      await appendLog(runDir, `SKIP ${definition.id} already complete`);
      continue;
    }

    state.status = 'running';
    state.startedAt = new Date().toISOString();
    state.completedAt = null;
    state.error = null;
    state.exitCode = null;
    manifest.status = 'running';
    manifest.updatedAt = state.startedAt;
    await writeJsonAtomic(manifestPath, manifest);
    await appendLog(runDir, `START ${definition.id} provider=${definition.provider}`);
    onProgress(`Run ${definition.id} with ${definition.provider}`);

    try {
      const invocation = buildInvocation(definition.provider, {root, commands});
      state.command = invocation.command;
      await writeJsonAtomic(manifestPath, manifest);
      const result = await runProcess({
        ...invocation,
        input: stagePrompt(definition, runDir),
        cwd: root,
        timeoutMs,
        env: providerEnv,
      });
      const temporary = `${outputPath}.tmp`;
      await writeFile(temporary, result.stdout.trimEnd() + '\n', 'utf8');
      await rename(temporary, outputPath);
      executedStages += 1;
      state.status = 'complete';
      state.exitCode = result.exitCode;
      state.completedAt = new Date().toISOString();
      manifest.updatedAt = state.completedAt;
      await writeJsonAtomic(manifestPath, manifest);
      await appendLog(runDir, `COMPLETE ${definition.id}`);
      onProgress(`Complete ${definition.id}`);
    } catch (cause) {
      const diagnostic = redactDiagnostics(cause.message);
      state.status = 'failed';
      state.error = diagnostic;
      state.exitCode = Number.isInteger(cause.exitCode) ? cause.exitCode : null;
      state.completedAt = new Date().toISOString();
      manifest.status = 'failed';
      manifest.updatedAt = state.completedAt;
      await writeJsonAtomic(manifestPath, manifest);
      await appendLog(runDir, `FAILED ${definition.id}: ${diagnostic}`);
      onProgress(`Failed ${definition.id}: ${diagnostic}`);
      const error = new Error(`Debate stopped at ${definition.id}: ${diagnostic}`, {cause});
      error.runDir = runDir;
      throw error;
    }
  }

  manifest.status = 'complete';
  manifest.updatedAt = new Date().toISOString();
  await writeJsonAtomic(manifestPath, manifest);
  await appendLog(runDir, 'DEBATE COMPLETE');

  return {
    runDir,
    finalPath: join(runDir, '06-final-verdict.md'),
    executedStages,
  };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await runDebate({
      ...options,
      root: process.env.AI_DEBATE_ROOT ?? process.cwd(),
      onProgress: (message) => process.stderr.write(`[ai-debate] ${message}\n`),
    });
    process.stdout.write(`${result.finalPath}\n`);
  } catch (error) {
    process.stderr.write(`[ai-debate] ${error.message}\n`);
    if (error.runDir) process.stderr.write(`[ai-debate] Resume directory: ${error.runDir}\n`);
    process.exitCode = 1;
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main();
}
