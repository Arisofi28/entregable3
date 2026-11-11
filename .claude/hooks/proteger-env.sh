#!/usr/bin/env bash
# PreToolUse (Read|Edit|Write|Bash): bloquea cualquier acceso a archivos .env.
# Se permite .env.example (no contiene secretos).
set -u
input="$(cat)"
target="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.command // empty')"

# Quitar las menciones permitidas antes de buscar .env
limpio="$(printf '%s' "$target" | sed -E 's/\.env\.example//g')"

if printf '%s' "$limpio" | grep -Eq '(^|[^A-Za-z0-9_])\.env([^A-Za-z0-9_]|$)|\.env\.[A-Za-z]+'; then
  echo "Bloqueado por el harness: no se lee ni se modifica .env (regla de AGENTS.md). Usa .env.example." >&2
  exit 2
fi
exit 0
