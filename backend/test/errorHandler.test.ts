// T-05 · El errorHandler distingue 400, 404, 409 y 500 (R-23).
import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import { errorHandler } from "../src/middlewares/errorHandler.js";
import { AppError } from "../src/middlewares/AppError.js";

function responder(error: unknown) {
  const salida: {
    status?: number;
    body?: { error: { mensaje: string; statusCode: number } };
  } = {};
  const res = {
    locals: { requestId: "test" },
    status(codigo: number) {
      salida.status = codigo;
      return this;
    },
    json(cuerpo: typeof salida.body) {
      salida.body = cuerpo;
      return this;
    }
  } as unknown as Response;
  const original = console.error;
  console.error = () => {};
  try {
    errorHandler(error, {} as Request, res, (() => {}) as NextFunction);
  } finally {
    console.error = original;
  }
  return salida;
}

test("400 por validación de Mongoose", () => {
  const error = new mongoose.Error.ValidationError();
  error.addError(
    "x",
    new mongoose.Error.ValidatorError({ message: "x inválido", path: "x" })
  );
  assert.equal(responder(error).status, 400);
});

test("404 y 409 desde AppError conservan su código y mensaje", () => {
  assert.equal(responder(new AppError(404, "No existe")).status, 404);
  const conflicto = responder(new AppError(409, "Conflicto"));
  assert.equal(conflicto.status, 409);
  assert.equal(conflicto.body?.error.mensaje, "Conflicto");
});

test("CA-01.3 409 por clave duplicada del índice de metas activas", () => {
  const salida = responder({ code: 11000, keyPattern: { videojuego: 1 } });
  assert.equal(salida.status, 409);
  assert.match(salida.body?.error.mensaje ?? "", /ya tiene una meta activa/);
  assert.equal(salida.body?.error.statusCode, 409);
});

test("500 ante un error inesperado, sin filtrar el detalle", () => {
  const salida = responder(new Error("detalle interno"));
  assert.equal(salida.status, 500);
  assert.equal(salida.body?.error.mensaje, "Error interno del servidor");
});
