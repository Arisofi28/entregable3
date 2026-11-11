# Auditoría de E2 · Metas y rachas

Fecha: 2026-11-11 · Rama `feature/e2-metas-rachas`. Una fila por criterio de cada spec.

**Evidencia general**
- `cd backend && npm test` → **81 tests** (`test/*.test.ts`) + 1 heredado (`test/*.test.js`), **0 fallos**:
  dominio 31 · modelo 15 · API de metas y progreso 19 · política de borrado 7 · editar partidas 5 · errorHandler 4.
- `cd frontend && npm run build` y `npm run lint` sin errores.
- `cd frontend && npm run test:e2e` → **14/14** pasos en Chrome headless contra API local ([`frontend/e2e/flujo-e2.mjs`](../frontend/e2e/flujo-e2.mjs)).
- Pruebas con curl: [`docs/pruebas-api.md`](pruebas-api.md). Revisión de diseño: [`docs/revision-diseno.md`](revision-diseno.md).

Leyenda: ✔ verificado · ⏳ pendiente de verificación manual por la estudiante (requiere despliegue o una acción que no se automatizó).

## Spec backend — [`backend-metas-progreso.md`](specs/backend-metas-progreso.md)

| Criterio | Reglas | Cómo se verificó | Resultado | Evidencia |
|---|---|---|---|---|
| CA-01.1 | R-16 | Test API + curl | ✔ | `metas.api.test.ts` «CA-01.1 crea una meta activa…»; `pruebas-api.md` #2 (201) |
| CA-01.2 | Modelo | Test modelo + test API + curl | ✔ | `meta.model.test.ts` (0, −1, 100.5, 101 h; 0, 8, 2.5 d); `metas.api.test.ts` «CA-01.2»; curl #6 (400) |
| CA-01.3 | R-17, R-23 | Test API (incl. concurrencia) + test errorHandler + curl | ✔ | `metas.api.test.ts` «dos peticiones simultáneas» → [201, 409]; `errorHandler.test.ts`; curl #4 (409) |
| CA-01.4 | R-18 | Test API + curl | ✔ | `metas.api.test.ts` «CA-01.4»; curl #5 (409) |
| CA-01.5 | R-16 | Test API | ✔ | `metas.api.test.ts` «CA-01.5» (404 y 400) |
| CA-02.1 | Modelo | Test modelo | ✔ | `meta.model.test.ts` «acepta 5 hitos» |
| CA-02.2 | Modelo | Test modelo + test API | ✔ | `meta.model.test.ts` «rechaza un sexto hito»; `metas.api.test.ts` |
| CA-02.3 | Modelo | Test modelo + test API | ✔ | porcentaje 0/101 y descripción vacía |
| CA-02.4 | R-11 | Test dominio + curl | ✔ | `progreso.dominio.test.ts` «ordenados»; curl #3 (25, 50, 100) |
| CA-03.1 | R-01, R-02 | Test dominio | ✔ | 4 tests: miércoles, lunes 00:00 / domingo 23:59, 23:30 EC = 04:30 UTC, cambio de año |
| CA-03.2 | R-05 | Test dominio + curl | ✔ | 90 + 120 → 3.5; 50 min → 0.8; curl #3 (225 min → 3.8) |
| CA-03.3 | R-06 | Test dominio | ✔ | 3.5 / 5 → 70 |
| CA-03.4 | R-06 | Test dominio | ✔ | 7 / 5 → 140 |
| CA-03.5 | R-07 | Test dominio + curl | ✔ | 4 partidas → 2 días; curl #3 (dos partidas el 10-nov → 3 días) |
| CA-03.6 | R-01, R-03 | Test dominio | ✔ | domingo 23:30 cuenta para esa semana y no para la siguiente |
| CA-03.7 | R-02, R-04 | Test dominio | ✔ | semana pasada, más tarde hoy y futuro excluidos; futura no alarga racha |
| CA-03.8 | R-13 | Test dominio + test API + curl | ✔ | `meta: null`, `porcentajeHoras: null`; curl #1 |
| CA-03.9 | R-13 | Test dominio + test API + curl | ✔ | todo en 0; curl #1 |
| CA-03.10 | R-15 | Test dominio + test API | ✔ | 210 min: meta 5 → 70 %, meta 7 → 50 %; API: 40 % → 100 % tras PUT |
| CA-03.11 | R-12 | Test dominio | ✔ | 300 min + 4 d → true; 299 min → false; días insuficientes → false |
| CA-04.1 | R-08 | Test dominio | ✔ | hoy, ayer, anteayer → 3 |
| CA-04.2 | R-08 | Test dominio | ✔ | ayer y anteayer, no hoy → 2 (sigue viva) |
| CA-04.3 | R-08 | Test dominio | ✔ | última anteayer → 0, mejor 2 |
| CA-04.4 | R-09 | Test dominio + curl | ✔ | 9 pasada y 4 actual; curl #3 (racha 3, mejor 4, rota el 8-nov) |
| CA-04.5 | R-08 | Test dominio | ✔ | varias el mismo día → 1 |
| CA-05.1 | R-10 | Test dominio + test API + curl | ✔ | avance 50 → 25 ✓ 50 ✓ 100 ✗; curl #3 (avance 55) |
| CA-05.2 | R-10 | Test dominio + test API (D-02) | ✔ | avance baja al eliminar/editar → no alcanzado; `partidas-editar.test.ts` |
| CA-05.3 | R-10, R-13 | Test dominio | ✔ | sin partidas → ninguno |
| CA-06.1 | R-15, R-19 | Test API | ✔ | `metas.api.test.ts` «CA-06.1» (200) |
| CA-06.3 | R-19, R-20 | Test API | ✔ | PUT y PATCH sobre meta inactiva → 409 |
| CA-06.4 | — | Test API + curl | ✔ | activa primero, luego historial; curl #9 |
| CA-06.5 | R-19 | Test API | ✔ | PUT con `videojuego` o `activa` → 400 |
| CA-07.1 | R-21 | Test API | ✔ | `politica-borrado.test.ts`: borra metas del juego A, conserva las de B |
| CA-07.2 | R-22 | Test API | ✔ | completado / abandonado → `activa: false`; pausado la mantiene |
| CA-09.1 | R-23 | Test API + curl | ✔ | id inválido → 400; curl #7 |
| CA-09.2 | R-23 | Test API + curl | ✔ | inexistente → 404; curl #8 |
| R-14 | — | Revisión de código | ✔ | `src/dominio/progreso.ts` no importa Mongoose ni Express; recibe `ahora` |
| R-24 | — | Test API + test heredado + curl | ✔ | forma del resumen sin cambios; `partidas-summary.test.js` pasa; curl #10 |

## Spec frontend — [`frontend-progreso-metas.md`](specs/frontend-progreso-metas.md)

| Criterio | Reglas | Cómo se verificó | Resultado | Evidencia |
|---|---|---|---|---|
| CA-01.1 | F-01 | E2E en navegador | ✔ | `flujo-e2.mjs` «crear meta 2 h / 2 días con 1 hito» |
| CA-01.2 | F-04 | E2E en navegador | ✔ | 0 h y 8 días → errores junto al campo, sin petición |
| CA-01.3 | F-05 | E2E en navegador | ✔ | meta creada «en otra pestaña» → alerta con el mensaje 409 del servidor |
| CA-01.4 | F-11 | E2E en navegador | ✔ | juego completado: sin «SET A GOAL», con explicación |
| CA-02.1 / CA-02.2 | F-04 | E2E en navegador | ✔ | «ADD MILESTONE» deshabilitado en 5 |
| CA-02.4 | F-01 | Revisión visual | ✔ | captura del detalle: 25 %, 50 %, 100 % ordenados |
| CA-03.4 | F-02 | E2E en navegador | ✔ | 125 %: barra `width: 100%`, `aria-valuenow=100`, texto «125%» |
| CA-03.8 | F-03 | E2E + revisión visual | ✔ | «No active goal yet» + SET A GOAL |
| CA-05.1 | F-01 | E2E en navegador | ✔ | hito «Reached» tras registrar partida |
| CA-06.1 | F-07 | E2E en navegador | ✔ | editar meta a 4 h → «/ 4 hrs» |
| CA-06.2 | F-06 | E2E en navegador | ✔ | DEACTIVATE → confirmación en línea → sin meta |
| CA-08.1 | F-07 | E2E en navegador | ✔ | LOG HERE → 1 / 2 hrs, 50 %, racha 1 |
| CA-08.2 | F-07 | E2E en navegador | ✔ | eliminar → 0 hrs, hito «Not yet» |
| CA-08.3 | F-07 | E2E en navegador | ✔ | editar a 150 min → 2.5 / 2 hrs, 125 % |
| CA-09.3 | F-03 | Revisión de código | ⏳ | `WeeklyProgress` muestra «Loading your week…» (`role="status"`) y error con «TRY AGAIN» (`role="alert"`); falta probarlo con la API apagada |
| F-12 | — | E2E + prueba contra la API + capturas | ✔ | 9:30 PM → `21:30` y 12:05 AM → `00:05` (Ecuador); el formulario no se corta a 1300 px ni a 390 px |
| F-08 | — | `grep -rn "fetch(" src/components src/pages` | ✔ | sin resultados |
| F-09 | — | `grep` de colores fijos + revisión de diseño | ✔ | 0 colores fijos; `44px` → `--tap-target` (corregido) |
| F-10 | — | Revisión de diseño | ✔ | `revision-diseno.md` #5, #8 |
| Compila | — | `npm run build`, `npm run lint` | ✔ | sin errores |

## Spec deuda técnica — [`deuda-tecnica.md`](specs/deuda-tecnica.md)

| Criterio | Reglas | Cómo se verificó | Resultado | Evidencia |
|---|---|---|---|---|
| CA-D01 | RD-01, RD-02 | Test API (rojo → verde) | ✔ | `politica-borrado.test.ts` «D-01»; commit `fix(deuda): D-01` |
| CA-D01 (errores) | RD-03 | Test API | ✔ | id inválido / inexistente no borran partidas |
| CA-D02.1 | RD-04 | Test API (rojo → verde) | ✔ | `partidas-editar.test.ts`: 200; 400 con avance 101, "20", duración 0 o 2.5, fecha inválida, notas > 500 |
| CA-D02.2 | RD-05 | Test API | ✔ | cambiar `videojuego`, campo extra o cuerpo vacío → 400 |
| RD-06 | RD-06 | Test API | ✔ | 400 / 404 |
| CA-D02.3 | RD-07 | E2E en navegador | ✔ | = CA-08.3 |

## Despliegue

| Comprobación | Resultado |
|---|---|
| API en Render con E2 (`GET /api/videojuegos/:id/progreso-semanal` responde) | ⏳ pendiente: se verifica tras integrar el PR en `main` |
| Frontend en Render muestra la sección «Weekly goal» | ⏳ pendiente: igual que la anterior |
| Índice único de metas activas creado en Atlas | ⏳ Mongoose lo crea al arrancar (`autoIndex`); verificar en Atlas → `metas` → Indexes |
