# Spec frontend — Progreso semanal y meta en el detalle del juego (E2)

**Cubre:** HU-01 a HU-06, HU-08 y CA-09.3 · Tickets T-08 a T-12 · Diseño: [`DESIGN.md`](../../DESIGN.md).

> **Actualización (2026-11-11, tras la auditoría):** la verificación de los criterios de interfaz pasó de
> «prueba manual» a una prueba automatizada de punta a punta (`frontend/e2e/flujo-e2.mjs`, `npm run test:e2e`),
> que el agente creó sin que estuviera declarada en esta spec. Se corrigieron las tablas §3 y §4 para que
> coincidan con lo implementado y con `docs/AUDITORIA.md`. Ver bitácora, momento 8.

## 1. Contrato

### `src/services/metasApi.ts`
Tipos `Hito`, `HitoProgreso`, `Meta`, `MetaEntrada`, `ProgresoSemanal` (forma de la spec backend §2) y funciones:
`obtenerProgresoSemanal(videojuegoId)`, `listarMetasDeVideojuego(videojuegoId)`, `obtenerMeta(id)`,
`crearMeta(datos)`, `actualizarMeta(id, datos)`, `desactivarMeta(id)`. Todas usan `apiRequest` de `api.ts`.

### Componentes
- `components/WeeklyProgress.tsx` — recibe `progreso`, estado de carga/error y callbacks
  `onRetry`, `onCreateGoal`, `onEditGoal`, `onDeactivate`. Muestra:
  - Barra de horas «3.5 / 5 hrs · 70 %» (`role="progressbar"`).
  - Días: «3 / 4 days» + 7 puntos lunes–domingo con letra e indicación accesible.
  - Racha actual (🔥 + «4 days») y mejor racha.
  - Lista de hitos ordenada con estado (icono + texto «Reached» / «Not yet»).
  - Distintivo «Weekly goal met» cuando `metaCumplida`.
  - Sin meta: horas, días y rachas + panel que invita a «SET A GOAL».
- `components/GoalForm.tsx` — crear/editar: horas por semana, días por semana, hasta 5 hitos
  (descripción + %), botones «SAVE GOAL» / «Cancel». Muestra el mensaje de error de la API (incl. 409).
- Confirmación de desactivar en línea dentro de `WeeklyProgress`.
- `components/SessionQuickForm.tsx` — formulario compacto de partida (fecha, minutos, avance, notas)
  usado en el detalle para registrar (T-12) y editar (D-02).
- `pages/CheckpointPage.tsx` — integra lo anterior; tras crear/editar/eliminar una partida o
  guardar/desactivar la meta vuelve a pedir resumen, partidas y progreso.

## 2. Reglas

- **F-01** DEBE mostrar, en el detalle del videojuego, barra de horas frente a la meta, días jugados frente a días objetivo, racha actual, mejor racha y lista de hitos con estado.
- **F-02** La barra NO DEBE desbordarse: el ancho visual se limita al 100 %, pero el texto muestra el porcentaje real (140 %) (RN-11).
- **F-03** DEBE mostrar estado de carga (`role="status"`), de error con «TRY AGAIN» (`role="alert"`) y vacío; sin meta activa invita a crear una (RN-19).
- **F-04** El formulario DEBE validar en el cliente: horas > 0 y ≤ 100, días entero 1–7, hitos ≤ 5 con descripción (≥ 2 caracteres) y % 1–100; NO DEBE enviar si hay errores.
- **F-05** DEBE mostrar el mensaje del servidor cuando la API responde 400/404/409.
- **F-06** Desactivar DEBE pedir confirmación en línea; NO DEBE usar `window.confirm`.
- **F-07** Tras registrar, editar o eliminar una partida desde el detalle DEBE volver a consultar el progreso (y el resumen) sin recargar la página.
- **F-08** Todas las llamadas HTTP de metas/progreso DEBEN pasar por `metasApi.ts`; los componentes NO DEBEN usar `fetch`.
- **F-09** Los estilos nuevos DEBEN usar solo variables de `index.css` definidas desde DESIGN.md; NO DEBEN usar librerías de UI nuevas.
- **F-10** Textos en inglés con el tono de DESIGN.md; estados no comunicados solo por color.
- **F-11** Si el juego está completado o abandonado, NO DEBE ofrecer «SET A GOAL»; explica por qué (RN-13).
- **F-12** La fecha y la hora de una partida DEBEN elegirse en campos separados: fecha, y hora en formato 12 h (hora, minutos, AM/PM). NO DEBEN cortarse en el formulario rápido del detalle ni en la página de sesiones, en escritorio ni a 390 px. El valor enviado a la API NO DEBE cambiar de formato.

## 3. Tabla criterio → verificación

| Criterio | Reglas | Verificación |
|---|---|---|
| CA-01.1 | F-01 | E2E `flujo-e2.mjs`: crear meta y verla en el detalle |
| CA-01.2 | F-04 | E2E `flujo-e2.mjs`: 0 h y 8 días → error junto al campo, sin petición |
| CA-01.3 | F-05 | E2E `flujo-e2.mjs`: meta creada «en otra pestaña» → mensaje 409 del servidor visible |
| CA-01.4 | F-11 | E2E `flujo-e2.mjs`: juego completado sin «SET A GOAL» y con explicación |
| CA-02.1 / CA-02.2 | F-04 | E2E `flujo-e2.mjs`: «ADD MILESTONE» se deshabilita en 5 |
| CA-02.4 | F-01 | Revisión visual: hitos ordenados |
| CA-03.4 | F-02 | E2E `flujo-e2.mjs`: con 125 % la barra queda al 100 % y el texto muestra 125 % |
| CA-03.8 | F-03 | E2E `flujo-e2.mjs`: juego sin meta invita a crear una |
| CA-05.1 | F-01 | E2E `flujo-e2.mjs`: hito ✓ «Reached» tras registrar partida |
| CA-06.1 | F-07 | E2E `flujo-e2.mjs`: editar meta → valores recalculados |
| CA-06.2 | F-06 | E2E `flujo-e2.mjs`: «DEACTIVATE» → confirmación en línea → sin meta |
| CA-08.1 | F-07 | E2E `flujo-e2.mjs`: registrar partida en el detalle → cambian horas y racha |
| CA-08.2 | F-07 | E2E `flujo-e2.mjs`: eliminar partida → cambia el progreso |
| CA-08.3 | F-07 | E2E `flujo-e2.mjs` (D-02): editar partida → cambia el progreso |
| CA-09.3 | F-03 | Prueba manual con la API apagada → error + «TRY AGAIN» (no automatizada) |
| F-12 | — | E2E `flujo-e2.mjs` registra con los campos separados; comprobación con la API: 9:30 PM → 21:30 y 12:05 AM → 00:05 en Ecuador; capturas a 1300 px y 390 px |
| F-08 | — | `grep -rn "fetch(" frontend/src/components frontend/src/pages` vacío |
| F-09 | — | Revisión de diseño contra DESIGN.md (tabla en AUDITORIA.md); `grep` de `#` hex en CSS nuevos vacío |
| Compila | — | `npm run build` y `npm run lint` |

## 4. Tabla ticket → archivos

| Ticket | Archivos |
|---|---|
| T-08 | `frontend/src/index.css` |
| T-09 | `frontend/src/services/metasApi.ts` |
| T-10 | `frontend/src/components/WeeklyProgress.tsx`, `frontend/src/components/WeeklyProgress.css`, `frontend/src/pages/CheckpointPage.tsx` |
| T-11 | `frontend/src/components/GoalForm.tsx`, `frontend/src/components/GoalForm.css`, `frontend/src/components/WeeklyProgress.tsx`, `frontend/src/pages/CheckpointPage.tsx` |
| T-10 a T-12, D-02 (verificación) | `frontend/e2e/flujo-e2.mjs`, `frontend/package.json` (script `test:e2e`) |
| Fix fecha y hora (F-12) | `frontend/src/components/DateTimeFields.tsx`, `frontend/src/components/DateTimeFields.css`, `frontend/src/components/SessionQuickForm.tsx`, `frontend/src/components/SessionQuickForm.css`, `frontend/src/pages/SessionsPage.tsx`, `frontend/e2e/flujo-e2.mjs` |
| T-12 | `frontend/src/components/SessionQuickForm.tsx`, `frontend/src/components/SessionQuickForm.css`, `frontend/src/pages/CheckpointPage.tsx`, `frontend/src/pages/CheckpointPage.css` |

## 5. Fuera de alcance
Gráficos históricos, notificaciones, cambio de idioma, rediseño de páginas existentes.
