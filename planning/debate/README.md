# Automated Claude-Codex Debate

Run a six-call structured debate using the locally authenticated Claude Code and Codex subscriptions. No API keys are required.

## Validate Without Credits

```bash
./scripts/run-ai-debate.sh --dry-run
```

Dry run uses the deterministic fixture provider for all six stages. It never resolves or launches either real model CLI.

## Run the Debate

```bash
./scripts/run-ai-debate.sh
```

The terminal reports each stage and prints the final verdict path. A normal run makes exactly three Claude calls and three Codex calls. It performs no automatic retries.

Outputs are written to:

```text
planning/debate/runs/YYYY-MM-DD-HHMMSS/
```

## Resume an Interrupted Run

When a provider fails or its allowance is exhausted, the terminal prints the resume directory. Continue after the provider is available again:

```bash
./scripts/run-ai-debate.sh --resume planning/debate/runs/YYYY-MM-DD-HHMMSS
```

Completed non-empty stages are skipped. The failed stage and all later stages run once.

## Options

```text
--brief PATH       Use another Markdown debate brief.
--resume RUN_DIR   Continue an interrupted run.
--timeout SECONDS  Change the per-provider timeout from the 720-second default.
--dry-run          Use fake providers and spend no model credits.
```

## Safety

- Claude runs with only `Read`, `Glob`, and `Grep` tools, no session persistence, and no permission bypass.
- Codex runs ephemerally with a `read-only` sandbox and no sandbox bypass.
- The orchestrator owns all transcript and manifest writes.
- Every run is bounded to six calls.
- Errors and completed stages remain in the run directory.
- The manifest records command paths and status but never credentials or environment variables.

The Homebrew Codex shim on this machine is missing its vendor binary. Command discovery tests candidates with `--version` and automatically falls back to `/Applications/ChatGPT.app/Contents/Resources/codex`.
