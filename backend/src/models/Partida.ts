
import { Schema, model, Types } from "mongoose";

export interface IPartida {
  videojuego: Types.ObjectId;
  fecha: Date;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
}

const partidaSchema = new Schema<IPartida>(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: [true, "El videojuego es obligatorio"]
    },

    fecha: {
      type: Date,
      required: [true, "La fecha es obligatoria"]
    },

    duracionMinutos: {
      type: Number,
      required: [true, "La duración es obligatoria"],
      min: [1, "La duración debe ser mayor a cero"],
      validate: {
        validator: Number.isInteger,
        message: "La duración debe ser un número entero"
      }
    },

    porcentajeAvance: {
      type: Number,
      required: [true, "El avance ganado en la sesión es obligatorio"],
      min: [0, "El avance ganado mínimo es 0%"],
      max: [100, "El avance ganado máximo es 100%"]
    },

    notas: {
      type: String,
      trim: true,
      maxlength: [500, "Máximo 500 caracteres"]
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

partidaSchema.index({
  videojuego: 1,
  fecha: -1
});

export const PartidaModel = model<IPartida>(
  "Partida",
  partidaSchema
);
