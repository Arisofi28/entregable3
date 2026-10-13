
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    project: "entregable3",
    message: "Arcade Universe API funcionando"
  });
});

export default app;
