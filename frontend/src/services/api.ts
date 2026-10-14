
const API_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Función reutilizable para llamar al backend
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Indicamos que enviamos JSON cuando hay body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    );
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que el backend esté encendido.",
      0
    );
  }

  // DELETE devuelve 204 sin contenido
  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(
    () => null
  );

  if (!response.ok) {
    let mensaje = "Ocurrió un error inesperado";

    if (data && typeof data === "object") {
      const errorData = data as {
        error?: { mensaje?: string };
        mensaje?: string;
      };

      mensaje =
        errorData.error?.mensaje ??
        errorData.mensaje ??
        mensaje;
    }

    throw new ApiError(mensaje, response.status);
  }

  return data as T;
}
