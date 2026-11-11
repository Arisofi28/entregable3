#!/usr/bin/env bash
# PostToolUse (Edit|Write): formatea con Prettier el archivo recién editado.
# Usa el Prettier instalado en backend/ o frontend/ según dónde esté el archivo.
set -u
input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$file" ] && exit 0

case "$file" in
  *.ts|*.tsx|*.css|*.json) ;;
  *) exit 0 ;;
esac
case "$file" in
  *package-lock.json|*/.claude/*) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$file" in
  "$root"/backend/*) bin="$root/backend/node_modules/.bin/prettier" ;;
  "$root"/frontend/*) bin="$root/frontend/node_modules/.bin/prettier" ;;
  *) exit 0 ;;
esac

[ -x "$bin" ] && "$bin" --write --log-level warn "$file" >&2
exit 0
