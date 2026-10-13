
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🎮 ARCADE UNIVERSE");
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
});
