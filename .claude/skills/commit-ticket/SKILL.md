---
name: commit-ticket
description: Ejecuta los tests y hace un commit que nombra su ticket (feat(E2): T-03 ...). Úsala al terminar cada ticket.
argument-hint: "<id-ticket> <descripción corta>"
disable-model-invocation: true
---

# /commit-ticket

Commit para el ticket: $ARGUMENTS

1. Verifica que existe una spec en `docs/specs/` que liste el ticket en su tabla ticket → archivos.
   Si no existe, detente.
2. Ejecuta `cd backend && npm test` (y `cd frontend && npm run build` si hay cambios en `frontend/`).
   Si algo falla, muestra el error y **no** hagas commit.
3. Revisa `git status`: nunca agregues `.env`, `dist/` ni `node_modules/`. Agrega solo los archivos
   de la tabla ticket → archivos y sus tests.
4. Mensaje: `<tipo>(<épica>): <ticket> <descripción>` — tipos: `feat`, `fix`, `test`, `docs`,
   `chore`. Ejemplo: `feat(E2): T-06 endpoint de progreso semanal`. Deuda: `fix(deuda): D-01 ...`.
5. Muestra el hash del commit y los archivos incluidos.
