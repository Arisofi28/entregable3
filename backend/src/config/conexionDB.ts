
import mongoose from "mongoose";
import { env } from "./env.js";

export async function conectarDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("✅ MongoDB Atlas conectado");
    console.log(
      `📂 Base de datos: ${mongoose.connection.name}`
    );
  } catch (error) {
    console.error(
      "❌ No se pudo conectar a MongoDB:",
      error
    );

    throw error;
  }
}
