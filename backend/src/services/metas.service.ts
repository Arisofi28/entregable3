import { MetaModel } from "../models/Meta.js";
import { VideojuegoModel } from "../models/Videojuego.js";
import { AppError } from "../middlewares/AppError.js";
import { validarId } from "./videojuegos.service.js";

// T-04 · CRUD de Meta. Spec backend §2 y reglas R-15 a R-22.

const CAMPOS_CREAR = ["videojuego", "horasSemanales", "diasPorSemana", "hitos"];
const CAMPOS_ACTUALIZAR = ["horasSemanales", "diasPorSemana", "hitos"];
const ESTADOS_SIN_META = ["completado", "abandonado"];

const MENSAJE_META_DUPLICADA =
  "Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra.";

function validarObjeto(datos: unknown): asserts datos is Record<string, unknown> {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new AppError(400, "Debes enviar un objeto JSON válido");
  }
}

function validarCampos(datos: Record<string, unknown>, permitidos: string[]): void {
  const incorrectos = Object.keys(datos).filter(campo => !permitidos.includes(campo));
  if (incorrectos.length > 0) {
    throw new AppError(400, `Campos no permitidos: ${incorrectos.join(", ")}`);
  }
}

// Evita que Mongoose convierta "5" en 5: horas y días deben llegar como números
function validarNumeros(datos: Record<string, unknown>): void {
  for (const campo of ["horasSemanales", "diasPorSemana"]) {
    if (
      campo in datos &&
      (typeof datos[campo] !== "number" || !Number.isFinite(datos[campo]))
    ) {
      throw new AppError(400, `El campo ${campo} debe ser un número`);
    }
  }
  if ("hitos" in datos && !Array.isArray(datos.hitos)) {
    throw new AppError(400, "El campo hitos debe ser una lista");
  }
}

export async function obtenerMeta(id: string) {
  validarId(id);
  const meta = await MetaModel.findById(id);
  if (!meta) {
    throw new AppError(404, "Meta no encontrada");
  }
  return meta;
}

// POST /api/metas
export async function crearMeta(datos: unknown) {
  validarObjeto(datos);
  validarCampos(datos, CAMPOS_CREAR);
  validarNumeros(datos);

  if (typeof datos.videojuego !== "string") {
    throw new AppError(400, "Debes enviar el ID del videojuego");
  }
  validarId(datos.videojuego);

  const videojuego = await VideojuegoModel.findById(datos.videojuego)
    .select("estado")
    .lean();
  if (!videojuego) {
    throw new AppError(404, "El videojuego referenciado no existe");
  }

  // RN-13
  if (ESTADOS_SIN_META.includes(videojuego.estado)) {
    throw new AppError(
      409,
      `No se puede crear una meta para un videojuego ${videojuego.estado}. Cambia su estado a jugando o pausado.`
    );
  }

  // RN-01 (el índice único parcial cubre además las peticiones concurrentes)
  const activa = await MetaModel.exists({ videojuego: datos.videojuego, activa: true });
  if (activa) {
    throw new AppError(409, MENSAJE_META_DUPLICADA);
  }

  return MetaModel.create(datos);
}

// GET /api/videojuegos/:id/metas — activa primero, luego las más recientes
export async function listarMetasDeVideojuego(videojuegoId: string) {
  validarId(videojuegoId);
  const existe = await VideojuegoModel.exists({ _id: videojuegoId });
  if (!existe) {
    throw new AppError(404, "Videojuego no encontrado");
  }
  return MetaModel.find({ videojuego: videojuegoId }).sort({
    activa: -1,
    createdAt: -1,
    _id: -1
  });
}

// PUT /api/metas/:id
export async function actualizarMeta(id: string, datos: unknown) {
  validarId(id);
  validarObjeto(datos);
  if ("videojuego" in datos || "activa" in datos) {
    // RN-21 y RN-17
    throw new AppError(
      400,
      "No se puede cambiar el videojuego ni el estado activo de una meta. Usa desactivar o crea una meta nueva."
    );
  }
  validarCampos(datos, CAMPOS_ACTUALIZAR);
  validarNumeros(datos);
  if (Object.keys(datos).length === 0) {
    throw new AppError(400, "Debes enviar al menos un campo");
  }

  const meta = await obtenerMeta(id);
  if (!meta.activa) {
    throw new AppError(
      409,
      "La meta está desactivada y ya no se puede editar. Crea una meta nueva."
    );
  }

  meta.set(datos);
  await meta.save();
  return meta;
}

// PATCH /api/metas/:id/desactivar
export async function desactivarMeta(id: string) {
  const meta = await obtenerMeta(id);
  if (!meta.activa) {
    throw new AppError(409, "La meta ya está desactivada");
  }
  meta.activa = false;
  await meta.save();
  return meta;
}
