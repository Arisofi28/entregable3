
import { Schema, model } from "mongoose";

// ESQUEMA EMBEBIDO: LOGRO
const logroSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del logro es obligatorio"],
      trim: true,
      minlength: 2
    },

    obtenido: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    _id: true
  }
);

// ESQUEMA PRINCIPAL: VIDEOJUEGO
const videojuegoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede superar 100 caracteres"]
    },

    plataforma: {
      type: String,
      required: [true, "La plataforma es obligatoria"],
      enum: ["PC", "PlayStation", "Xbox", "Switch", "Movil"]
    },

    genero: {
      type: String,
      required: [true, "El género es obligatorio"],
      enum: [
        "accion",
        "rol",
        "estrategia",
        "puzzle",
        "deportes",
        "otro"
      ]
    },

    estado: {
      type: String,
      required: true,
      enum: [
        "jugando",
        "pausado",
        "completado",
        "abandonado"
      ],
      default: "jugando"
    },

    logros: {
      type: [logroSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw"
  }
);

export const VideojuegoModel = model(
  "Videojuego",
  videojuegoSchema
);
