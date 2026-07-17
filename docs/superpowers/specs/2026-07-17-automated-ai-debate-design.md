# Automated Claude-Codex Debate Design

Date: 2026-07-17

## Purpose

Provide one local command that runs a bounded, evidence-focused debate between Claude Code and Codex without requiring Ryan to copy responses between applications. The debate must use the existing subscription logins, preserve every round as Markdown, tolerate a quota or process failure, and never let either model modify project files.

## User Command

```bash
./scripts/run-ai-debate.sh
```

Optional arguments will select a different brief, resume an interrupted run, or perform a no-credit dry run.

## Inputs

- Default debate brief: `planning/debate/brief.md`
- Project context files named in that brief, including the resilience research report.
- Existing Claude Code and Codex authentication on the local machine.

The brief owns the topic, candidate concepts, evaluation criteria, and mandatory evidence rules. The orchestrator owns turn order, safety, persistence, and failure handling.

## Debate Protocol

The default protocol is fixed at six model calls:

1. Claude produces an independent opening position.
2. Codex produces an independent opening position without reading Claude's position.
3. Claude reads Codex's position and writes a rebuttal.
4. Codex reads Claude's position and writes a rebuttal.
5. Claude reads all four rounds and writes a proposed synthesis.
6. Codex audits the synthesis and writes the final verdict, including disagreements that remain unresolved.

The two opening positions may run concurrently because their independence is intentional. The two rebuttals may also run concurrently after both openings complete. Synthesis and final audit run sequentially.

Every prompt requires the agent to distinguish verified facts, reasonable inferences, and unsupported assumptions. Agreement is not rewarded; concessions must name the evidence that changed the agent's position.

## Output Layout

Each invocation creates a timestamped run directory:

```text
planning/debate/runs/YYYY-MM-DD-HHMMSS/
├── 00-brief.md
├── 01-claude-position.md
├── 02-codex-position.md
├── 03-claude-rebuttal.md
├── 04-codex-rebuttal.md
├── 05-claude-synthesis.md
├── 06-final-verdict.md
├── manifest.json
└── run.log
```

`manifest.json` records stage status, timestamps, command identity, exit status, and output paths. It must never store credentials or full environment variables.

## Architecture

### Shell entry point

`scripts/run-ai-debate.sh` resolves the project root and launches the Node orchestrator. It contains no debate logic.

### Node orchestrator

`scripts/ai-debate.mjs` will:

- Parse `--brief`, `--resume`, `--timeout`, and `--dry-run`.
- Resolve Claude from `PATH`.
- Resolve Codex from `PATH`, then fall back to `/Applications/ChatGPT.app/Contents/Resources/codex` when the Homebrew shim is broken.
- Validate the brief and required commands before spending credits.
- Create the run directory and immutable brief snapshot.
- Spawn each model without a shell to avoid command injection.
- Capture model stdout directly into the assigned Markdown file.
- Capture sanitized progress and errors in `run.log`.
- Enforce a per-call timeout and terminate a hung child process.
- Update the manifest after every stage.
- Resume by skipping only stages whose output is non-empty and marked complete.
- Print the final verdict path when successful.

### Claude invocation

Claude runs non-interactively with `claude --print`, medium effort, no session persistence, and read-only tools (`Read`, `Glob`, and `Grep`). The prompt is supplied through standard input. The orchestrator will not use permission bypass flags.

### Codex invocation

Codex runs through `codex exec` with the project directory, `read-only` sandboxing, `--skip-git-repo-check`, and an ephemeral session. The prompt is supplied through standard input. The orchestrator will not use approval or sandbox bypass flags.

## Safety and Credit Controls

- Exactly six calls per default run; no agent may request another turn.
- Default timeout: 12 minutes per call, configurable downward or upward.
- No automatic retry after a model call fails, preventing accidental duplicate charges.
- Interrupted runs retain completed outputs and can be resumed explicitly.
- No API keys are required or read by the script.
- Models receive read-only project access and cannot edit the application or research.
- Prompts prohibit web research during the debate unless the brief explicitly permits it; this keeps the debate focused on the shared evidence base.
- The terminal prints each stage before execution, making credit-consuming work visible.

Subscription quota enforcement remains controlled by Claude and Codex. The orchestrator cannot know the exact remaining allowance. If a provider rejects a call because the quota is exhausted, the run stops cleanly and can resume after the allowance resets.

## Failure Handling

- Missing brief or command: fail before creating a chargeable model call.
- Broken Homebrew Codex shim: use the verified app-bundled binary.
- Authentication failure: mark the stage failed, preserve prior rounds, and print the provider error.
- Empty model output: treat the stage as failed and do not continue.
- Timeout or interruption: terminate the active child, mark the stage interrupted, and preserve the run directory.
- Resume: verify the manifest and brief snapshot, then continue from the first incomplete stage.

## Dry Run

`./scripts/run-ai-debate.sh --dry-run` creates a temporary run using fake model executables. It validates stage order, prompt references, output naming, manifest updates, and final completion without consuming Claude or Codex credits.

## Testing

Use Node's built-in test runner with fake Claude and Codex executables. Tests will cover:

- CLI resolution and app-binary fallback.
- Six-stage ordering and dependency boundaries.
- Independent opening prompts do not expose the opponent's output.
- Read-only flags are present for both providers.
- Successful output and manifest creation.
- Empty output failure.
- Non-zero provider exit.
- Timeout termination.
- Resume skips completed stages and does not duplicate calls.
- Dry run consumes no real provider command.

No automated test will invoke a real model. After tests pass, one explicit real run is the end-to-end verification and will consume subscription allowance.

## Initial Debate Brief

The initial brief will compare:

- KapitBiz Relay / closed rescue dispatch.
- Resilience Receipt / event-triggered loss evidence.
- DiskarteWatt / outage and spoilage economics.
- Any alternative that is demonstrably stronger.

Required evaluation dimensions are Tagum-specific demand, novelty, one-day build feasibility, honest three-to-five-minute demo quality, unavailable dependencies, continuity impact, covariant risk, institutional acceptance, and kill criteria.

## Non-Goals

- Sending messages into this exact Codex desktop task.
- Allowing an unbounded or self-extending debate.
- Making agents edit shared source files.
- Automatically purchasing API credits or bypassing provider quotas.
- Treating model agreement as customer validation.
