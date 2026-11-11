// T-04 · API de metas contra MongoDB en memoria (spec backend §2, R-16 a R-20).
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

async function crearJuego(extra: Record<string, unknown> = {}) {
  const { status, body } = await api.pedir("/videojuegos", {
    method: "POST",
    body: juegoBase(extra)
  });
  assert.equal(status, 201);
  return body._id as string;
}

const metaValida = (videojuego: string, extra: Record<string, unknown> = {}) => ({
  videojuego,
  horasSemanales: 5,
  diasPorSemana: 4,
  hitos: [
    { descripcion: "Llegar al 50 %", porcentajeObjetivo: 50 },
    { descripcion: "Llegar al 25 %", porcentajeObjetivo: 25 }
  ],
  ...extra
});

describe("POST /api/metas", () => {
  test("CA-01.1 crea una meta activa con sus hitos (201)", async () => {
    const juego = await crearJuego();
    const { status, body } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    assert.equal(status, 201);
    assert.equal(body.activa, true);
    assert.equal(body.hitos.length, 2);
    assert.ok(body.createdAt && body.updatedAt);
  });

  test("CA-01.1 un juego pausado también puede tener meta", async () => {
    const juego = await crearJuego({ estado: "pausado" });
    assert.equal(
      (await api.pedir("/metas", { method: "POST", body: metaValida(juego) })).status,
      201
    );
  });

  test("CA-01.2 rechaza horas y días fuera de rango (400)", async () => {
    const juego = await crearJuego();
    for (const extra of [
      { horasSemanales: 0 },
      { horasSemanales: 101 },
      { diasPorSemana: 8 },
      { diasPorSemana: 2.5 },
      { horasSemanales: "5" }
    ]) {
      const { status } = await api.pedir("/metas", {
        method: "POST",
        body: metaValida(juego, extra)
      });
      assert.equal(status, 400, JSON.stringify(extra));
    }
  });

  test("CA-02.2 / CA-02.3 rechaza 6 hitos o un porcentaje de 101 (400)", async () => {
    const juego = await crearJuego();
    const seis = [10, 20, 30, 40, 50, 60].map(n => ({
      descripcion: `Hito ${n}`,
      porcentajeObjetivo: n
    }));
    assert.equal(
      (
        await api.pedir("/metas", {
          method: "POST",
          body: metaValida(juego, { hitos: seis })
        })
      ).status,
      400
    );
    const malo = [{ descripcion: "Imposible", porcentajeObjetivo: 101 }];
    assert.equal(
      (
        await api.pedir("/metas", {
          method: "POST",
          body: metaValida(juego, { hitos: malo })
        })
      ).status,
      400
    );
  });

  test("CA-01.3 una segunda meta activa para el mismo juego responde 409", async () => {
    const juego = await crearJuego();
    await api.pedir("/metas", { method: "POST", body: metaValida(juego) });
    const { status, body } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    assert.equal(status, 409);
    assert.match(body.error.mensaje, /ya tiene una meta activa/);
  });

  test("CA-01.3 dos peticiones simultáneas: solo una se crea, la otra 409", async () => {
    const juego = await crearJuego();
    const respuestas = await Promise.all([
      api.pedir("/metas", { method: "POST", body: metaValida(juego) }),
      api.pedir("/metas", { method: "POST", body: metaValida(juego) })
    ]);
    assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
  });

  test("CA-01.4 un juego completado o abandonado no admite meta (409)", async () => {
    for (const estado of ["completado", "abandonado"]) {
      const juego = await crearJuego({ estado });
      const { status, body } = await api.pedir("/metas", {
        method: "POST",
        body: metaValida(juego)
      });
      assert.equal(status, 409);
      assert.match(body.error.mensaje, new RegExp(estado));
    }
  });

  test("CA-01.5 juego inexistente 404 e id inválido 400", async () => {
    assert.equal(
      (
        await api.pedir("/metas", {
          method: "POST",
          body: metaValida("64b000000000000000000099")
        })
      ).status,
      404
    );
    assert.equal(
      (await api.pedir("/metas", { method: "POST", body: metaValida("abc") })).status,
      400
    );
  });

  test("rechaza campos no permitidos (400)", async () => {
    const juego = await crearJuego();
    assert.equal(
      (
        await api.pedir("/metas", {
          method: "POST",
          body: metaValida(juego, { activa: false, extra: 1 })
        })
      ).status,
      400
    );
  });
});

describe("GET, PUT y PATCH de metas", () => {
  test("GET /api/metas/:id devuelve la meta; 404 y 400", async () => {
    const juego = await crearJuego();
    const { body: meta } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    assert.equal((await api.pedir(`/metas/${meta._id}`)).body._id, meta._id);
    assert.equal((await api.pedir("/metas/64b000000000000000000099")).status, 404);
    assert.equal((await api.pedir("/metas/xyz")).status, 400);
  });

  test("CA-06.1 PUT actualiza horas, días e hitos de la meta activa", async () => {
    const juego = await crearJuego();
    const { body: meta } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    const { status, body } = await api.pedir(`/metas/${meta._id}`, {
      method: "PUT",
      body: {
        horasSemanales: 7,
        diasPorSemana: 5,
        hitos: [{ descripcion: "Final", porcentajeObjetivo: 100 }]
      }
    });
    assert.equal(status, 200);
    assert.equal(body.horasSemanales, 7);
    assert.equal(body.diasPorSemana, 5);
    assert.equal(body.hitos.length, 1);
  });

  test("CA-06.5 PUT no permite cambiar el videojuego ni activa (400); cuerpo vacío 400", async () => {
    const juego = await crearJuego();
    const otro = await crearJuego({ nombre: "Otro juego" });
    const { body: meta } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    assert.equal(
      (
        await api.pedir(`/metas/${meta._id}`, {
          method: "PUT",
          body: { videojuego: otro }
        })
      ).status,
      400
    );
    assert.equal(
      (await api.pedir(`/metas/${meta._id}`, { method: "PUT", body: { activa: true } }))
        .status,
      400
    );
    assert.equal(
      (await api.pedir(`/metas/${meta._id}`, { method: "PUT", body: {} })).status,
      400
    );
    assert.equal(
      (
        await api.pedir(`/metas/${meta._id}`, {
          method: "PUT",
          body: { diasPorSemana: 9 }
        })
      ).status,
      400
    );
  });

  test("CA-06.2 / CA-06.3 desactivar conserva la meta; luego no se edita ni se desactiva (409)", async () => {
    const juego = await crearJuego();
    const { body: meta } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    const desactivada = await api.pedir(`/metas/${meta._id}/desactivar`, {
      method: "PATCH"
    });
    assert.equal(desactivada.status, 200);
    assert.equal(desactivada.body.activa, false);
    assert.equal(
      (await api.pedir(`/metas/${meta._id}/desactivar`, { method: "PATCH" })).status,
      409
    );
    assert.equal(
      (
        await api.pedir(`/metas/${meta._id}`, {
          method: "PUT",
          body: { horasSemanales: 3 }
        })
      ).status,
      409
    );
    // Se puede crear una nueva meta activa después de desactivar
    assert.equal(
      (await api.pedir("/metas", { method: "POST", body: metaValida(juego) })).status,
      201
    );
  });

  test("CA-06.4 GET /api/videojuegos/:id/metas lista la activa primero y el historial", async () => {
    const juego = await crearJuego();
    const { body: vieja } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    await api.pedir(`/metas/${vieja._id}/desactivar`, { method: "PATCH" });
    const { body: nueva } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego, { horasSemanales: 3 })
    });
    const { status, body } = await api.pedir(`/videojuegos/${juego}/metas`);
    assert.equal(status, 200);
    assert.deepEqual(
      body.map((m: { _id: string }) => m._id),
      [nueva._id, vieja._id]
    );
    assert.equal(
      (await api.pedir("/videojuegos/64b000000000000000000099/metas")).status,
      404
    );
  });
});

describe("GET /api/videojuegos/:id/progreso-semanal (T-06)", () => {
  test("CA-03.8 / CA-03.9 sin meta y sin partidas: meta null y todo en 0", async () => {
    const juego = await crearJuego();
    const { status, body } = await api.pedir(`/videojuegos/${juego}/progreso-semanal`);
    assert.equal(status, 200);
    assert.equal(body.meta, null);
    assert.equal(body.porcentajeHoras, null);
    assert.equal(body.metaCumplida, null);
    assert.deepEqual(body.hitos, []);
    assert.equal(body.horasSemana, 0);
    assert.equal(body.diasJugadosSemana, 0);
    assert.equal(body.rachaActual, 0);
    assert.equal(body.mejorRacha, 0);
    assert.equal(body.diasSemana.length, 7);
    assert.match(body.semana.inicio, /^\d{4}-\d{2}-\d{2}$/);
  });

  test("CA-03.2 / CA-05.1 con meta y una partida reciente calcula horas, racha e hitos", async () => {
    const juego = await crearJuego();
    await api.pedir("/metas", { method: "POST", body: metaValida(juego) });
    const hace5Min = new Date(Date.now() - 5 * 60_000).toISOString();
    await api.pedir("/partidas", {
      method: "POST",
      body: {
        videojuego: juego,
        fecha: hace5Min,
        duracionMinutos: 90,
        porcentajeAvance: 30
      }
    });
    const { body } = await api.pedir(`/videojuegos/${juego}/progreso-semanal`);
    assert.deepEqual(
      {
        horasSemanales: body.meta.horasSemanales,
        diasPorSemana: body.meta.diasPorSemana
      },
      { horasSemanales: 5, diasPorSemana: 4 }
    );
    assert.equal(body.horasSemana, 1.5);
    assert.equal(body.porcentajeHoras, 30);
    assert.equal(body.diasJugadosSemana, 1);
    assert.equal(body.rachaActual, 1);
    assert.equal(body.metaCumplida, false);
    assert.deepEqual(
      body.hitos.map((h: { porcentajeObjetivo: number; alcanzado: boolean }) => [
        h.porcentajeObjetivo,
        h.alcanzado
      ]),
      [
        [25, true],
        [50, false]
      ]
    );
  });

  test("CA-03.10 tras editar la meta el porcentaje usa la meta nueva", async () => {
    const juego = await crearJuego();
    const { body: meta } = await api.pedir("/metas", {
      method: "POST",
      body: metaValida(juego)
    });
    await api.pedir("/partidas", {
      method: "POST",
      body: {
        videojuego: juego,
        fecha: new Date(Date.now() - 60_000).toISOString(),
        duracionMinutos: 120,
        porcentajeAvance: 0
      }
    });
    assert.equal(
      (await api.pedir(`/videojuegos/${juego}/progreso-semanal`)).body.porcentajeHoras,
      40
    );
    await api.pedir(`/metas/${meta._id}`, { method: "PUT", body: { horasSemanales: 2 } });
    assert.equal(
      (await api.pedir(`/videojuegos/${juego}/progreso-semanal`)).body.porcentajeHoras,
      100
    );
  });

  test("CA-09.1 / CA-09.2 id inválido 400 y juego inexistente 404", async () => {
    const invalido = await api.pedir("/videojuegos/no-es-un-id/progreso-semanal");
    assert.equal(invalido.status, 400);
    assert.equal(invalido.body.error.statusCode, 400);
    assert.equal(
      (await api.pedir("/videojuegos/64b000000000000000000099/progreso-semanal")).status,
      404
    );
  });

  test("R-24 el resumen de E1 no cambia de forma", async () => {
    const juego = await crearJuego();
    const { body } = await api.pedir(`/videojuegos/${juego}/resumen`);
    assert.deepEqual(Object.keys(body).sort(), [
      "horasTotales",
      "porcentajeAvanceActual",
      "totalPartidas",
      "ultimaPartida"
    ]);
  });
});
