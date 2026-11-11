// T-01 · Tests de las funciones puras de dominio (spec backend §3 y §4).
// Cada test nombra el criterio de aceptación que verifica.
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  calcularAvanceActual,
  calcularHorasSemana,
  calcularPorcentajeHoras,
  calcularProgresoSemanal,
  calcularRachas,
  contarDiasJugados,
  esMetaCumplida,
  evaluarHitos,
  fechaLocal,
  semanaDe
} from "../src/dominio/progreso.js";
import type { MetaDominio, PartidaDominio } from "../src/dominio/progreso.js";

// Fecha y hora expresadas en hora de Ecuador (UTC-5, sin horario de verano)
const ec = (fechaHora: string) => new Date(`${fechaHora}-05:00`);

const p = (
  fechaHora: string,
  duracionMinutos = 60,
  porcentajeAvance = 0
): PartidaDominio => ({
  fecha: ec(fechaHora),
  duracionMinutos,
  porcentajeAvance
});

// "Hoy": miércoles 11 de noviembre de 2026, 12:00 en Ecuador
const AHORA = ec("2026-11-11T12:00:00");
const SEMANA = { inicio: "2026-11-09", fin: "2026-11-15" };

const meta = (
  horasSemanales: number,
  diasPorSemana: number,
  hitos: MetaDominio["hitos"] = []
) => ({
  horasSemanales,
  diasPorSemana,
  hitos
});

describe("semana y días en hora de Ecuador", () => {
  test("CA-03.1 un miércoles la semana va del lunes al domingo", () => {
    assert.deepEqual(semanaDe(AHORA), SEMANA);
  });

  test("CA-03.1 lunes 00:00 y domingo 23:59 en Ecuador pertenecen a la misma semana", () => {
    assert.deepEqual(semanaDe(ec("2026-11-09T00:00:00")), SEMANA);
    assert.deepEqual(semanaDe(ec("2026-11-15T23:59:00")), SEMANA);
  });

  test("CA-03.1 domingo 23:30 en Ecuador ya es lunes en UTC, pero sigue siendo domingo", () => {
    const fecha = ec("2026-11-15T23:30:00");
    assert.equal(fecha.toISOString(), "2026-11-16T04:30:00.000Z");
    assert.equal(fechaLocal(fecha), "2026-11-15");
  });

  test("CA-03.1 la semana cruza el cambio de mes y de año", () => {
    assert.deepEqual(semanaDe(ec("2026-12-31T10:00:00")), {
      inicio: "2026-12-28",
      fin: "2027-01-03"
    });
  });
});

describe("horas y porcentaje de la semana", () => {
  test("CA-03.2 90 + 120 minutos son 3.5 horas", () => {
    const partidas = [p("2026-11-09T10:00:00", 90), p("2026-11-10T18:00:00", 120)];
    assert.equal(calcularHorasSemana(partidas, SEMANA, AHORA).horas, 3.5);
  });

  test("CA-03.2 las horas se redondean a un decimal", () => {
    const partidas = [p("2026-11-09T10:00:00", 50)];
    assert.equal(calcularHorasSemana(partidas, SEMANA, AHORA).horas, 0.8);
  });

  test("CA-03.3 3.5 horas con meta de 5 son 70 %", () => {
    assert.equal(calcularPorcentajeHoras(3.5, 5), 70);
  });

  test("CA-03.4 7 horas con meta de 5 son 140 %: no se limita a 100", () => {
    assert.equal(calcularPorcentajeHoras(7, 5), 140);
  });

  test("CA-03.6 partida que empieza domingo 23:30 cuenta completa para esa semana", () => {
    const partidas = [p("2026-11-15T23:30:00", 60)];
    const domingo = ec("2026-11-16T09:00:00"); // lunes siguiente: otra semana
    assert.equal(calcularHorasSemana(partidas, SEMANA, domingo).minutos, 60);
    assert.equal(contarDiasJugados(partidas, SEMANA, domingo), 1);
    assert.equal(calcularHorasSemana(partidas, semanaDe(domingo), domingo).minutos, 0);
  });

  test("CA-03.7 partidas de la semana pasada y futuras no cuentan", () => {
    const partidas = [
      p("2026-11-08T22:00:00", 60), // domingo anterior
      p("2026-11-11T18:00:00", 60), // hoy, pero más tarde que "ahora"
      p("2026-11-13T10:00:00", 60), // viernes futuro
      p("2026-11-10T10:00:00", 30) // ayer: cuenta
    ];
    assert.equal(calcularHorasSemana(partidas, SEMANA, AHORA).minutos, 30);
    assert.equal(contarDiasJugados(partidas, SEMANA, AHORA), 1);
  });
});

describe("días jugados", () => {
  test("CA-03.5 tres partidas el mismo día cuentan como un día", () => {
    const partidas = [
      p("2026-11-10T08:00:00"),
      p("2026-11-10T13:00:00"),
      p("2026-11-10T21:00:00"),
      p("2026-11-11T09:00:00")
    ];
    assert.equal(contarDiasJugados(partidas, SEMANA, AHORA), 2);
  });
});

describe("rachas", () => {
  test("CA-04.1 hoy, ayer y anteayer dan racha 3", () => {
    const partidas = [
      p("2026-11-11T08:00:00"),
      p("2026-11-10T20:00:00"),
      p("2026-11-09T20:00:00")
    ];
    assert.equal(calcularRachas(partidas, AHORA).rachaActual, 3);
  });

  test("CA-04.2 sin partida hoy pero sí ayer, la racha sigue viva", () => {
    const partidas = [p("2026-11-10T20:00:00"), p("2026-11-09T20:00:00")];
    assert.equal(calcularRachas(partidas, AHORA).rachaActual, 2);
  });

  test("CA-04.3 si la última partida fue anteayer, la racha actual es 0", () => {
    const partidas = [p("2026-11-09T20:00:00"), p("2026-11-08T20:00:00")];
    const rachas = calcularRachas(partidas, AHORA);
    assert.equal(rachas.rachaActual, 0);
    assert.equal(rachas.mejorRacha, 2);
  });

  test("CA-04.4 mejor racha histórica 9 y actual 4", () => {
    const partidas: PartidaDominio[] = [];
    for (let dia = 1; dia <= 9; dia++) {
      partidas.push(p(`2026-10-${String(dia).padStart(2, "0")}T19:00:00`));
    }
    for (const dia of ["08", "09", "10", "11"]) {
      partidas.push(p(`2026-11-${dia}T07:00:00`));
    }
    assert.deepEqual(calcularRachas(partidas, AHORA), { rachaActual: 4, mejorRacha: 9 });
  });

  test("CA-04.4 la mejor racha nunca es menor que la actual", () => {
    const partidas = [p("2026-11-11T08:00:00"), p("2026-11-10T08:00:00")];
    assert.deepEqual(calcularRachas(partidas, AHORA), { rachaActual: 2, mejorRacha: 2 });
  });

  test("CA-04.5 varias partidas el mismo día suman un solo día de racha", () => {
    const partidas = [
      p("2026-11-11T08:00:00"),
      p("2026-11-11T10:00:00"),
      p("2026-11-10T08:00:00")
    ];
    assert.equal(calcularRachas(partidas, AHORA).rachaActual, 2);
  });

  test("CA-04.x la racha cruza el cambio de mes", () => {
    const ahora = ec("2026-12-01T12:00:00");
    const partidas = [
      p("2026-11-29T10:00:00"),
      p("2026-11-30T10:00:00"),
      p("2026-12-01T10:00:00")
    ];
    assert.equal(calcularRachas(partidas, ahora).rachaActual, 3);
  });

  test("CA-03.7 una partida futura no alarga la racha", () => {
    const partidas = [p("2026-11-10T10:00:00"), p("2026-11-12T10:00:00")];
    assert.deepEqual(calcularRachas(partidas, AHORA), { rachaActual: 1, mejorRacha: 1 });
  });
});

describe("hitos y avance", () => {
  const hitos = [
    { descripcion: "Terminar el juego", porcentajeObjetivo: 100 },
    { descripcion: "Llegar al 25 %", porcentajeObjetivo: 25 },
    { descripcion: "Llegar al 50 %", porcentajeObjetivo: 50 }
  ];

  test("E1 el avance actual es la suma de avances, limitada a 100", () => {
    assert.equal(
      calcularAvanceActual([
        p("2026-11-01T10:00:00", 60, 30),
        p("2026-11-02T10:00:00", 60, 20)
      ]),
      50
    );
    assert.equal(
      calcularAvanceActual([
        p("2026-11-01T10:00:00", 60, 70),
        p("2026-11-02T10:00:00", 60, 50)
      ]),
      100
    );
    assert.equal(calcularAvanceActual([]), 0);
  });

  test("CA-05.1 con avance 50 se alcanzan los hitos de 25 y 50, no el de 100", () => {
    const resultado = evaluarHitos(hitos, 50);
    assert.deepEqual(
      resultado.map(h => [h.porcentajeObjetivo, h.alcanzado]),
      [
        [25, true],
        [50, true],
        [100, false]
      ]
    );
  });

  test("CA-02.4 los hitos se devuelven ordenados por porcentaje objetivo", () => {
    assert.deepEqual(
      evaluarHitos(hitos, 0).map(h => h.porcentajeObjetivo),
      [25, 50, 100]
    );
  });

  test("CA-05.2 si el avance baja, el hito deja de estar alcanzado", () => {
    const antes = [p("2026-11-01T10:00:00", 60, 30), p("2026-11-02T10:00:00", 60, 25)];
    const despues = antes.slice(0, 1); // se eliminó la segunda partida
    assert.equal(evaluarHitos(hitos, calcularAvanceActual(antes))[1].alcanzado, true);
    assert.equal(evaluarHitos(hitos, calcularAvanceActual(despues))[1].alcanzado, false);
  });

  test("CA-05.3 sin partidas ningún hito está alcanzado", () => {
    assert.ok(evaluarHitos(hitos, calcularAvanceActual([])).every(h => !h.alcanzado));
  });
});

describe("meta cumplida", () => {
  test("CA-03.11 se cumple con horas y días alcanzados", () => {
    assert.equal(esMetaCumplida(300, 4, meta(5, 4)), true);
  });

  test("CA-03.11 no se cumple si faltan días aunque sobren horas", () => {
    assert.equal(esMetaCumplida(600, 3, meta(5, 4)), false);
  });

  test("CA-03.11 no se cumple con 299 minutos aunque se muestren 5.0 horas", () => {
    assert.equal(esMetaCumplida(299, 4, meta(5, 4)), false);
  });
});

describe("progreso semanal completo", () => {
  test("CA-03.9 / CA-05.3 sin partidas: todo en 0 y ningún hito alcanzado", () => {
    const progreso = calcularProgresoSemanal({
      partidas: [],
      meta: meta(5, 4, [{ descripcion: "Llegar al 25 %", porcentajeObjetivo: 25 }]),
      ahora: AHORA
    });
    assert.equal(progreso.horasSemana, 0);
    assert.equal(progreso.porcentajeHoras, 0);
    assert.equal(progreso.diasJugadosSemana, 0);
    assert.equal(progreso.rachaActual, 0);
    assert.equal(progreso.mejorRacha, 0);
    assert.equal(progreso.metaCumplida, false);
    assert.equal(progreso.hitos[0].alcanzado, false);
  });

  test("CA-03.8 sin meta: meta y porcentaje en null, pero calcula horas, días y rachas", () => {
    const progreso = calcularProgresoSemanal({
      partidas: [p("2026-11-10T10:00:00", 90), p("2026-11-11T09:00:00", 30)],
      meta: null,
      ahora: AHORA
    });
    assert.equal(progreso.meta, null);
    assert.equal(progreso.porcentajeHoras, null);
    assert.equal(progreso.metaCumplida, null);
    assert.deepEqual(progreso.hitos, []);
    assert.equal(progreso.horasSemana, 2);
    assert.equal(progreso.diasJugadosSemana, 2);
    assert.equal(progreso.rachaActual, 2);
  });

  test("CA-03.10 con la misma semana, cambiar la meta cambia el porcentaje", () => {
    const partidas = [p("2026-11-10T10:00:00", 210)];
    const antes = calcularProgresoSemanal({ partidas, meta: meta(5, 4), ahora: AHORA });
    const despues = calcularProgresoSemanal({ partidas, meta: meta(7, 4), ahora: AHORA });
    assert.equal(antes.porcentajeHoras, 70);
    assert.equal(despues.porcentajeHoras, 50);
  });

  test("devuelve la semana, sus 7 días y la forma completa del ejemplo", () => {
    const progreso = calcularProgresoSemanal({
      partidas: [
        p("2026-11-09T10:00:00", 90),
        p("2026-11-11T10:00:00", 120),
        p("2026-11-11T20:00:00", 15)
      ],
      meta: meta(5, 4),
      ahora: AHORA
    });
    assert.deepEqual(progreso.semana, SEMANA);
    assert.deepEqual(progreso.meta, { horasSemanales: 5, diasPorSemana: 4 });
    assert.equal(progreso.horasSemana, 3.5);
    assert.equal(progreso.porcentajeHoras, 70);
    assert.deepEqual(
      progreso.diasSemana.map(d => d.jugado),
      [true, false, true, false, false, false, false]
    );
    assert.equal(progreso.diasSemana[0].fecha, "2026-11-09");
    assert.equal(progreso.diasSemana[6].fecha, "2026-11-15");
  });
});
