
import mongoose from "mongoose";
import type { ErrorRequestHandler } from "express";
import { AppError } from "./AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next
) => {
  let statusCode = 500;
  let mensaje = "Error interno del servidor";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    mensaje = error.message;
  }

  else if (
    error instanceof mongoose.Error.ValidationError
  ) {
    statusCode = 400;

    mensaje = Object.values(error.errors)
      .map(err => err.message)
      .join(", ");
  }

  else if (
    error instanceof mongoose.Error.CastError
  ) {
    statusCode = 400;
    mensaje = "Formato de dato inválido";
  }

  else if (
    error instanceof mongoose.Error.StrictModeError
  ) {
    statusCode = 400;
    mensaje = "Se recibieron campos no permitidos";
  }

  else if (
    error instanceof SyntaxError &&
    "body" in error
  ) {
    statusCode = 400;
    mensaje = "JSON mal formado";
  }

  console.error(
    `[${res.locals.requestId}]`,
    error
  );

  res.status(statusCode).json({
    error: {
      mensaje,
      statusCode,
      requestId: res.locals.requestId
    }
  });
};
