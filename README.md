
# ARCADE UNIVERSE
## Entregable 3 — Diario de Progreso Gamer

Aplicación web full-stack para gestionar videojuegos,
registrar sesiones de juego, administrar logros y
visualizar el progreso calculado.

## Objetivo

La aplicación responde tres preguntas:

- ¿Qué videojuegos estoy jugando?
- ¿Cuánto tiempo les he dedicado?
- ¿Qué porcentaje de avance tengo actualmente?

## Identidad visual

Arcade Universe combina una biblioteca de videojuegos
luminosa y colorida con una sección Checkpoint oscura,
con detalles neón y estética arcade.

Se inspira en videojuegos de plataformas y utiliza
elementos gráficos originales.

## Tecnologías

Backend:
- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB Atlas

Frontend:
- React
- TypeScript
- Vite
- React Router
- CSS
- Lucide Icons

Despliegue:
- Render
- MongoDB Atlas

## Modelo Videojuego

Campos:

- nombre: String obligatorio
- plataforma: PC, PlayStation, Xbox, Switch, Movil
- genero: accion, rol, estrategia, puzzle,
  deportes, otro
- estado: jugando, pausado, completado, abandonado
- logros: subdocumentos con nombre y obtenido
- createdAt: Date
- updatedAt: Date

## Modelo Partida

Campos:

- videojuego: ObjectId, ref Videojuego
- fecha: Date obligatoria
- duracionMinutos: Number, mayor que 0
- porcentajeAvance: Number, entre 0 y 100
- notas: String opcional
- createdAt: Date
- updatedAt: Date

## Justificación de las relaciones

### Logros embebidos

Los logros están embebidos dentro de Videojuego
porque son una lista pequeña y se consultan
junto con el juego.

### Partidas referenciadas

Las partidas pertenecen a una colección independiente
porque pueden aumentar continuamente y consultarse
sin recuperar todo el documento Videojuego.

## Resumen calculado

GET /api/videojuegos/:id/resumen

totalPartidas = cantidad de partidas

horasTotales = suma(duracionMinutos) / 60

ultimaPartida = fecha de la sesión más reciente

porcentajeAvanceActual = suma del avance ganado en
todas las sesiones del videojuego, limitada a 100%.

Si dos partidas tienen la misma fecha se aplicará
un criterio determinista de desempate.

Si no existen partidas:

- totalPartidas: 0
- horasTotales: 0
- ultimaPartida: null
- porcentajeAvanceActual: 0

El cálculo se realizará en la capa de servicio.

Cada `Partida.porcentajeAvance` representa el avance ganado durante esa
sesión. Los registros existentes no se modifican automáticamente: si se
guardaron como porcentajes absolutos, deben revisarse y recrearse o migrarse
manualmente a incrementos por sesión antes de usarlos con esta semántica.

## Arquitectura

Backend:
Rutas -> Controladores -> Servicios -> Modelos

Frontend:
Páginas -> Servicios API -> Backend

## Manejo de errores

400: validaciones e identificadores incorrectos
404: recurso o referencia inexistente
500: error inesperado

Se implementarán requestId, logger y
errorHandler centralizado.

## Ejecución local

### Backend

cd backend
npm install
npm run dev

http://localhost:3000/api/health

### Frontend

cd frontend
npm install
npm run dev

http://localhost:5173

## Variables de entorno

Backend:
- PORT
- MONGODB_URI
- CLIENT_URL
- NODE_ENV



## E2 · Metas y rachas (Proyecto 4)

Responde: «¿estoy cumpliendo lo que me propuse esta semana y cuántos días seguidos llevo jugando?».

- **Meta** (colección `metas`): referencia a un Videojuego; horas y días por semana; hasta 5 hitos embebidos;
  como máximo una meta activa por juego (índice único parcial). Las metas desactivadas quedan como historial.
- **Progreso semanal**: `GET /api/videojuegos/:id/progreso-semanal` (semana de lunes a domingo, hora de Ecuador):
  horas, porcentaje, días jugados, racha actual, mejor racha y estado de cada hito.
- Cálculo en funciones puras: `backend/src/dominio/progreso.ts`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/metas` | Crear meta (409 si ya hay una activa o el juego está completado/abandonado) |
| GET | `/api/metas/:id` | Consultar meta |
| PUT | `/api/metas/:id` | Editar horas, días e hitos de la meta activa |
| PATCH | `/api/metas/:id/desactivar` | Desactivar (se conserva) |
| GET | `/api/videojuegos/:id/metas` | Historial de metas del juego |
| GET | `/api/videojuegos/:id/progreso-semanal` | Progreso de la semana actual |
| PUT | `/api/partidas/:id` | Editar partida (deuda D-02) |

Eliminar un videojuego elimina también sus metas y sus partidas.

### Tests

```bash
cd backend && npm test          # dominio, modelo y API (MongoDB en memoria) + test heredado
cd frontend && npm run test:e2e # flujo en Chrome headless; requiere API y frontend locales
```

## Cómo trabajamos con el agente

Todo E2 se construyó con **Claude Code** siguiendo Spec-Driven Development:
diagnóstico → harness → PRD → épica → historias → criterios → tickets → specs → código con tests → auditoría.
Cada documento se commiteó antes que el código que implementa (ver `git log`).

### Harness

| Pieza | Archivo | Para qué |
|---|---|---|
| Memoria del proyecto | [`AGENTS.md`](AGENTS.md) (y [`CLAUDE.md`](CLAUDE.md) = `@AGENTS.md`) | Stack, estructura, comandos, convenciones y reglas |
| Sistema de diseño | [`DESIGN.md`](DESIGN.md) | Tokens, componentes, tono, accesibilidad y «no hacemos» |
| Skill `/nueva-spec` | [`.claude/skills/nueva-spec`](.claude/skills/nueva-spec/SKILL.md) | Crea una spec desde el backlog |
| Skill `/commit-ticket` | [`.claude/skills/commit-ticket`](.claude/skills/commit-ticket/SKILL.md) | Corre tests y commitea nombrando el ticket |
| Hook PostToolUse | [`.claude/hooks/format.sh`](.claude/hooks/format.sh) | Prettier sobre cada archivo editado |
| Hook PreToolUse | [`.claude/hooks/proteger-env.sh`](.claude/hooks/proteger-env.sh) | Bloquea leer o editar archivos de variables de entorno |

### Dónde está cada documento

| Documento | Ruta |
|---|---|
| Diagnóstico del Proyecto 3 | [`docs/diagnostico.md`](docs/diagnostico.md) |
| PRD (con los huecos resueltos) | [`docs/prd/PRD.md`](docs/prd/PRD.md) |
| Épicas | [`docs/backlog/epicas.md`](docs/backlog/epicas.md) |
| Historias, criterios, tickets y deuda | [`docs/backlog/E2-metas-y-rachas.md`](docs/backlog/E2-metas-y-rachas.md) |
| Specs | [`docs/specs/`](docs/specs/) |
| Pruebas con curl | [`docs/pruebas-api.md`](docs/pruebas-api.md) |
| Revisión de diseño | [`docs/revision-diseno.md`](docs/revision-diseno.md) |
| Auditoría | [`docs/AUDITORIA.md`](docs/AUDITORIA.md) |
| Bitácora del agente | [`docs/bitacora-agente.md`](docs/bitacora-agente.md) |

### Trazabilidad de un criterio (ejemplo: «la racha sigue viva si hoy no hay partida»)

PRD **RN-07** → historia **HU-04** / criterio **CA-04.2** → ticket **T-01/T-02** → spec backend **R-08** →
test `progreso.dominio.test.ts` «CA-04.2 sin partida hoy pero sí ayer…» → código `calcularRachas` en
`backend/src/dominio/progreso.ts` → fila CA-04.2 en `docs/AUDITORIA.md`.

Despliege Front: https://entregable3-frontend.onrender.com/

Despliege Back: https://entregable3-1v2.onrender.com

GitHub https://github.com/Arisofi28/entregable3

Video Youtube. Prueba. https://youtu.be/b7lNVFGCRm8
