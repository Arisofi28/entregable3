import type { Request, Response, NextFunction } from "express";

import * as service from "../services/metas.service.js";
import { obtenerProgresoSemanal } from "../services/progreso.service.js";

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function manejarAsync(fn: AsyncController) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// POST /api/metas
export const crear = manejarAsync(async (req, res) => {
  const meta = await service.crearMeta(req.body);
  res.status(201).json(meta);
});

// GET /api/metas/:id
export const obtenerPorId = manejarAsync(async (req, res) => {
  const meta = await service.obtenerMeta(String(req.params.id));
  res.status(200).json(meta);
});

// PUT /api/metas/:id
export const actualizar = manejarAsync(async (req, res) => {
  const meta = await service.actualizarMeta(String(req.params.id), req.body);
  res.status(200).json(meta);
});

// PATCH /api/metas/:id/desactivar
export const desactivar = manejarAsync(async (req, res) => {
  const meta = await service.desactivarMeta(String(req.params.id));
  res.status(200).json(meta);
});

// GET /api/videojuegos/:id/metas
export const listarPorVideojuego = manejarAsync(async (req, res) => {
  const metas = await service.listarMetasDeVideojuego(String(req.params.id));
  res.status(200).json(metas);
});

// GET /api/videojuegos/:id/progreso-semanal
export const progresoSemanal = manejarAsync(async (req, res) => {
  const progreso = await obtenerProgresoSemanal(String(req.params.id));
  res.status(200).json(progreso);
});
