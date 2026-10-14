
import type {
  Request,
  Response,
  NextFunction
} from "express";

import * as service from "../services/videojuegos.service.js";

// Función auxiliar para manejar errores asíncronos
type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

function manejarAsync(fn: AsyncController) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// GET /api/videojuegos
export const listar = manejarAsync(
  async (req, res) => {
    const estado =
      typeof req.query.estado === "string"
        ? req.query.estado
        : undefined;

    const videojuegos =
      await service.listarVideojuegos(estado);

    res.status(200).json(videojuegos);
  }
);

// GET /api/videojuegos/:id
export const obtenerPorId = manejarAsync(
  async (req, res) => {
    const videojuego =
      await service.obtenerVideojuego(
        String(req.params.id)
      );

    res.status(200).json(videojuego);
  }
);

// POST /api/videojuegos
export const crear = manejarAsync(
  async (req, res) => {
    const videojuego =
      await service.crearVideojuego(req.body);

    res.status(201).json(videojuego);
  }
);

// PUT /api/videojuegos/:id
export const actualizar = manejarAsync(
  async (req, res) => {
    const videojuego =
      await service.actualizarVideojuego(
        String(req.params.id),
        req.body
      );

    res.status(200).json(videojuego);
  }
);

// DELETE /api/videojuegos/:id
export const eliminar = manejarAsync(
  async (req, res) => {
    await service.eliminarVideojuego(
      String(req.params.id)
    );

    res.status(204).send();
  }
);

// PATCH /api/videojuegos/:id/logros/:logroId
export const actualizarLogro = manejarAsync(
  async (req, res) => {
    const videojuego =
      await service.actualizarLogro(
        String(req.params.id),
        String(req.params.logroId),
        req.body?.obtenido
      );

    res.status(200).json(videojuego);
  }
);
