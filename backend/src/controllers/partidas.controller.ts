
import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  listarPartidas,
  crearPartida,
  eliminarPartida,
  partidasPorVideojuego,
  resumenVideojuego
} from "../services/partidas.service.js";

// Envía errores al middleware centralizado
function asyncHandler(
  funcion: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(
      funcion(req, res, next)
    ).catch(next);
  };
}

// GET /api/partidas
export const listar = asyncHandler(
  async (_req, res) => {
    const partidas = await listarPartidas();
    res.status(200).json(partidas);
  }
);

// POST /api/partidas
export const crear = asyncHandler(
  async (req, res) => {
    const partida = await crearPartida(req.body);
    res.status(201).json(partida);
  }
);

// DELETE /api/partidas/:id
export const eliminar = asyncHandler(
  async (req, res) => {
    await eliminarPartida(String(req.params.id));
    res.status(204).send();
  }
);

// GET /api/videojuegos/:id/partidas
export const listarPorVideojuego = asyncHandler(
  async (req, res) => {
    const partidas = await partidasPorVideojuego(
      String(req.params.id)
    );

    res.status(200).json(partidas);
  }
);

// GET /api/videojuegos/:id/resumen
export const obtenerResumen = asyncHandler(
  async (req, res) => {
    const resumen = await resumenVideojuego(
      String(req.params.id)
    );

    res.status(200).json(resumen);
  }
);
