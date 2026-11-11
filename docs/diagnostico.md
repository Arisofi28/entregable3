# Diagnóstico del Proyecto 3 — Arcade Universe

Fecha: 2026-11-11 · Rama: `feature/e2-metas-rachas` · Base: `main` @ `937e2e3`

Diagnóstico hecho con Claude Code leyendo el código, el README y las pruebas del Proyecto 3,
y probando la API desplegada. Las decisiones de qué arreglar y qué diferir las tomó la estudiante.

## 1. Estado del proyecto

| Área | Estado | Observaciones |
|---|---|---|
| Backend (Express 5 + TS + Mongoose 9) | Funciona | Capas rutas → controladores → servicios → modelos. `requestId`, `logger` y `errorHandler` centralizado. |
| Modelo `Videojuego` | Funciona | Logros embebidos, `strict: "throw"`, enums de plataforma/género/estado. |
| Modelo `Partida` | Funciona | Referencia a `Videojuego`. `porcentajeAvance` = avance **ganado en la sesión** (incremental). Índice `{videojuego, fecha}`. |
| Resumen `GET /api/videojuegos/:id/resumen` | Funciona | `porcentajeAvanceActual` = suma de avances, limitada a 100. Cálculo en el servicio, no en una función pura. |
| CRUD de partidas | Incompleto | Hay crear, listar y eliminar. **No existe editar** (`PUT /api/partidas/:id`). |
| Eliminar videojuego | Defecto | Borra el juego pero **deja sus partidas huérfanas**. |
| errorHandler | Parcial | Distingue 400, 404 y 500. No tiene 409 (necesario para E2). |
| Tests | Mínimo | Un único test de integración (`node:test`) con modelos simulados; se ejecuta contra `dist/` y obliga a compilar antes. No hay tests unitarios. |
| Frontend (React 19 + Vite + Router 7) | Funciona | Páginas Home, My Games, editor, Sessions y Checkpoint (detalle). Servicios API separados (`api.ts`, `videojuegosApi.ts`, `partidasApi.ts`). Iconos con `lucide-react`. |
| Estilos | Funciona, con deuda | Variables en `index.css` (`--blue`, `--navy`…), pero muchos colores y tamaños están escritos a mano en los CSS de cada página. |
| Despliegue | Funciona | Front: `entregable3-frontend.onrender.com`. API: `entregable3-1v2.onrender.com` (`/api/health` responde 200). |
| Harness / docs SDD | No existe | Sin `AGENTS.md`, `CLAUDE.md`, `.claude/`, `DESIGN.md` ni `docs/`. |

## 2. Tabla de problemas

| Id | Problema | Evidencia | ¿Bloquea E2? | Decisión |
|---|---|---|---|---|
| P-01 | Eliminar un videojuego deja partidas huérfanas | `videojuegos.service.ts` → `eliminarVideojuego` solo hace `findByIdAndDelete` | Sí: E2 exige que tampoco queden metas huérfanas; la política de borrado debe ser una sola | **Se paga** (D-01) |
| P-02 | No se puede editar una partida | No hay `PUT` en `partidas.routes.ts` ni en `partidasApi.ts` | Sí: E2 pide reconsultar el progreso al registrar, **editar** o eliminar una partida | **Se paga** (D-02) |
| P-03 | El errorHandler no distingue 409 | `errorHandler.ts` | Sí: meta activa duplicada → 409 | Se resuelve dentro de E2 (T-05) |
| P-04 | El cálculo del avance actual vive dentro del servicio | `partidas.service.ts` → `resumenVideojuego` | Sí: los hitos dependen de ese valor y deben calcularse con funciones puras | Se extrae a la capa de dominio en E2 (T-02) sin cambiar el resultado del resumen |
| P-05 | URL de respaldo de la API errónea | `frontend/src/services/api.ts` usa `entregable3-backend-nnt0.onrender.com`, que responde 404 | No: en Render se usa `VITE_API_URL` | Se difiere (D-03) |
| P-06 | `npm test` compila y prueba contra `dist/` | `backend/package.json` | No: los tests nuevos corren sobre `src/` con `tsx` | Se difiere (D-04) |
| P-07 | Carpeta `frontend/backups/` versionada | `git ls-files frontend/backups` | No | Se difiere (D-05) |
| P-08 | Confirmación con `window.confirm` nativo | `SessionsPage.tsx` → `deleteSession` | No (la UI nueva usa confirmación propia) | Se difiere (D-06) |
| P-09 | Colores y medidas escritos a mano en CSS existentes | `CheckpointPage.css`, `HomePage.css`… | No (los estilos nuevos solo usan variables de `DESIGN.md`) | Se difiere (D-07) |
| P-10 | Orígenes CORS de producción escritos en el código | `app.ts` → `allowedOrigins` | No | Se difiere (D-08) |
| P-11 | Fechas mostradas con la zona horaria del navegador, no la de Ecuador | `CheckpointPage.tsx`, `SessionsPage.tsx` | No para la API (la semana se calcula en el backend) | Se difiere (D-09) |

## 3. Decisiones tomadas

1. **E2 se construye sobre lo que funciona.** No se toca el modelo de `Videojuego` ni de `Partida`, ni la fórmula del resumen.
2. **Se pagan P-01 y P-02** con el ciclo completo (criterio → test → código → verificación), porque ambos están en el camino de E2.
3. **P-03 y P-04 forman parte de E2**, no son deuda aparte: son requisitos directos de la épica.
4. **Tests nuevos con `node:test` + `tsx`** sobre `src/` (no se agrega Vitest para no sumar dependencias). El test existente se mantiene igual.
5. **La interfaz nueva se escribe en inglés**, igual que el resto de Arcade Universe; la documentación en español.
6. El resto (P-05 a P-11) queda en la sección «Deuda técnica» de `docs/backlog/E2-metas-y-rachas.md` con su motivo.
