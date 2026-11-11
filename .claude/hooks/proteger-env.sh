#!/usr/bin/env bash
# PreToolUse (Read|Edit|Write|Bash): bloquea cualquier acceso a archivos .env.
# Se permite .env.example (no contiene secretos) y código como process.env.PORT.
set -u
input="$(cat)"
target="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.command // empty')"

# Quitar las menciones permitidas antes de buscar .env
limpio="$(printf '%s' "$target" | sed -E 's/\.env\.example//g')"

# Solo cuenta como archivo si .env aparece al inicio, tras / , espacio, comilla o =
# (así "process.env.X" no se bloquea, pero "cat backend/.env" o ".env.local" sí).
if printf '%s' "$limpio" | grep -Eq '(^|[[:space:]/"'"'"'=<>])\.env(\.[A-Za-z0-9_-]+)?([[:space:]"'"'"';|&)]|$)'; then
  echo "Bloqueado por el harness: no se lee ni se modifica .env (regla de AGENTS.md). Usa .env.example." >&2
  exit 2
fi
exit 0
