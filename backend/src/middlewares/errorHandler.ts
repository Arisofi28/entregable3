import mongoose from "mongoose";
import type { ErrorRequestHandler } from "express";
import { AppError } from "./AppError.js";

interface ErrorClaveDuplicada {
  code: 11000;
  keyPattern?: Record<string, unknown>;
}

function esClaveDuplicada(error: unknown): error is ErrorClaveDuplicada {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

const MENSAJES_CLAVE_DUPLICADA: Record<string, string> = {
  videojuego:
    "Este videojuego ya tiene una meta activa. Edítala o desactívala antes de crear otra."
};

// Distingue 400 (validación), 404 (no encontrado), 409 (conflicto) y 500 (inesperado)
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let statusCode = 500;
  let mensaje = "Error interno del servidor";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    mensaje = error.message;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;

    mensaje = Object.values(error.errors)
      .map(err => err.message)
      .join(", ");
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    mensaje = "Formato de dato inválido";
  } else if (error instanceof mongoose.Error.StrictModeError) {
    statusCode = 400;
    mensaje = "Se recibieron campos no permitidos";
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    mensaje = "JSON mal formado";
  }

  // 409: índice único violado (por ejemplo, dos metas activas para el mismo videojuego)
  else if (esClaveDuplicada(error)) {
    statusCode = 409;
    mensaje =
      MENSAJES_CLAVE_DUPLICADA[
        error.keyPattern ? Object.keys(error.keyPattern).join(",") : ""
      ] ?? "El recurso entra en conflicto con uno existente";
  }

  console.error(`[${res.locals.requestId}]`, error);

  res.status(statusCode).json({
    error: {
      mensaje,
      statusCode,
      requestId: res.locals.requestId
    }
  });
};
