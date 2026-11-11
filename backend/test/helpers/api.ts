// Levanta la app contra un MongoDB en memoria (mongodb-memory-server).
// No usa .env ni Atlas: cada archivo de test tiene su propia base vacía.
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export interface ContextoApi {
  url: string;
  pedir: (
    ruta: string,
    opciones?: { method?: string; body?: unknown }
  ) => Promise<{ status: number; body: any }>;
  limpiar: () => Promise<void>;
  cerrar: () => Promise<void>;
}

export async function iniciarApi(): Promise<ContextoApi> {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("arcade-test");

  const { default: app } = await import("../../src/app.js");
  const { MetaModel } = await import("../../src/models/Meta.js");

  await mongoose.connect(process.env.MONGODB_URI);
  await MetaModel.syncIndexes(); // índice único parcial de metas activas

  const originalError = console.error;
  const originalLog = console.log;
  console.error = () => {};
  console.log = () => {};

  const server: Server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}/api`;

  return {
    url,
    async pedir(ruta, { method = "GET", body } = {}) {
      const respuesta = await fetch(`${url}${ruta}`, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const texto = await respuesta.text();
      return { status: respuesta.status, body: texto ? JSON.parse(texto) : null };
    },
    async limpiar() {
      const colecciones = await mongoose.connection.db!.collections();
      await Promise.all(colecciones.map(coleccion => coleccion.deleteMany({})));
    },
    async cerrar() {
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      );
      await mongoose.disconnect();
      await mongo.stop();
      console.error = originalError;
      console.log = originalLog;
    }
  };
}

export const juegoBase = (extra: Record<string, unknown> = {}) => ({
  nombre: "Hollow Test",
  plataforma: "PC",
  genero: "accion",
  ...extra
});
