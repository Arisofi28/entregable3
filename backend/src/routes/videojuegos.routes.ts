
import { Router } from "express";

import * as controller from "../controllers/videojuegos.controller.js";

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

export default router;
