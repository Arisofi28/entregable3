import { apiRequest } from "./api";

// T-09 · Cliente HTTP de metas y progreso semanal (spec frontend §1).

export interface Hito {
  _id?: string;
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface HitoProgreso extends Hito {
  alcanzado: boolean;
}

export interface Meta {
  _id: string;
  videojuego: string;
  horasSemanales: number;
  diasPorSemana: number;
  activa: boolean;
  hitos: Hito[];
  createdAt: string;
  updatedAt: string;
}

// Datos que envía el formulario de meta
export interface MetaEntrada {
  horasSemanales: number;
  diasPorSemana: number;
  hitos: Hito[];
}

export interface ProgresoSemanal {
  semana: { inicio: string; fin: string };
  meta: { _id: string; horasSemanales: number; diasPorSemana: number } | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  diasSemana: { fecha: string; jugado: boolean }[];
  rachaActual: number;
  mejorRacha: number;
  metaCumplida: boolean | null;
  hitos: HitoProgreso[];
}

// GET progreso de la semana actual
export function obtenerProgresoSemanal(videojuegoId: string): Promise<ProgresoSemanal> {
  return apiRequest<ProgresoSemanal>(`/videojuegos/${videojuegoId}/progreso-semanal`);
}

// GET historial de metas del videojuego (activa primero)
export function listarMetasDeVideojuego(videojuegoId: string): Promise<Meta[]> {
  return apiRequest<Meta[]>(`/videojuegos/${videojuegoId}/metas`);
}

// GET una meta
export function obtenerMeta(id: string): Promise<Meta> {
  return apiRequest<Meta>(`/metas/${id}`);
}

// POST crear meta
export function crearMeta(videojuegoId: string, datos: MetaEntrada): Promise<Meta> {
  return apiRequest<Meta>("/metas", {
    method: "POST",
    body: JSON.stringify({ videojuego: videojuegoId, ...datos })
  });
}

// PUT editar la meta activa
export function actualizarMeta(id: string, datos: MetaEntrada): Promise<Meta> {
  return apiRequest<Meta>(`/metas/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos)
  });
}

// PATCH desactivar meta
export function desactivarMeta(id: string): Promise<Meta> {
  return apiRequest<Meta>(`/metas/${id}/desactivar`, { method: "PATCH" });
}
