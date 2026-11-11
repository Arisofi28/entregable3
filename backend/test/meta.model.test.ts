// T-03 · Validaciones del modelo Meta, sin base de datos (validateSync).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { MetaModel } from "../src/models/Meta.js";

const VIDEOJUEGO = "64b000000000000000000001";

function errores(datos: Record<string, unknown>) {
  const error = new MetaModel({ videojuego: VIDEOJUEGO, ...datos }).validateSync();
  return error ? Object.keys(error.errors) : [];
}

const hito = (porcentajeObjetivo: number, descripcion = "Llegar a la meta") => ({
  descripcion,
  porcentajeObjetivo
});

describe("Meta · horas y días (CA-01.2)", () => {
  test("una meta válida no tiene errores y queda activa por defecto", () => {
    const meta = new MetaModel({
      videojuego: VIDEOJUEGO,
      horasSemanales: 5,
      diasPorSemana: 4
    });
    assert.equal(meta.validateSync(), undefined);
    assert.equal(meta.activa, true);
    assert.deepEqual(meta.hitos.length, 0);
  });

  test("acepta horas con decimales y el máximo de 100", () => {
    assert.deepEqual(errores({ horasSemanales: 2.5, diasPorSemana: 1 }), []);
    assert.deepEqual(errores({ horasSemanales: 100, diasPorSemana: 7 }), []);
  });

  for (const horasSemanales of [0, -1, 100.5, 101]) {
    test(`rechaza ${horasSemanales} horas por semana`, () => {
      assert.ok(errores({ horasSemanales, diasPorSemana: 4 }).includes("horasSemanales"));
    });
  }

  for (const diasPorSemana of [0, 8, 2.5]) {
    test(`rechaza ${diasPorSemana} días por semana`, () => {
      assert.ok(errores({ horasSemanales: 5, diasPorSemana }).includes("diasPorSemana"));
    });
  }

  test("exige videojuego, horas y días", () => {
    const error = new MetaModel({}).validateSync();
    assert.ok(error);
    assert.deepEqual(Object.keys(error.errors).sort(), [
      "diasPorSemana",
      "horasSemanales",
      "videojuego"
    ]);
  });
});

describe("Meta · hitos (CA-02.x)", () => {
  test("CA-02.1 acepta 5 hitos válidos", () => {
    assert.deepEqual(
      errores({
        horasSemanales: 5,
        diasPorSemana: 4,
        hitos: [1, 25, 50, 75, 100].map(n => hito(n))
      }),
      []
    );
  });

  test("CA-02.2 rechaza un sexto hito", () => {
    assert.ok(
      errores({
        horasSemanales: 5,
        diasPorSemana: 4,
        hitos: [10, 20, 30, 40, 50, 60].map(n => hito(n))
      }).includes("hitos")
    );
  });

  test("CA-02.3 rechaza porcentaje 0 o 101", () => {
    assert.ok(
      errores({ horasSemanales: 5, diasPorSemana: 4, hitos: [hito(0)] }).includes(
        "hitos.0.porcentajeObjetivo"
      )
    );
    assert.ok(
      errores({ horasSemanales: 5, diasPorSemana: 4, hitos: [hito(101)] }).includes(
        "hitos.0.porcentajeObjetivo"
      )
    );
  });

  test("CA-02.3 rechaza un hito sin descripción", () => {
    assert.ok(
      errores({ horasSemanales: 5, diasPorSemana: 4, hitos: [hito(50, "  ")] }).includes(
        "hitos.0.descripcion"
      )
    );
  });
});

describe("Meta · una activa por videojuego (RN-01)", () => {
  test("declara un índice único parcial sobre las metas activas", () => {
    const indice = MetaModel.schema
      .indexes()
      .find(([campos]) => JSON.stringify(campos) === JSON.stringify({ videojuego: 1 }));
    assert.ok(indice);
    assert.equal(indice[1].unique, true);
    assert.deepEqual(indice[1].partialFilterExpression, { activa: true });
  });
});
