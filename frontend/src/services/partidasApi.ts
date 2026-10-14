
import { apiRequest } from "./api";

import type { Videojuego } from "./videojuegosApi";

// Una partida guardada en MongoDB
export interface Partida {
  _id: string;
  videojuego: string | Videojuego;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
  createdAt?: string;
}

// Datos enviados desde el formulario
export interface CrearPartida {
  videojuego: string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
}

// Resumen calculado en Express
export interface ResumenVideojuego {
  totalPartidas: number;
  horasTotales: number;
  ultimaPartida: string | null;
  porcentajeAvanceActual: number;
}

// GET todas las partidas
export function obtenerPartidas(): Promise<Partida[]> {
  return apiRequest<Partida[]>("/partidas");
}

// POST registrar una partida
export function crearPartida(
  datos: CrearPartida
): Promise<Partida> {
  return apiRequest<Partida>(
    "/partidas",
    {
      method: "POST",
      body: JSON.stringify(datos)
    }
  );
}

// DELETE una partida
export function eliminarPartida(
  id: string
): Promise<void> {
  return apiRequest<void>(
    `/partidas/${id}`,
    {
      method: "DELETE"
    }
  );
}

// GET partidas de un videojuego
export function obtenerPartidasDeVideojuego(
  videojuegoId: string
): Promise<Partida[]> {
  return apiRequest<Partida[]>(
    `/videojuegos/${videojuegoId}/partidas`
  );
}

// GET resumen calculado
export function obtenerResumenVideojuego(
  videojuegoId: string
): Promise<ResumenVideojuego> {
  return apiRequest<ResumenVideojuego>(
    `/videojuegos/${videojuegoId}/resumen`
  );
}
