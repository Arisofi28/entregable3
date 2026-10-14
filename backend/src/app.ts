
import express from "express";
import cors from "cors";

// Variables de entorno
import { env } from "./config/env.js";

// Rutas
import videojuegosRoutes from "./routes/videojuegos.routes.js";
import partidasRoutes from "./routes/partidas.routes.js";

// Middlewares
import { requestId } from "./middlewares/requestId.js";
import { logger } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { AppError } from "./middlewares/AppError.js";

const app = express();

// ========================================
// 1. CONFIGURACIÓN DE CORS
// ========================================

// Orígenes permitidos para el frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  env.CLIENT_URL
].filter(
  (origin): origin is string => Boolean(origin)
);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
  })
);

// ========================================
// 2. MIDDLEWARES GENERALES
// ========================================

app.use(requestId);
app.use(logger);
app.use(express.json());

// ========================================
// 3. HEALTH CHECK
// ========================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    project: "entregable3",
    message: "Arcade Universe API funcionando"
  });
});

// ========================================
// 4. RUTAS DE VIDEOJUEGOS
// ========================================

app.use("/api/videojuegos", videojuegosRoutes);

// ========================================
// 5. RUTAS DE PARTIDAS
// ========================================

app.use("/api/partidas", partidasRoutes);

// ========================================
// 6. RUTA NO ENCONTRADA
// ========================================

app.use((_req, _res, next) => {
  next(new AppError(404, "Ruta no encontrada"));
});

// ========================================
// 7. MANEJO CENTRALIZADO DE ERRORES
// ========================================

// Siempre debe estar al final
app.use(errorHandler);

export default app;
