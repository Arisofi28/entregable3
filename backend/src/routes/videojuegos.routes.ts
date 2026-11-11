
import { Router } from "express";

import * as controller from "../controllers/videojuegos.controller.js";
import {
  listarPorVideojuego as listarMetasPorVideojuego,
  progresoSemanal
} from "../controllers/metas.controller.js";

import {
  listarPorVideojuego,
  obtenerResumen
} from "../controllers/partidas.controller.js";


const router = Router();

router.get("/", controller.listar);

router.get("/:id", controller.obtenerPorId);

router.post("/", controller.crear);

router.put("/:id", controller.actualizar);

router.delete("/:id", controller.eliminar);

router.patch(
  "/:id/logros/:logroId",
  controller.actualizarLogro
);

// Obtener las partidas de un videojuego
router.get(
  "/:id/partidas",
  listarPorVideojuego
);

// Obtener resumen calculado
router.get(
  "/:id/resumen",
  obtenerResumen
);


// E2: historial de metas del videojuego (activa primero)
router.get("/:id/metas", listarMetasPorVideojuego);

// E2: progreso de la semana actual, racha e hitos
router.get("/:id/progreso-semanal", progresoSemanal);

export default router;
