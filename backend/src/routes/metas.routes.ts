import { Router } from "express";

import * as controller from "../controllers/metas.controller.js";

const router = Router();

// Crear una meta para un videojuego
router.post("/", controller.crear);

// Consultar una meta por id
router.get("/:id", controller.obtenerPorId);

// Editar horas, días o hitos de la meta activa
router.put("/:id", controller.actualizar);

// Desactivar la meta (se conserva en el historial)
router.patch("/:id/desactivar", controller.desactivar);

export default router;
