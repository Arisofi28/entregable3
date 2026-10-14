import assert from "node:assert/strict";
import {
  gameSummary,
  librarySummary,
  seedGames,
  todayISO,
  type Game
} from "../src/data/library.ts";
import { interpret, suggest, tokenize } from "../src/data/interpret.ts";

const seed = seedGames();

function play(commands: string[], start: Game[] = seedGames()) {
  let games = start;
  let activeGameId: string | null = null;
  let last = interpret("", { games, activeGameId });

  for (const command of commands) {
    last = interpret(command, { games, activeGameId });
    if (last.games) games = last.games;
    if (last.activeGameId !== undefined) activeGameId = last.activeGameId;
  }

  return { games, activeGameId, last };
}

function textOf(lines: { text: string }[]): string {
  return lines.map(line => line.text).join("\n");
}

const summary = librarySummary(seed);
assert.equal(summary.totalPartidas, 8);
assert.equal(summary.horasTotales, 14.5);
assert.equal(summary.ultimaPartida, "2026-10-09");
assert.equal(summary.porcentajeAvanceActual, 85);
assert.equal(summary.juegoActual, "Cosmic Battle");

assert.equal(gameSummary(seed[0]).porcentajeAvanceActual, 67);
assert.equal(gameSummary(seed[0]).horasTotales, 6);

const tied: Game = {
  ...seed[0],
  sessions: [
    {
      id: "a",
      date: "2026-10-02",
      minutes: 10,
      progress: 90,
      notes: "",
      createdAt: 1
    },
    {
      id: "b",
      date: "2026-10-02",
      minutes: 10,
      progress: 10,
      notes: "",
      createdAt: 2
    }
  ]
};
assert.equal(gameSummary(tied).porcentajeAvanceActual, 10);

const empty = gameSummary({ ...seed[0], sessions: [] });
assert.equal(empty.totalPartidas, 0);
assert.equal(empty.horasTotales, 0);
assert.equal(empty.ultimaPartida, null);
assert.equal(empty.porcentajeAvanceActual, 0);

assert.deepEqual(tokenize('new "Hollow Knight" Switch accion'), [
  "new",
  "Hollow Knight",
  "Switch",
  "accion"
]);

const ambiguous = interpret("open a", { games: seed, activeGameId: null });
assert.equal(ambiguous.lines[0]?.tone, "error");
assert.match(textOf(ambiguous.lines), /Pixel Adventure/);
assert.match(textOf(ambiguous.lines), /Cosmic Battle/);
assert.equal(ambiguous.activeGameId, undefined);

const opened = play(["open pixel"]);
assert.equal(opened.activeGameId, "pixel-adventure");
assert.match(textOf(opened.last.lines), /PIXEL ADVENTURE/);
assert.match(textOf(opened.last.lines), /67%/);

const logged = play([
  "open pixel",
  "log 2026-09-01 30 15 nota antigua"
]);
const pixel = logged.games.find(game => game.id === "pixel-adventure");
assert.ok(pixel);
assert.equal(gameSummary(pixel).porcentajeAvanceActual, 67);
assert.equal(gameSummary(pixel).totalPartidas, 4);
assert.equal(pixel.sessions.at(-1)?.date, "2026-09-01");
assert.equal(pixel.sessions.at(-1)?.notes, "nota antigua");

const current = play(["open cosmic", "log 20 91% oleada extra"]);
const cosmic = current.games.find(game => game.id === "cosmic-battle");
assert.ok(cosmic);
assert.equal(cosmic.sessions.at(-1)?.date, todayISO());
assert.equal(gameSummary(cosmic).porcentajeAvanceActual, 91);
assert.equal(librarySummary(current.games).juegoActual, "Cosmic Battle");
assert.equal(librarySummary(current.games).porcentajeAvanceActual, 91);

const invalid = play(["open pixel", "log 0 10"]);
assert.match(textOf(invalid.last.lines), /mayor que 0/);
assert.equal(
  invalid.games.find(game => game.id === "pixel-adventure")?.sessions.length,
  3
);

const over = play(["open pixel", "log 10 101"]);
assert.match(textOf(over.last.lines), /0 y 100/);

const badDate = play(["open pixel", "log 2026-13-40 10 10"]);
assert.match(textOf(badDate.last.lines), /fecha/i);

const achieved = play([
  "open pixel",
  "achieve Jefe del nivel 4",
  "achieve jefe del nivel 4"
]);
const pixelAchievements = achieved.games
  .find(game => game.id === "pixel-adventure")
  ?.achievements ?? [];
const boss = pixelAchievements.find(item => item.id === "pa-2");
assert.equal(boss?.obtained, false);
assert.match(textOf(achieved.last.lines), /pendiente/i);

const created = play(["open forest", 'achieve "Río escondido"']);
const forest = created.games.find(game => game.id === "forest-quest");
assert.equal(
  forest?.achievements.some(item => item.name === "Río escondido" && item.obtained),
  true
);

const status = play(["open forest", "status jugando"]);
assert.equal(
  status.games.find(game => game.id === "forest-quest")?.status,
  "jugando"
);

const added = play(['new "Hollow Knight" Switch accion']);
assert.equal(added.games.length, 4);
assert.equal(added.activeGameId, added.games[3]?.id);
assert.equal(added.games[3]?.platform, "Switch");
assert.equal(added.games[3]?.genre, "Acción");
assert.equal(added.games[3]?.status, "jugando");

const duplicate = play(['new "pixel adventure" PC rol']);
assert.equal(duplicate.last.lines[0]?.tone, "error");
assert.equal(duplicate.games.length, 3);

const restored = play([
  'new "Hollow Knight" PC rol',
  "reset"
]);
assert.equal(restored.games.length, 3);
assert.equal(restored.activeGameId, null);
assert.equal(restored.games[1]?.status, "pausado");

const cleared = interpret("clear", { games: seed, activeGameId: null });
assert.equal(cleared.clear, true);

const unknown = interpret("fly", { games: seed, activeGameId: null });
assert.match(textOf(unknown.lines), /help/);

const listed = interpret("ls", { games: seed, activeGameId: "pixel-adventure" });
assert.match(textOf(listed.lines), /▸ Pixel Adventure/);
assert.match(textOf(listed.lines), /Forest Quest/);

assert.equal(suggest("op", seed).next, "open ");
assert.equal(suggest("open pix", seed).next, 'open "Pixel Adventure" ');
assert.equal(suggest("sta", seed).next, "status ");
assert.equal(suggest("status com", seed).next, "status completado ");

console.log("interpret tests passed");
