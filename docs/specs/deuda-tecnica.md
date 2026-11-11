# Spec — Deuda técnica pagada en E2

**Cubre:** D-01 (P-01) y D-02 (P-02) del backlog · Reglas RN-14 y RN-12 del PRD.

## D-01 · Partidas huérfanas al eliminar un videojuego

- **RD-01** Al eliminar un videojuego DEBEN eliminarse todas sus partidas (además de sus metas, R-21).
- **RD-02** NO DEBE eliminar partidas ni metas de otros videojuegos.
- **RD-03** Si el juego no existe (404) o el id es inválido (400), NO DEBE borrar nada.

## D-02 · Editar una partida

Contrato: `PUT /api/partidas/:id` con `{ fecha?, duracionMinutos?, porcentajeAvance?, notas? }` → 200 partida.

- **RD-04** DEBE aplicar las mismas validaciones que al crear (duración entera ≥ 1, avance 0–100, notas ≤ 500, fecha válida); errores → 400.
- **RD-05** NO DEBE aceptar `videojuego` ni campos desconocidos (400); cuerpo vacío → 400.
- **RD-06** Id inválido → 400; partida inexistente → 404.
- **RD-07** Frontend: `partidasApi.actualizarPartida(id, datos)`; en el detalle cada partida tiene «Edit» que abre `SessionQuickForm` precargado; al guardar se reconsulta resumen y progreso (F-07).

## Tabla criterio → verificación

| Criterio | Reglas | Verificación |
|---|---|---|
| CA-D01 | RD-01, RD-02 | test `politica-borrado.test.ts` (borra partidas y metas del juego A, conserva las del B) |
| CA-D01 (errores) | RD-03 | test: id inválido → 400 sin borrar |
| CA-D02.1 | RD-04 | test `partidas-editar.test.ts` (200 y 400 por avance 101 / duración 0) |
| CA-D02.2 | RD-05 | test (cambiar `videojuego` → 400) |
| RD-06 | RD-06 | test (404 / 400) |
| CA-D02.3 / CA-08.3 | RD-07 | prueba manual en el detalle |

## Tabla ticket → archivos

| Ticket | Archivos |
|---|---|
| D-01 | `backend/src/services/videojuegos.service.ts`, `backend/test/politica-borrado.test.ts` |
| D-02 | `backend/src/services/partidas.service.ts`, `backend/src/controllers/partidas.controller.ts`, `backend/src/routes/partidas.routes.ts`, `backend/test/partidas-editar.test.ts`, `frontend/src/services/partidasApi.ts`, `frontend/src/pages/CheckpointPage.tsx`, `frontend/src/components/SessionQuickForm.tsx` |
