import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/arcade-test";

const [{ default: app }, { PartidaModel }, { VideojuegoModel }] =
  await Promise.all([
    import("../dist/app.js"),
    import("../dist/models/Partida.js"),
    import("../dist/models/Videojuego.js")
  ]);

const gameA = "64b000000000000000000001";
const gameB = "64b000000000000000000002";
const emptyGame = "64b000000000000000000003";
const session20 = "64b000000000000000000011";
const session15 = "64b000000000000000000012";
const session70 = "64b000000000000000000021";
const session50 = "64b000000000000000000022";

function session(_id, videojuego, porcentajeAvance, duracionMinutos, fecha) {
  return {
    _id,
    videojuego,
    porcentajeAvance,
    duracionMinutos,
    fecha: new Date(fecha)
  };
}

test("session API summarizes cumulative progress per game", async () => {
  const sessions = [
    session(session20, gameA, 20, 60, "2026-10-01T10:00:00.000Z"),
    session(session15, gameA, 15, 30, "2026-10-02T10:00:00.000Z"),
    session(session70, gameB, 70, 90, "2026-10-01T10:00:00.000Z"),
    session(session50, gameB, 50, 30, "2026-10-02T10:00:00.000Z")
  ];
  const validGames = new Set([gameA, gameB, emptyGame]);
  const originalFind = PartidaModel.find;
  const originalCreate = PartidaModel.create;
  const originalFindByIdAndDelete = PartidaModel.findByIdAndDelete;
  const originalExists = VideojuegoModel.exists;
  let nextSessionId = 31;

  VideojuegoModel.exists = async ({ _id }) =>
    validGames.has(String(_id));
  PartidaModel.find = filter => ({
    sort() {
      return this;
    },
    async lean() {
      return sessions.filter(
        item => item.videojuego === String(filter.videojuego)
      );
    }
  });
  PartidaModel.create = async data => {
    const created = {
      ...data,
      _id: `64b0000000000000000000${nextSessionId++}`,
      fecha: new Date(data.fecha)
    };
    sessions.push(created);
    return created;
  };
  PartidaModel.findByIdAndDelete = async id => {
    const index = sessions.findIndex(item => item._id === String(id));
    if (index < 0) return null;
    return sessions.splice(index, 1)[0];
  };

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function getSummary(id) {
    const response = await fetch(
      `${baseUrl}/api/videojuegos/${id}/resumen`
    );
    assert.equal(response.status, 200);
    return response.json();
  }

  try {
    const initial = await getSummary(gameA);
    assert.equal(initial.porcentajeAvanceActual, 35);
    assert.equal(initial.totalPartidas, 2);
    assert.equal(initial.horasTotales, 1.5);

    assert.equal(
      (await getSummary(gameB)).porcentajeAvanceActual,
      100
    );
    assert.equal(
      (await getSummary(emptyGame)).porcentajeAvanceActual,
      0
    );

    const deleteResponse = await fetch(
      `${baseUrl}/api/partidas/${session15}`,
      { method: "DELETE" }
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(
      (await getSummary(gameA)).porcentajeAvanceActual,
      20
    );

    const createResponse = await fetch(
      `${baseUrl}/api/partidas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videojuego: gameA,
          fecha: "2026-10-03T10:00:00.000Z",
          duracionMinutos: 30,
          porcentajeAvance: 15
        })
      }
    );
    assert.equal(createResponse.status, 201);
    assert.equal(
      (await getSummary(gameA)).porcentajeAvanceActual,
      35
    );

    const add30Response = await fetch(
      `${baseUrl}/api/partidas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videojuego: gameA,
          fecha: "2026-10-04T10:00:00.000Z",
          duracionMinutos: 30,
          porcentajeAvance: 30
        })
      }
    );
    assert.equal(add30Response.status, 201);
    assert.equal(
      (await getSummary(gameA)).porcentajeAvanceActual,
      65
    );

    const added15Id = sessions.find(
      item => item.videojuego === gameA && item.porcentajeAvance === 15
    )._id;
    const deleteAdded15 = await fetch(
      `${baseUrl}/api/partidas/${added15Id}`,
      { method: "DELETE" }
    );
    assert.equal(deleteAdded15.status, 204);
    assert.equal(
      (await getSummary(gameA)).porcentajeAvanceActual,
      50
    );
    assert.equal(
      (await getSummary(gameB)).porcentajeAvanceActual,
      100
    );

    for (const invalidProgress of [-1, 101, "20", null]) {
      const invalidResponse = await fetch(
        `${baseUrl}/api/partidas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videojuego: gameA,
            fecha: "2026-10-05T10:00:00.000Z",
            duracionMinutos: 30,
            porcentajeAvance: invalidProgress
          })
        }
      );
      assert.equal(invalidResponse.status, 400);
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    PartidaModel.find = originalFind;
    PartidaModel.create = originalCreate;
    PartidaModel.findByIdAndDelete = originalFindByIdAndDelete;
    VideojuegoModel.exists = originalExists;
  }
});
