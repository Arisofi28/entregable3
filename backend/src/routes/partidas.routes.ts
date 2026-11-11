
import { Router } from "express";

import {
  listar,
  crear,
  actualizar,
  eliminar
} from "../controllers/partidas.controller.js";

const router = Router();

// Todas las partidas
router.get("/", listar);

// Registrar una nueva partida
router.post("/", crear);

// Editar una partida (deuda D-02)
router.put("/:id", actualizar);

// Eliminar una partida
router.delete("/:id", eliminar);

export default router;
