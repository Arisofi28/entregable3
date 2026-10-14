
import { isObjectIdOrHexString } from "mongoose";

import { PartidaModel } from "../models/Partida.js";
import { VideojuegoModel } from "../models/Videojuego.js";
import { AppError } from "../middlewares/AppError.js";

// Verificar que el ID tenga el formato correcto
function validarId(id: string): void {
  if (!isObjectIdOrHexString(id)) {
    throw new AppError(400, "ID inválido");
  }
}

// GET /api/partidas
// Todas las partidas con los datos de sus videojuegos
export async function listarPartidas() {
  return PartidaModel.find()
    .populate("videojuego")
    .sort({ fecha: -1, createdAt: -1, _id: -1 });
}

// POST /api/partidas
// Crear una nueva sesión
export async function crearPartida(datos: unknown) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    throw new AppError(
      400,
      "Debes enviar un objeto JSON válido"
    );
  }

  const entrada = datos as Record<string, unknown>;

  const camposPermitidos = [
    "videojuego",
    "fecha",
    "duracionMinutos",
    "porcentajeAvance",
    "notas"
  ];

  const extras = Object.keys(entrada).filter(
    campo => !camposPermitidos.includes(campo)
  );

  if (extras.length > 0) {
    throw new AppError(
      400,
      `Campos no permitidos: ${extras.join(", ")}`
    );
  }

  if (
    typeof entrada.porcentajeAvance !== "number" ||
    !Number.isFinite(entrada.porcentajeAvance) ||
    entrada.porcentajeAvance < 0 ||
    entrada.porcentajeAvance > 100
  ) {
    throw new AppError(
      400,
      "El avance ganado en la sesión debe estar entre 0 y 100%"
    );
  }

  if (typeof entrada.videojuego !== "string") {
    throw new AppError(
      400,
      "Debes enviar el ID del videojuego"
    );
  }

  validarId(entrada.videojuego);

  // El ObjectId puede ser válido, pero no existir
  const videojuegoExiste = await VideojuegoModel.exists({
    _id: entrada.videojuego
  });

  if (!videojuegoExiste) {
    throw new AppError(
      404,
      "El videojuego referenciado no existe"
    );
  }

  const partida = await PartidaModel.create(entrada);

  return partida;
}

// DELETE /api/partidas/:id
export async function eliminarPartida(id: string) {
  validarId(id);

  const eliminada = await PartidaModel.findByIdAndDelete(id);

  if (!eliminada) {
    throw new AppError(404, "Partida no encontrada");
  }

  return eliminada;
}

// GET /api/videojuegos/:id/partidas
export async function partidasPorVideojuego(id: string) {
  validarId(id);

  const videojuegoExiste = await VideojuegoModel.exists({
    _id: id
  });

  if (!videojuegoExiste) {
    throw new AppError(404, "Videojuego no encontrado");
  }

  return PartidaModel.find({
    videojuego: id
  }).sort({
    fecha: -1,
    createdAt: -1,
    _id: -1
  });
}

// GET /api/videojuegos/:id/resumen
export async function resumenVideojuego(id: string) {
  validarId(id);

  const videojuegoExiste = await VideojuegoModel.exists({
    _id: id
  });

  if (!videojuegoExiste) {
    throw new AppError(404, "Videojuego no encontrado");
  }

  const partidas = await PartidaModel.find({
    videojuego: id
  })
    .sort({
      fecha: -1,
      createdAt: -1,
      _id: -1
    })
    .lean();

  const totalPartidas = partidas.length;

  const minutosTotales = partidas.reduce(
    (acumulado, partida) => {
      return acumulado + partida.duracionMinutos;
    },
    0
  );

  const horasTotales = Number(
    (minutosTotales / 60).toFixed(2)
  );

  const ultimaPartida = partidas[0];

  return {
    totalPartidas,
    horasTotales,
    ultimaPartida: ultimaPartida?.fecha ?? null,
    porcentajeAvanceActual: Math.min(
      100,
      partidas.reduce(
        (acumulado, partida) =>
          acumulado + partida.porcentajeAvance,
        0
      )
    )
  };
}
