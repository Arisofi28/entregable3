// Capa de dominio de E2 · Metas y rachas.
// Funciones puras: sin base de datos, sin Express y sin leer el reloj del sistema.
// Reglas: docs/specs/backend-metas-progreso.md §3 (R-01 a R-14).

export const ZONA_HORARIA = "America/Guayaquil";

export interface PartidaDominio {
  fecha: Date;
  duracionMinutos: number;
  porcentajeAvance: number;
}

export interface HitoDominio {
  _id?: unknown;
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface MetaDominio {
  _id?: unknown;
  horasSemanales: number;
  diasPorSemana: number;
  hitos: HitoDominio[];
}

export interface Semana {
  inicio: string;
  fin: string;
}

export interface HitoEvaluado extends HitoDominio {
  alcanzado: boolean;
}

export interface ProgresoSemanal {
  semana: Semana;
  meta: { _id?: unknown; horasSemanales: number; diasPorSemana: number } | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  diasSemana: { fecha: string; jugado: boolean }[];
  rachaActual: number;
  mejorRacha: number;
  metaCumplida: boolean | null;
  hitos: HitoEvaluado[];
}

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

// R-01: día calendario (YYYY-MM-DD) en hora de Ecuador
export function fechaLocal(fecha: Date): string {
  const partes = formatoDia.formatToParts(fecha);
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

// Suma n días a un día calendario. Se opera en UTC para no depender de la zona del servidor.
export function sumarDias(dia: string, n: number): string {
  const fecha = new Date(`${dia}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + n);
  return fecha.toISOString().slice(0, 10);
}

// R-02: semana de lunes a domingo que contiene "ahora"
export function semanaDe(ahora: Date): Semana {
  const hoy = fechaLocal(ahora);
  const diaSemana = new Date(`${hoy}T00:00:00Z`).getUTCDay(); // 0 = domingo
  const desdeLunes = (diaSemana + 6) % 7;
  const inicio = sumarDias(hoy, -desdeLunes);
  return { inicio, fin: sumarDias(inicio, 6) };
}

// R-04: las partidas futuras no cuentan
function partidasHasta<T extends PartidaDominio>(partidas: T[], ahora: Date): T[] {
  return partidas.filter(partida => partida.fecha.getTime() <= ahora.getTime());
}

// R-03: una partida pertenece completa al día de su fecha de inicio
function partidasDeLaSemana<T extends PartidaDominio>(
  partidas: T[],
  semana: Semana,
  ahora: Date
): T[] {
  return partidasHasta(partidas, ahora).filter(partida => {
    const dia = fechaLocal(partida.fecha);
    return dia >= semana.inicio && dia <= semana.fin;
  });
}

function redondear1(valor: number): number {
  return Math.round(valor * 10) / 10;
}

// R-05
export function calcularHorasSemana(
  partidas: PartidaDominio[],
  semana: Semana,
  ahora: Date
): { minutos: number; horas: number } {
  const minutos = partidasDeLaSemana(partidas, semana, ahora).reduce(
    (total, partida) => total + partida.duracionMinutos,
    0
  );
  return { minutos, horas: redondear1(minutos / 60) };
}

// R-06: sin límite superior (RN-11)
export function calcularPorcentajeHoras(
  horasSemana: number,
  horasSemanales: number
): number {
  return Math.round((horasSemana / horasSemanales) * 100);
}

function diasJugadosDeLaSemana(
  partidas: PartidaDominio[],
  semana: Semana,
  ahora: Date
): Set<string> {
  return new Set(
    partidasDeLaSemana(partidas, semana, ahora).map(partida => fechaLocal(partida.fecha))
  );
}

// R-07: días distintos
export function contarDiasJugados(
  partidas: PartidaDominio[],
  semana: Semana,
  ahora: Date
): number {
  return diasJugadosDeLaSemana(partidas, semana, ahora).size;
}

// R-08 y R-09
export function calcularRachas(
  partidas: PartidaDominio[],
  ahora: Date
): { rachaActual: number; mejorRacha: number } {
  const dias = new Set(
    partidasHasta(partidas, ahora).map(partida => fechaLocal(partida.fecha))
  );
  const ordenados = [...dias].sort();

  let mejorRacha = 0;
  let rachaEnCurso = 0;
  let anterior: string | null = null;
  for (const dia of ordenados) {
    rachaEnCurso =
      anterior !== null && sumarDias(anterior, 1) === dia ? rachaEnCurso + 1 : 1;
    mejorRacha = Math.max(mejorRacha, rachaEnCurso);
    anterior = dia;
  }

  const hoy = fechaLocal(ahora);
  const ayer = sumarDias(hoy, -1);
  // RN-07: si hoy no hay partida pero ayer sí, la racha sigue viva
  let dia: string | null = dias.has(hoy) ? hoy : dias.has(ayer) ? ayer : null;
  let rachaActual = 0;
  while (dia !== null && dias.has(dia)) {
    rachaActual++;
    dia = sumarDias(dia, -1);
  }

  return { rachaActual, mejorRacha: Math.max(mejorRacha, rachaActual) };
}

// Misma fórmula que el resumen de E1: suma del avance ganado, limitada a 100
export function calcularAvanceActual(partidas: PartidaDominio[]): number {
  return Math.min(
    100,
    partidas.reduce((total, partida) => total + partida.porcentajeAvance, 0)
  );
}

// R-10 y R-11: el estado se calcula, no se guarda
export function evaluarHitos(hitos: HitoDominio[], avanceActual: number): HitoEvaluado[] {
  return [...hitos]
    .sort((a, b) => a.porcentajeObjetivo - b.porcentajeObjetivo)
    .map(hito => ({
      ...(hito._id !== undefined ? { _id: hito._id } : {}),
      descripcion: hito.descripcion,
      porcentajeObjetivo: hito.porcentajeObjetivo,
      alcanzado: avanceActual >= hito.porcentajeObjetivo
    }));
}

// R-12: se compara con los minutos exactos, no con las horas redondeadas
export function esMetaCumplida(
  minutosSemana: number,
  diasJugadosSemana: number,
  meta: Pick<MetaDominio, "horasSemanales" | "diasPorSemana">
): boolean {
  return (
    minutosSemana >= meta.horasSemanales * 60 && diasJugadosSemana >= meta.diasPorSemana
  );
}

// R-13: arma la respuesta completa del progreso semanal
export function calcularProgresoSemanal({
  partidas,
  meta,
  ahora
}: {
  partidas: PartidaDominio[];
  meta: MetaDominio | null;
  ahora: Date;
}): ProgresoSemanal {
  const semana = semanaDe(ahora);
  const { minutos, horas } = calcularHorasSemana(partidas, semana, ahora);
  const jugados = diasJugadosDeLaSemana(partidas, semana, ahora);
  const diasSemana = Array.from({ length: 7 }, (_, indice) => {
    const fecha = sumarDias(semana.inicio, indice);
    return { fecha, jugado: jugados.has(fecha) };
  });
  const { rachaActual, mejorRacha } = calcularRachas(partidas, ahora);

  return {
    semana,
    meta: meta
      ? {
          ...(meta._id !== undefined ? { _id: meta._id } : {}),
          horasSemanales: meta.horasSemanales,
          diasPorSemana: meta.diasPorSemana
        }
      : null,
    horasSemana: horas,
    porcentajeHoras: meta ? calcularPorcentajeHoras(horas, meta.horasSemanales) : null,
    diasJugadosSemana: jugados.size,
    diasSemana,
    rachaActual,
    mejorRacha,
    metaCumplida: meta ? esMetaCumplida(minutos, jugados.size, meta) : null,
    hitos: meta ? evaluarHitos(meta.hitos, calcularAvanceActual(partidas)) : []
  };
}
