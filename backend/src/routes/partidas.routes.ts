
import { Router } from "express";

import {
  listar,
  crear,
  eliminar
} from "../controllers/partidas.controller.js";

const router = Router();

// Todas las partidas
router.get("/", listar);

// Registrar una nueva partida
router.post("/", crear);

// Eliminar una partida
router.delete("/:id", eliminar);

export default router;
