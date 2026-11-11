# Pruebas de la API — E2 (fase 6)

Ejecutadas el 2026-11-11 a las 13:30 (hora de Ecuador, miércoles) contra la API local
(`backend/src` con MongoDB en memoria, sin Atlas). Script: equivalente a los comandos de abajo con `curl` + `jq`.

**Datos:** «Juego sin partidas» (A); «Juego con racha» (B) con 8 partidas en 7 días distintos:
4, 5, 6 y 7 de nov. (racha de 4), **sin partida el 8** (racha rota), 9, 10 (dos partidas) y 11 de nov.;
«Juego completado» (C).

| # | Caso | Esperado | Obtenido | ✔ |
|---|---|---|---|---|
| 1 | Progreso de A (sin partidas, sin meta) | 200, `meta: null`, `porcentajeHoras: null`, todo en 0 | 200, igual | ✔ |
| 2 | Crear meta 5 h / 4 d con 3 hitos en B | 201, `activa: true` | 201 | ✔ |
| 3 | Progreso de B | 45+90+30+60 = 225 min → **3.8 h**, **76 %**, **3 días**, racha **3**, mejor **4**, avance 55 → hitos 25 y 50 ✓, 100 ✗ | idéntico | ✔ |
| 4 | Segunda meta activa en B | 409 | 409 «Este videojuego ya tiene una meta activa…» | ✔ |
| 5 | Meta en C (completado) | 409 | 409 «…videojuego completado…» | ✔ |
| 6 | Meta con 8 días | 400 | 400 «…entre 1 y 7» | ✔ |
| 7 | Progreso con id `123` | 400 | 400 «El identificador tiene un formato inválido» | ✔ |
| 8 | Progreso de id inexistente | 404 | 404 «Videojuego no encontrado» | ✔ |
| 9 | Historial de metas de B | 200, 1 meta activa | 200 | ✔ |
| 10 | Resumen E1 de B | Forma sin cambios | 200, `porcentajeAvanceActual: 55` | ✔ |

## Salida completa

```text
A=6af4b439438a576f97d09b1c B=6af4b439438a576f97d09b1d C=6af4b439438a576f97d09b1e

### 1. Progreso de juego sin partidas y sin meta
$ curl -X GET /videojuegos/6af4b439438a576f97d09b1c/progreso-semanal 
HTTP 200
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":null,"horasSemana":0,"porcentajeHoras":null,"diasJugadosSemana":0,"diasSemana":[{"fecha":"2026-11-09","jugado":false},{"fecha":"2026-11-10","jugado":false},{"fecha":"2026-11-11","jugado":false},{"fecha":"2026-11-12","jugado":false},{"fecha":"2026-11-13","jugado":false},{"fecha":"2026-11-14","jugado":false},{"fecha":"2026-11-15","jugado":false}],"rachaActual":0,"mejorRacha":0,"metaCumplida":null,"hitos":[]}

### 2. Crear meta con hitos (201)
$ curl -X POST /metas -d '{"videojuego":"6af4b439438a576f97d09b1d","horasSemanales":5,"diasPorSemana":4,"hitos":[{"descripcion":"Terminar el juego","porcentajeObjetivo":100},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25},{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50}]}'
HTTP 201
{"videojuego":"6af4b439438a576f97d09b1d","horasSemanales":5,"diasPorSemana":4,"activa":true,"hitos":[{"descripcion":"Terminar el juego","porcentajeObjetivo":100,"_id":"6af4b439438a576f97d09b28"},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"_id":"6af4b439438a576f97d09b29"},{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"_id":"6af4b439438a576f97d09b2a"}],"_id":"6af4b439438a576f97d09b27","createdAt":"2026-11-11T18:30:17.799Z","updatedAt":"2026-11-11T18:30:17.799Z"}

### 3. Progreso: 8 partidas en 7 días distintos, racha rota el 8-nov
$ curl -X GET /videojuegos/6af4b439438a576f97d09b1d/progreso-semanal 
HTTP 200
{"semana":{"inicio":"2026-11-09","fin":"2026-11-15"},"meta":{"_id":"6af4b439438a576f97d09b27","horasSemanales":5,"diasPorSemana":4},"horasSemana":3.8,"porcentajeHoras":76,"diasJugadosSemana":3,"diasSemana":[{"fecha":"2026-11-09","jugado":true},{"fecha":"2026-11-10","jugado":true},{"fecha":"2026-11-11","jugado":true},{"fecha":"2026-11-12","jugado":false},{"fecha":"2026-11-13","jugado":false},{"fecha":"2026-11-14","jugado":false},{"fecha":"2026-11-15","jugado":false}],"rachaActual":3,"mejorRacha":4,"metaCumplida":false,"hitos":[{"_id":"6af4b439438a576f97d09b29","descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"alcanzado":true},{"_id":"6af4b439438a576f97d09b2a","descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"alcanzado":true},{"_id":"6af4b439438a576f97d09b28","descripcion":"Terminar el juego","porcentajeObjetivo":100,"alcanzado":false}]}

### 4. Segunda meta activa (409)
$ curl -X POST /metas -d '{"videojuego":"6af4b439438a576f97d09b1d","horasSemanales":3,"diasPorSemana":2}'
HTTP 409
{"error":{"mensaje":"Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.","statusCode":409,"requestId":"79e78de9-3a98-4372-8cc8-7439de30bcfa"}}

### 5. Meta para juego completado (409)
$ curl -X POST /metas -d '{"videojuego":"6af4b439438a576f97d09b1e","horasSemanales":3,"diasPorSemana":2}'
HTTP 409
{"error":{"mensaje":"No se puede crear una meta para un videojuego completado. Cambia su estado a jugando o pausado.","statusCode":409,"requestId":"d64b6380-c1ab-436b-882b-158d22db814a"}}

### 6. Meta con 8 días por semana (400)
$ curl -X POST /metas -d '{"videojuego":"6af4b439438a576f97d09b1c","horasSemanales":3,"diasPorSemana":8}'
HTTP 400
{"error":{"mensaje":"Los días por semana deben ser un número entero entre 1 y 7","statusCode":400,"requestId":"996c3ed9-35c6-4a4a-aa50-4da44c9ed66a"}}

### 7. Progreso con id inválido (400)
$ curl -X GET /videojuegos/123/progreso-semanal 
HTTP 400
{"error":{"mensaje":"El identificador tiene un formato inválido","statusCode":400,"requestId":"31f15ff4-d850-4b37-9ddb-feb1c0e51ded"}}

### 8. Progreso de juego inexistente (404)
$ curl -X GET /videojuegos/64b000000000000000000099/progreso-semanal 
HTTP 404
{"error":{"mensaje":"Videojuego no encontrado","statusCode":404,"requestId":"355b3418-1e90-4809-bbb8-8b5ad634e74c"}}

### 9. Historial de metas del juego
$ curl -X GET /videojuegos/6af4b439438a576f97d09b1d/metas 
HTTP 200
[{"_id":"6af4b439438a576f97d09b27","videojuego":"6af4b439438a576f97d09b1d","horasSemanales":5,"diasPorSemana":4,"activa":true,"hitos":[{"descripcion":"Terminar el juego","porcentajeObjetivo":100,"_id":"6af4b439438a576f97d09b28"},{"descripcion":"Llegar al 25 %","porcentajeObjetivo":25,"_id":"6af4b439438a576f97d09b29"},{"descripcion":"Llegar al 50 %","porcentajeObjetivo":50,"_id":"6af4b439438a576f97d09b2a"}],"createdAt":"2026-11-11T18:30:17.799Z","updatedAt":"2026-11-11T18:30:17.799Z"}]

### 10. Resumen E1 sin cambios
$ curl -X GET /videojuegos/6af4b439438a576f97d09b1d/resumen 
HTTP 200
{"totalPartidas":8,"horasTotales":7.75,"ultimaPartida":"2026-11-11T14:00:00.000Z","porcentajeAvanceActual":55}

```
