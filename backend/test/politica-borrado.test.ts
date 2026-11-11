// T-07 · Política de Videojuego → Meta (R-21, R-22). D-01 agrega las partidas.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import { iniciarApi, juegoBase } from "./helpers/api.js";
import type { ContextoApi } from "./helpers/api.js";

let api: ContextoApi;

before(async () => {
  api = await iniciarApi();
});
after(async () => {
  await api.cerrar();
});
beforeEach(async () => {
  await api.limpiar();
});

async function crearJuego(nombre = "Juego A") {
  return (
    await api.pedir("/videojuegos", { method: "POST", body: juegoBase({ nombre }) })
  ).body._id as string;
}

async function crearMeta(videojuego: string) {
  return (
    await api.pedir("/metas", {
      method: "POST",
      body: {
        videojuego,
        horasSemanales: 5,
        diasPorSemana: 4,
        hitos: [{ descripcion: "Mitad", porcentajeObjetivo: 50 }]
      }
    })
  ).body._id as string;
}

describe("eliminar un videojuego (RN-14)", () => {
  test("CA-07.1 elimina todas sus metas, activa e históricas, y no toca las de otros juegos", async () => {
    const juegoA = await crearJuego("Juego A");
    const juegoB = await crearJuego("Juego B");
    const historica = await crearMeta(juegoA);
    await api.pedir(`/metas/${historica}/desactivar`, { method: "PATCH" });
    const activa = await crearMeta(juegoA);
    const otra = await crearMeta(juegoB);

    assert.equal(
      (await api.pedir(`/videojuegos/${juegoA}`, { method: "DELETE" })).status,
      204
    );

    assert.equal((await api.pedir(`/metas/${historica}`)).status, 404);
    assert.equal((await api.pedir(`/metas/${activa}`)).status, 404);
    assert.equal((await api.pedir(`/metas/${otra}`)).status, 200);
  });

  test("CA-07.1 con id inválido o juego inexistente no borra nada", async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego);
    assert.equal((await api.pedir("/videojuegos/abc", { method: "DELETE" })).status, 400);
    assert.equal(
      (await api.pedir("/videojuegos/64b000000000000000000099", { method: "DELETE" }))
        .status,
      404
    );
    assert.equal((await api.pedir(`/metas/${meta}`)).status, 200);
  });
});

describe("cambiar el estado de un videojuego (RN-13)", () => {
  for (const estado of ["completado", "abandonado"]) {
    test(`CA-07.2 pasar a ${estado} desactiva la meta y la conserva en el historial`, async () => {
      const juego = await crearJuego();
      const meta = await crearMeta(juego);
      assert.equal(
        (await api.pedir(`/videojuegos/${juego}`, { method: "PUT", body: { estado } }))
          .status,
        200
      );
      const { status, body } = await api.pedir(`/metas/${meta}`);
      assert.equal(status, 200);
      assert.equal(body.activa, false);
      assert.equal(
        (await api.pedir(`/videojuegos/${juego}/progreso-semanal`)).body.meta,
        null
      );
    });
  }

  test("pasar a pausado mantiene la meta activa", async () => {
    const juego = await crearJuego();
    const meta = await crearMeta(juego);
    await api.pedir(`/videojuegos/${juego}`, {
      method: "PUT",
      body: { estado: "pausado" }
    });
    assert.equal((await api.pedir(`/metas/${meta}`)).body.activa, true);
  });
});
