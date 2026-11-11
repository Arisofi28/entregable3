import mongoose from "mongoose";
import { VideojuegoModel } from "../models/Videojuego.js";
import { MetaModel } from "../models/Meta.js";
import { AppError } from "../middlewares/AppError.js";

// Estados que no admiten meta activa (E2 · RN-13)
const ESTADOS_SIN_META = ["completado", "abandonado"];

// VALIDAR OBJECTID
export function validarId(id: string): void {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError(400, "El identificador tiene un formato inválido");
  }
}

// VALIDAR JSON
function validarObjeto(datos: unknown): asserts datos is Record<string, unknown> {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new AppError(400, "Debes enviar un objeto JSON válido");
  }
}

// VALIDAR CAMPOS PERMITIDOS
function validarCampos(datos: Record<string, unknown>): void {
  const permitidos = ["nombre", "plataforma", "genero", "estado", "logros"];

  const incorrectos = Object.keys(datos).filter(campo => !permitidos.includes(campo));

  if (incorrectos.length > 0) {
    throw new AppError(400, `Campos no permitidos: ${incorrectos.join(", ")}`);
  }
}

// 1. LISTAR VIDEOJUEGOS

export async function listarVideojuegos(estado?: string) {
  const estadosValidos = ["jugando", "pausado", "completado", "abandonado"] as const;

  type EstadoValido = (typeof estadosValidos)[number];

  // Validar el estado recibido
  if (estado && !estadosValidos.includes(estado as EstadoValido)) {
    throw new AppError(400, "El filtro estado no es válido");
  }

  // Si existe un filtro, buscar por estado
  if (estado) {
    return VideojuegoModel.find({
      estado: estado as EstadoValido
    }).sort({ createdAt: -1 });
  }

  // Sin filtro, devolver todos los videojuegos
  return VideojuegoModel.find().sort({ createdAt: -1 });
}

// 2. OBTENER VIDEOJUEGO POR ID
export async function obtenerVideojuego(id: string) {
  validarId(id);

  const videojuego = await VideojuegoModel.findById(id);

  if (!videojuego) {
    throw new AppError(404, "Videojuego no encontrado");
  }

  return videojuego;
}

// 3. CREAR VIDEOJUEGO
export async function crearVideojuego(datos: unknown) {
  validarObjeto(datos);
  validarCampos(datos);

  return VideojuegoModel.create(datos);
}

// 4. ACTUALIZAR VIDEOJUEGO
export async function actualizarVideojuego(id: string, datos: unknown) {
  validarId(id);
  validarObjeto(datos);
  validarCampos(datos);

  if (Object.keys(datos).length === 0) {
    throw new AppError(400, "Debes enviar al menos un campo");
  }

  const videojuego = await obtenerVideojuego(id);

  videojuego.set(datos);

  await videojuego.save();

  // E2 · RN-13: un juego completado o abandonado no conserva meta activa
  if (ESTADOS_SIN_META.includes(videojuego.estado)) {
    await MetaModel.updateMany(
      { videojuego: videojuego._id, activa: true },
      { $set: { activa: false } }
    );
  }

  return videojuego;
}

// 5. ELIMINAR VIDEOJUEGO
export async function eliminarVideojuego(id: string) {
  validarId(id);

  const videojuego = await VideojuegoModel.findByIdAndDelete(id);

  if (!videojuego) {
    throw new AppError(404, "Videojuego no encontrado");
  }

  // E2 · RN-14: no quedan metas huérfanas (con sus hitos embebidos)
  await MetaModel.deleteMany({ videojuego: videojuego._id });

  return videojuego;
}

// 6. ACTUALIZAR LOGRO EMBEBIDO
export async function actualizarLogro(
  videojuegoId: string,
  logroId: string,
  obtenido: unknown
) {
  validarId(videojuegoId);
  validarId(logroId);

  if (typeof obtenido !== "boolean") {
    throw new AppError(400, "El campo obtenido debe ser boolean");
  }

  const videojuego = await obtenerVideojuego(videojuegoId);

  const logro = videojuego.logros.find(item => String(item._id) === logroId);

  if (!logro) {
    throw new AppError(404, "Logro no encontrado");
  }

  logro.obtenido = obtenido;

  await videojuego.save();

  return videojuego;
}
