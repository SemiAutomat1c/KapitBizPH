# Automated Claude-Codex Debate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one command that runs a bounded six-call Claude-Codex debate, saves every round, and resumes safely after provider or quota failure.

**Architecture:** A dependency-free Node ESM orchestrator owns argument parsing, CLI resolution, stage prompts, process timeouts, manifests, and resume behavior. A thin shell entry point locates the project root. Real agents are read-only; a deterministic fake provider supports tests and `--dry-run` without consuming credits.

**Tech Stack:** Node.js built-ins (`child_process`, `fs`, `path`, `os`, `node:test`), POSIX shell, Claude Code CLI, Codex CLI.

## Global Constraints

- Exactly six provider calls in a normal run.
- No automatic provider retries.
- Claude tools limited to `Read`, `Glob`, and `Grep`.
- Codex sandbox fixed to `read-only`.
- Default timeout is 12 minutes per call.
- Existing subscription authentication only; never read or store API keys.
- Every stage writes a separate Markdown file and updates `manifest.json`.
- The current directory is not a Git repository, so commit steps are intentionally omitted.

---

### Task 1: Core configuration and command construction

**Files:**
- Create: `scripts/ai-debate.mjs`
- Create: `scripts/tests/ai-debate.test.mjs`

**Interfaces:**
- Produces: `parseArgs(argv)`, `resolveCommands(options)`, `createStageDefinitions(context)`, and `buildInvocation(provider, context)`.
- Consumes: environment overrides `CLAUDE_BIN` and `CODEX_BIN`; otherwise resolves `claude` from `PATH` and Codex from `PATH` or the app-bundled fallback.

- [ ] **Step 1: Write failing tests for defaults, overrides, six-stage definitions, and read-only command flags**

```javascript
test('parseArgs applies bounded defaults', () => {
  assert.deepEqual(parseArgs([]), {
    brief: 'planning/debate/brief.md',
    resume: null,
    timeoutMs: 720000,
    dryRun: false,
  });
});

test('stage definitions contain six ordered outputs', () => {
  const stages = createStageDefinitions(contextFixture);
  assert.deepEqual(stages.map((stage) => stage.output), [
    '01-claude-position.md',
    '02-codex-position.md',
    '03-claude-rebuttal.md',
    '04-codex-rebuttal.md',
    '05-claude-synthesis.md',
    '06-final-verdict.md',
  ]);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: FAIL because `scripts/ai-debate.mjs` does not exist.

- [ ] **Step 3: Implement minimal parsing, resolution, stage metadata, and invocation builders**

The invocation builder must produce:

```javascript
{
  command: claudeBin,
  args: ['--print', '--effort', 'medium', '--no-session-persistence', '--permission-mode', 'dontAsk', '--allowedTools', 'Read,Glob,Grep'],
}
```

for Claude and:

```javascript
{
  command: codexBin,
  args: ['exec', '--cd', root, '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral', '-'],
}
```

for Codex.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: all Task 1 tests pass.

### Task 2: Process execution, timeout, and persisted stages

**Files:**
- Modify: `scripts/ai-debate.mjs`
- Modify: `scripts/tests/ai-debate.test.mjs`
- Create: `scripts/fixtures/fake-ai-cli.mjs`

**Interfaces:**
- Produces: `runProcess(invocation) -> Promise<{stdout, stderr, exitCode}>` and `runStage(stage, context) -> Promise<void>`.
- `runProcess` consumes `{command, args, input, cwd, timeoutMs, env}` and rejects with typed errors for non-zero exit, timeout, and empty output.

- [ ] **Step 1: Write failing tests using a temporary fake provider**

```javascript
test('runProcess returns stdout from a provider', async () => {
  const result = await runProcess({
    command: process.execPath,
    args: [fakeProvider, 'success'],
    input: 'round prompt',
    cwd: projectRoot,
    timeoutMs: 2000,
  });
  assert.match(result.stdout, /round prompt/);
});

test('runProcess terminates a provider after timeout', async () => {
  await assert.rejects(
    runProcess({
      command: process.execPath,
      args: [fakeProvider, 'hang'],
      input: '',
      cwd: projectRoot,
      timeoutMs: 50,
    }),
    /timed out/,
  );
});
```

- [ ] **Step 2: Run tests and confirm RED for missing execution behavior**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: execution tests fail because `runProcess` is not implemented.

- [ ] **Step 3: Implement the fake provider and minimal process runner**

The fake provider reads stdin and supports `success`, `empty`, `fail`, and `hang` modes. The process runner sends prompts through stdin, captures stdout/stderr, uses a timer, sends `SIGTERM` on timeout, and rejects empty trimmed output.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: process, timeout, failure, and empty-output tests pass.

### Task 3: Full debate, manifest, and resume

**Files:**
- Modify: `scripts/ai-debate.mjs`
- Modify: `scripts/tests/ai-debate.test.mjs`

**Interfaces:**
- Produces: `runDebate(options) -> Promise<{runDir, finalPath}>`.
- Produces manifest shape `{version, status, brief, createdAt, updatedAt, stages[]}` where each stage records `id`, `provider`, `output`, `status`, `startedAt`, `completedAt`, and `error`.

- [ ] **Step 1: Write failing end-to-end tests with fake commands**

```javascript
test('runDebate creates six outputs and a complete manifest', async () => {
  const result = await runDebate(fakeOptions);
  const manifest = JSON.parse(await readFile(join(result.runDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.status, 'complete');
  assert.equal(manifest.stages.filter((stage) => stage.status === 'complete').length, 6);
  assert.equal((await readFile(result.finalPath, 'utf8')).trim().length > 0, true);
});

test('resume skips completed outputs', async () => {
  const first = await runDebate(failingAfterTwoOptions);
  const resumed = await runDebate({...fakeOptions, resume: first.runDir});
  assert.equal(resumed.executedStages, 4);
});
```

- [ ] **Step 2: Run tests and confirm RED for missing orchestration**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: end-to-end tests fail because `runDebate` is not implemented.

- [ ] **Step 3: Implement immutable brief snapshot, prompts, manifest updates, stage sequencing, and resume**

Opening prompts must not mention or reference the opposing output. Rebuttal prompts reference only the brief and opponent opening. Synthesis references all four debate rounds. Final audit references the brief, four rounds, and Claude synthesis.

On failure, set the active stage and manifest to `failed`, preserve prior outputs, write the sanitized error to `run.log`, and return a non-zero CLI status. Resume resets only failed/incomplete stages and never executes a complete stage with a non-empty output.

- [ ] **Step 4: Run the full suite and confirm GREEN**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: all orchestration and resume tests pass.

### Task 4: Entry point, brief, dry run, and user documentation

**Files:**
- Create: `scripts/run-ai-debate.sh`
- Create: `planning/debate/brief.md`
- Create: `planning/debate/README.md`
- Modify: `scripts/ai-debate.mjs`
- Modify: `scripts/tests/ai-debate.test.mjs`

**Interfaces:**
- Shell command: `./scripts/run-ai-debate.sh [--brief PATH] [--resume RUN_DIR] [--timeout SECONDS] [--dry-run]`.
- Dry run selects the fixture provider for both agents and never resolves or launches a real provider command.

- [ ] **Step 1: Write failing CLI and dry-run tests**

```javascript
test('dry run never invokes configured real providers', async () => {
  const result = await runDebate({
    ...baseOptions,
    dryRun: true,
    claudeBin: '/does/not/exist/claude',
    codexBin: '/does/not/exist/codex',
  });
  assert.equal((await readFile(result.finalPath, 'utf8')).includes('DRY RUN'), true);
});
```

- [ ] **Step 2: Run tests and confirm RED for missing dry-run routing**

Run: `node --test scripts/tests/ai-debate.test.mjs`

Expected: dry-run test fails by attempting a missing real provider.

- [ ] **Step 3: Implement dry-run routing, executable wrapper, initial brief, and command documentation**

The README must document normal execution, no-credit validation, resume, timeout override, output locations, six-call cost, read-only guarantees, and the app-bundled Codex fallback.

- [ ] **Step 4: Run tests and no-credit end-to-end verification**

Run:

```bash
node --test scripts/tests/ai-debate.test.mjs
./scripts/run-ai-debate.sh --dry-run
```

Expected: tests report zero failures; dry run prints a final verdict path containing six generated Markdown rounds and a complete manifest.

- [ ] **Step 5: Audit the implementation against the approved design**

Verify the following using `rg` and the dry-run manifest:

- Six and only six stages.
- Read-only Claude/Codex flags.
- No retry loop.
- No API key reads.
- Timeout and resume options documented.
- No placeholders in scripts, brief, README, or plan.

Do not run a real debate automatically. A real run consumes both subscription allowances and remains an explicit user action.
