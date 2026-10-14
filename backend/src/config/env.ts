
import "dotenv/config";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error(
    "Falta MONGODB_URI en las variables de entorno"
  );
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  MONGODB_URI: mongoUri,
  CLIENT_URL:
    process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV:
    process.env.NODE_ENV || "development"
};
