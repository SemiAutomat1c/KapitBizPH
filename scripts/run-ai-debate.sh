#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

: "${AI_DEBATE_ROOT:=$PROJECT_ROOT}"
export AI_DEBATE_ROOT

exec node "$SCRIPT_DIR/ai-debate.mjs" "$@"
