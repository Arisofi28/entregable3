
import app from "./app.js";
import { env } from "./config/env.js";
import { conectarDB } from "./config/conexionDB.js";

async function iniciarServidor(): Promise<void> {
  try {
    await conectarDB();

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log("🎮 ARCADE UNIVERSE API");
      console.log(
        `🚀 Servidor: http://localhost:${env.PORT}`
      );
      console.log(
        `💚 Health: http://localhost:${env.PORT}/api/health`
      );
    });
  } catch (error) {
    console.error(
      "❌ No se pudo iniciar el servidor:",
      error
    );

    process.exit(1);
  }
}

void iniciarServidor();
