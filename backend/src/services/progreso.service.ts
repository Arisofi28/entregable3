import { MetaModel } from "../models/Meta.js";
import { PartidaModel } from "../models/Partida.js";
import { VideojuegoModel } from "../models/Videojuego.js";
import { AppError } from "../middlewares/AppError.js";
import { calcularProgresoSemanal } from "../dominio/progreso.js";
import { validarId } from "./videojuegos.service.js";

// T-06 · GET /api/videojuegos/:id/progreso-semanal
// El servicio solo consulta datos; el cálculo vive en src/dominio/progreso.ts.
export async function obtenerProgresoSemanal(
  videojuegoId: string,
  ahora: Date = new Date()
) {
  validarId(videojuegoId);

  const existe = await VideojuegoModel.exists({ _id: videojuegoId });
  if (!existe) {
    throw new AppError(404, "Videojuego no encontrado");
  }

  const [partidas, meta] = await Promise.all([
    PartidaModel.find({ videojuego: videojuegoId })
      .select("fecha duracionMinutos porcentajeAvance")
      .lean(),
    // R-15: siempre la meta activa en el momento de la consulta (RN-10)
    MetaModel.findOne({ videojuego: videojuegoId, activa: true }).lean()
  ]);

  return calcularProgresoSemanal({ partidas, meta, ahora });
}
