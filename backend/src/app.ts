
import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import videojuegosRoutes from "./routes/videojuegos.routes.js";

import { requestId } from "./middlewares/requestId.js";
import { logger } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { AppError } from "./middlewares/AppError.js";

const app = express();

// Configuración general
app.use(cors({ origin: env.CLIENT_URL }));
app.use(requestId);
app.use(logger);
app.use(express.json());

// Ruta de prueba
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    project: "entregable3",
    message: "Arcade Universe API funcionando"
  });
});

// RUTAS DE VIDEOJUEGOS
app.use("/api/videojuegos", videojuegosRoutes);

// Ruta no encontrada
app.use((_req, _res, next) => {
  next(new AppError(404, "Ruta no encontrada"));
});

// Middleware de errores (siempre al final)
app.use(errorHandler);

export default app;
