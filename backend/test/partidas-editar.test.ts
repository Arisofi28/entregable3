// D-02 · PUT /api/partidas/:id (spec deuda-tecnica.md, RD-04 a RD-06)
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import { iniciarApi, juegoBase } from "./helpers/api.js";
import type { ContextoApi } from "./helpers/api.js";

let api: ContextoApi;
let juego: string;
let partida: string;

before(async () => {
  api = await iniciarApi();
});
after(async () => {
  await api.cerrar();
});
beforeEach(async () => {
  await api.limpiar();
  juego = (await api.pedir("/videojuegos", { method: "POST", body: juegoBase() })).body
    ._id;
  partida = (
    await api.pedir("/partidas", {
      method: "POST",
      body: {
        videojuego: juego,
        fecha: "2026-11-10T15:00:00.000Z",
        duracionMinutos: 30,
        porcentajeAvance: 40
      }
    })
  ).body._id;
});

const editar = (id: string, body: unknown) =>
  api.pedir(`/partidas/${id}`, { method: "PUT", body });

describe("PUT /api/partidas/:id", () => {
  test("CA-D02.1 guarda fecha, duración, avance y notas", async () => {
    const { status, body } = await editar(partida, {
      fecha: "2026-11-11T01:00:00.000Z",
      duracionMinutos: 90,
      porcentajeAvance: 20,
      notas: "Jefe final"
    });
    assert.equal(status, 200);
    assert.equal(body.duracionMinutos, 90);
    assert.equal(body.porcentajeAvance, 20);
    assert.equal(body.notas, "Jefe final");
    assert.equal(body.fecha, "2026-11-11T01:00:00.000Z");
  });

  test("CA-D02.1 / CA-05.2 editar el avance cambia el resumen y los hitos", async () => {
    await api.pedir("/metas", {
      method: "POST",
      body: {
        videojuego: juego,
        horasSemanales: 5,
        diasPorSemana: 3,
        hitos: [{ descripcion: "Mitad", porcentajeObjetivo: 30 }]
      }
    });
    assert.equal(
      (await api.pedir(`/videojuegos/${juego}/progreso-semanal`)).body.hitos[0].alcanzado,
      true
    );
    await editar(partida, { porcentajeAvance: 10 });
    assert.equal(
      (await api.pedir(`/videojuegos/${juego}/resumen`)).body.porcentajeAvanceActual,
      10
    );
    assert.equal(
      (await api.pedir(`/videojuegos/${juego}/progreso-semanal`)).body.hitos[0].alcanzado,
      false
    );
  });

  test("CA-D02.1 aplica las mismas validaciones que al crear (400)", async () => {
    for (const cuerpo of [
      { porcentajeAvance: 101 },
      { porcentajeAvance: "20" },
      { duracionMinutos: 0 },
      { duracionMinutos: 2.5 },
      { fecha: "no-es-fecha" },
      { notas: "x".repeat(501) }
    ]) {
      assert.equal(
        (await editar(partida, cuerpo)).status,
        400,
        JSON.stringify(cuerpo).slice(0, 40)
      );
    }
  });

  test("CA-D02.2 no permite cambiar el videojuego ni campos desconocidos; cuerpo vacío 400", async () => {
    const otro = (
      await api.pedir("/videojuegos", {
        method: "POST",
        body: juegoBase({ nombre: "Otro" })
      })
    ).body._id;
    assert.equal((await editar(partida, { videojuego: otro })).status, 400);
    assert.equal((await editar(partida, { extra: true })).status, 400);
    assert.equal((await editar(partida, {})).status, 400);
  });

  test("RD-06 id inválido 400 y partida inexistente 404", async () => {
    assert.equal((await editar("abc", { duracionMinutos: 10 })).status, 400);
    assert.equal(
      (await editar("64b000000000000000000099", { duracionMinutos: 10 })).status,
      404
    );
  });
});
