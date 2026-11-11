# Arcade Universe — Diario de Progreso Gamer

Registra videojuegos y partidas, calcula el avance (E1) y, desde E2, metas semanales,
rachas e hitos. Producto en `docs/prd/`, backlog en `docs/backlog/`, specs en `docs/specs/`.

## Stack
- Backend: Node 20+, Express 5, TypeScript (ESM, `NodeNext`), Mongoose 9, MongoDB Atlas.
- Frontend: React 19, TypeScript, Vite, React Router 7, CSS plano, `lucide-react`.
- Tests: `node:test` + `tsx` (backend). Despliegue: Render (API + sitio estático).

## Estructura
```
backend/src/
  models/        esquemas Mongoose (Videojuego, Partida, Meta)
  dominio/       funciones puras sin BD (progreso semanal, rachas, hitos)
  services/      reglas de negocio y acceso a datos; lanzan AppError
  controllers/   traducen HTTP ↔ servicio
  routes/        rutas Express
  middlewares/   requestId, logger, AppError, errorHandler
backend/test/    tests (*.test.ts sobre src/)
frontend/src/
  pages/         páginas (CheckpointPage = detalle del juego)
  components/    componentes reutilizables
  services/      clientes HTTP (api.ts, videojuegosApi, partidasApi, metasApi)
docs/            diagnóstico, PRD, backlog, specs, auditoría, bitácora
```

## Comandos
- `cd backend && npm run dev` · `npm test` (MongoDB en memoria) · `npm run build`
- `cd frontend && npm run dev` · `npm run build` · `npm run lint` · `npm run test:e2e`

## Convenciones
- Código y nombres de dominio en español (`horasSemanales`, `rachaActual`); UI en inglés.
- Capas: rutas → controladores → servicios → modelos. Los controladores no consultan modelos.
- Los cálculos (semana, racha, hitos, avance) son funciones puras en `src/dominio/`,
  reciben `ahora` como parámetro y tienen tests.
- Errores con `AppError(status, mensaje)`; el `errorHandler` responde `{ error: { mensaje, statusCode, requestId } }`.
- Zona horaria de negocio: `America/Guayaquil`; semana de lunes a domingo.
- Commits: `feat(E2): T-xx descripción`, `fix(deuda): D-xx descripción`, `docs(E2): ...`.

## Reglas
1. Nunca leer ni modificar `.env` (un hook lo bloquea). Solo `.env.example`, sin secretos.
2. Ninguna funcionalidad sin una spec en `docs/specs/`. Si falta, se escribe y commitea antes.
3. Ejecutar los tests (`cd backend && npm test`) antes de dar una tarea por terminada.
4. No inventar producto: lo que no está en el PRD es un supuesto y se pregunta.
5. No cambiar `Videojuego`, `Partida` ni el resumen salvo que lo pida una spec o el diagnóstico.
6. No commitear `dist/`, `node_modules/` ni `.env`.

## Frontend
- La identidad visual está en `DESIGN.md` (raíz). Léelo antes de tocar UI.
- Los estilos nuevos solo usan las variables CSS de `frontend/src/index.css` definidas desde DESIGN.md.
- Sin librerías de UI que DESIGN.md no autorice. Las llamadas HTTP van en `src/services/`.
