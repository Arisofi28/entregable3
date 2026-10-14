
import { apiRequest } from "./api";

// Estados disponibles
export type EstadoVideojuego =
  | "jugando"
  | "pausado"
  | "completado"
  | "abandonado";

// Plataformas disponibles
export type Plataforma =
  | "PC"
  | "PlayStation"
  | "Xbox"
  | "Switch"
  | "Movil";

// Géneros disponibles
export type Genero =
  | "accion"
  | "rol"
  | "estrategia"
  | "puzzle"
  | "deportes"
  | "otro";

// Datos de un logro
export interface Logro {
  _id: string;
  nombre: string;
  obtenido: boolean;
}

// Datos de un videojuego
export interface Videojuego {
  _id: string;
  nombre: string;
  plataforma: Plataforma;
  genero: Genero;
  estado: EstadoVideojuego;
  logros: Logro[];
  createdAt?: string;
  updatedAt?: string;
}

// Datos que enviamos al crear
export interface CrearVideojuego {
  nombre: string;
  plataforma: Plataforma;
  genero: Genero;
  estado: EstadoVideojuego;
  logros?: {
    _id?: string;
    nombre: string;
    obtenido: boolean;
  }[];
}

// GET todos los videojuegos
export function obtenerVideojuegos(
  estado?: EstadoVideojuego
): Promise<Videojuego[]> {
  const query = estado
    ? `?estado=${encodeURIComponent(estado)}`
    : "";

  return apiRequest<Videojuego[]>(
    `/videojuegos${query}`
  );
}

// GET videojuego por ID
export function obtenerVideojuego(
  id: string
): Promise<Videojuego> {
  return apiRequest<Videojuego>(
    `/videojuegos/${id}`
  );
}

// POST crear videojuego
export function crearVideojuego(
  datos: CrearVideojuego
): Promise<Videojuego> {
  return apiRequest<Videojuego>(
    "/videojuegos",
    {
      method: "POST",
      body: JSON.stringify(datos)
    }
  );
}

// PUT actualizar videojuego
export function actualizarVideojuego(
  id: string,
  datos: Partial<CrearVideojuego>
): Promise<Videojuego> {
  return apiRequest<Videojuego>(
    `/videojuegos/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos)
    }
  );
}

// DELETE eliminar videojuego
export function eliminarVideojuego(
  id: string
): Promise<void> {
  return apiRequest<void>(
    `/videojuegos/${id}`,
    {
      method: "DELETE"
    }
  );
}

// PATCH actualizar logro
export function actualizarLogro(
  videojuegoId: string,
  logroId: string,
  obtenido: boolean
): Promise<Videojuego> {
  return apiRequest<Videojuego>(
    `/videojuegos/${videojuegoId}/logros/${logroId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ obtenido })
    }
  );
}
