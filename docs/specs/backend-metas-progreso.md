# Spec backend — Meta y progreso semanal (E2)

**Cubre:** HU-01 a HU-07 y HU-09 · Tickets T-01 a T-07 · Reglas RN-01 a RN-21 del PRD.

## 1. Modelo `Meta` (colección `metas`)

| Campo | Tipo | Reglas |
|---|---|---|
| `videojuego` | ObjectId → `Videojuego` | obligatorio |
| `horasSemanales` | number | obligatorio, `> 0` y `≤ 100` (admite decimales) |
| `diasPorSemana` | number | obligatorio, entero, `1–7` |
| `activa` | boolean | por defecto `true` |
| `hitos` | `[{ _id, descripcion, porcentajeObjetivo }]` embebido | máx. 5; `descripcion` string obligatoria (2–80, `trim`); `porcentajeObjetivo` 1–100 |
| `createdAt`, `updatedAt` | Date | `timestamps: true` |

Índice único parcial `{ videojuego: 1 }` con `partialFilterExpression: { activa: true }` → como
máximo una meta activa por juego, incluso con peticiones concurrentes. Esquema con `strict: "throw"`.

**Justificación del modelado.**
- *Meta referenciada, no embebida en Videojuego:* tiene su propio ciclo de vida (se crea, se edita,
  se desactiva y se reemplaza) sin tocar la ficha del juego, y conserva un historial de metas
  anteriores que haría crecer el documento del juego sin límite.
- *Hitos embebidos:* son una lista corta (≤ 5), acotada y que solo tiene sentido dentro de su meta;
  se leen y escriben siempre junto con ella.
- *«Alcanzado» no se guarda:* se calcula con el avance actual que ya se deriva de las partidas.
  Guardarlo duplicaría el dato y quedaría desactualizado al editar o eliminar partidas (RN-12).

## 2. Contrato HTTP

| Método y ruta | Cuerpo | Éxito | Errores |
|---|---|---|---|
| `POST /api/metas` | `{ videojuego, horasSemanales, diasPorSemana, hitos? }` | 201 meta | 400 datos/campos/id inválidos · 404 juego no existe · 409 ya hay meta activa · 409 juego completado/abandonado |
| `GET /api/metas/:id` | — | 200 meta | 400 id · 404 |
| `GET /api/videojuegos/:id/metas` | — | 200 `[meta]` (activa primero, luego más recientes) | 400 id · 404 juego |
| `PUT /api/metas/:id` | `{ horasSemanales?, diasPorSemana?, hitos? }` (al menos uno) | 200 meta | 400 datos o campos no permitidos (`videojuego`, `activa`…) · 404 · 409 meta inactiva |
| `PATCH /api/metas/:id/desactivar` | — | 200 meta con `activa: false` | 400 id · 404 · 409 ya inactiva |
| `GET /api/videojuegos/:id/progreso-semanal` | — | 200 progreso | 400 id · 404 juego |

Errores siempre con `{ error: { mensaje, statusCode, requestId } }`.

### Respuesta de progreso semanal
```json
{
  "semana": { "inicio": "2026-11-09", "fin": "2026-11-15" },
  "meta": { "_id": "…", "horasSemanales": 5, "diasPorSemana": 4 },
  "horasSemana": 3.5,
  "porcentajeHoras": 70,
  "diasJugadosSemana": 3,
  "diasSemana": [{ "fecha": "2026-11-09", "jugado": true }, "… 7 elementos, lunes a domingo"],
  "rachaActual": 4,
  "mejorRacha": 9,
  "metaCumplida": false,
  "hitos": [{ "_id": "…", "descripcion": "Llegar al 25 %", "porcentajeObjetivo": 25, "alcanzado": true }]
}
```
`diasSemana` y `metaCumplida` amplían el ejemplo del enunciado (para el indicador de días y RN-15).

## 3. Reglas

**Dominio (`src/dominio/progreso.ts`, funciones puras, reciben `ahora`)**
- **R-01** DEBE convertir cada fecha a día calendario en `America/Guayaquil` (`YYYY-MM-DD`).
- **R-02** DEBE calcular la semana como lunes–domingo que contiene el día de hoy en Ecuador (RN-04).
- **R-03** DEBE asignar cada partida completa al día de su `fecha` de inicio, aunque cruce la medianoche (RN-09).
- **R-04** NO DEBE contar partidas con `fecha > ahora` en horas, días ni rachas (RN-16).
- **R-05** `horasSemana` DEBE ser `round1(Σ duracionMinutos de la semana / 60)`.
- **R-06** `porcentajeHoras` DEBE ser `round(horasSemana / horasSemanales × 100)` y NO DEBE limitarse a 100 (RN-11). Sin meta activa es `null`.
- **R-07** `diasJugadosSemana` DEBE contar días distintos; varias partidas el mismo día cuentan 1 (RN-08).
- **R-08** `rachaActual` DEBE contar días consecutivos terminando hoy si hoy hay partida, o terminando ayer si hoy no hay pero ayer sí; en otro caso 0 (RN-05, RN-07).
- **R-09** `mejorRacha` DEBE ser la secuencia de días consecutivos más larga del historial y NO DEBE ser menor que `rachaActual` (RN-18).
- **R-10** Un hito DEBE estar `alcanzado` si `avanceActual ≥ porcentajeObjetivo`, con `avanceActual = min(100, Σ porcentajeAvance)` (la misma fórmula del resumen de E1). NO DEBE guardarse (RN-06, RN-12).
- **R-11** Los hitos DEBEN devolverse ordenados por `porcentajeObjetivo` ascendente (RN-20).
- **R-12** `metaCumplida` DEBE ser `true` si `Σ minutos de la semana ≥ horasSemanales × 60` **y** `diasJugadosSemana ≥ diasPorSemana`; `null` sin meta (RN-15).
- **R-13** Sin partidas: horas, días y rachas en 0 y ningún hito alcanzado. Sin meta: `meta`, `porcentajeHoras` y `metaCumplida` en `null`, `hitos: []`, pero sí horas, días y rachas (RN-19).
- **R-14** El dominio NO DEBE importar Mongoose, Express ni leer el reloj del sistema.

**Servicio y API**
- **R-15** El progreso DEBE usar la meta activa al momento de la consulta (RN-10).
- **R-16** Crear meta DEBE validar el id (400) y la existencia del juego (404) antes de guardar.
- **R-17** NO DEBE existir más de una meta activa por juego: 409 «Este videojuego ya tiene una meta activa…» (RN-01). La clave duplicada del índice también se traduce a 409.
- **R-18** Crear meta en un juego `completado` o `abandonado` DEBE responder 409 (RN-13).
- **R-19** `PUT` NO DEBE aceptar `videojuego`, `activa` ni campos desconocidos (400) (RN-21) y NO DEBE editar una meta inactiva (409) (RN-17).
- **R-20** Desactivar DEBE poner `activa: false` y conservar la meta; desactivar una inactiva → 409 (RN-17).
- **R-21** Al eliminar un videojuego DEBEN eliminarse todas sus metas (RN-14).
- **R-22** Al cambiar el estado de un juego a `completado` o `abandonado` DEBE desactivarse su meta activa (RN-13).
- **R-23** El `errorHandler` DEBE distinguir 400 (validación, cast, JSON), 404, 409 (`AppError` 409 y error Mongo `11000`) y 500.
- **R-24** NO DEBE cambiar la respuesta de `GET /api/videojuegos/:id/resumen`.

## 4. Tabla criterio → verificación

| Criterio | Reglas | Verificación |
|---|---|---|
| CA-01.1 | R-16 | curl `POST /api/metas` → 201 · test API `metas.api.test.ts` |
| CA-01.2 | Modelo | test `meta.model.test.ts` (validateSync: 0 h, 101 h, 0 d, 8 d, 2.5 d) · curl 400 |
| CA-01.3 | R-17, R-23 | test API (409) · curl segunda meta → 409 |
| CA-01.4 | R-18 | test API (409 juego completado) |
| CA-01.5 | R-16 | test API (404) · curl |
| CA-02.1 | Modelo | test modelo (5 hitos válidos) |
| CA-02.2 | Modelo | test modelo (6 hitos → error) |
| CA-02.3 | Modelo | test modelo (porcentaje 0 / 101, sin descripción) |
| CA-02.4 | R-11 | test dominio `evaluarHitos` ordena |
| CA-03.1 | R-01, R-02 | test dominio `semanaDe` (miércoles, lunes 00:00, domingo 23:59 Ecuador) |
| CA-03.2 | R-05 | test dominio (90 + 120 min → 3.5) |
| CA-03.3 | R-06 | test dominio (3.5 / 5 → 70) |
| CA-03.4 | R-06 | test dominio (7 / 5 → 140) |
| CA-03.5 | R-07 | test dominio (3 partidas mismo día → 1) |
| CA-03.6 | R-01, R-03 | test dominio (domingo 23:30 EC = lunes 04:30 UTC → domingo) |
| CA-03.7 | R-02, R-04 | test dominio (semana pasada y futura excluidas) |
| CA-03.8 | R-13 | test dominio (meta null) · curl juego sin meta |
| CA-03.9 | R-13 | test dominio (sin partidas) · curl juego sin partidas |
| CA-03.10 | R-15 | test dominio (misma semana, meta distinta → porcentaje distinto) · prueba manual |
| CA-03.11 | R-12 | test dominio `metaCumplida` |
| CA-04.1 | R-08 | test dominio |
| CA-04.2 | R-08 | test dominio |
| CA-04.3 | R-08 | test dominio |
| CA-04.4 | R-09 | test dominio (9 pasada, 4 actual) |
| CA-04.5 | R-08 | test dominio |
| CA-05.1 | R-10 | test dominio |
| CA-05.2 | R-10 | test dominio (avance baja → no alcanzado) |
| CA-05.3 | R-10, R-13 | test dominio |
| CA-06.1 | R-15, R-19 | test API `PUT` → 200 · prueba manual en UI |
| CA-06.3 | R-19, R-20 | test API (PUT/PATCH inactiva → 409) |
| CA-06.4 | — | curl `GET /api/videojuegos/:id/metas` |
| CA-06.5 | R-19 | test API (PUT con `videojuego` → 400) |
| CA-07.1 | R-21 | test API `politica-borrado.test.ts` |
| CA-07.2 | R-22 | test API (PUT estado completado → meta desactivada) |
| CA-09.1 | R-23 | test API y curl (id inválido → 400) |
| CA-09.2 | R-23 | test API y curl (juego inexistente → 404) |

## 5. Tabla ticket → archivos

| Ticket | Archivos |
|---|---|
| T-01 | `backend/test/progreso.dominio.test.ts`, `backend/package.json` (script `test`) |
| T-02 | `backend/src/dominio/progreso.ts`, `backend/src/services/partidas.service.ts` (usa `calcularAvanceActual`, mismo resultado) |
| T-03 | `backend/src/models/Meta.ts`, `backend/test/meta.model.test.ts` |
| T-04 | `backend/src/services/metas.service.ts`, `backend/src/controllers/metas.controller.ts`, `backend/src/routes/metas.routes.ts`, `backend/src/routes/videojuegos.routes.ts`, `backend/src/app.ts`, `backend/test/metas.api.test.ts`, `backend/test/helpers/api.ts` (API contra MongoDB en memoria con `mongodb-memory-server-core`, sin Atlas) |
| T-05 | `backend/src/middlewares/errorHandler.ts`, `backend/test/errorHandler.test.ts` |
| T-06 | `backend/src/services/progreso.service.ts`, `backend/src/controllers/metas.controller.ts`, `backend/src/routes/videojuegos.routes.ts`, `backend/test/metas.api.test.ts` |
| T-07 | `backend/src/services/videojuegos.service.ts`, `backend/test/politica-borrado.test.ts` |

> **Actualización (2026-11-11, tras la auditoría):** se completó la tabla anterior con `errorHandler.test.ts`
> (T-05) y con la herramienta de base de datos en memoria que usan los tests de API (T-04), que faltaban.

## 6. Fuera de alcance
Historial de semanas pasadas (PA-01), notificaciones, recordatorios, rankings, metas compartidas, WebSocket.
