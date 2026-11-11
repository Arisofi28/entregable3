import { Schema, model, Types } from "mongoose";

// T-03 · Spec backend §1. Meta referencia a Videojuego y embebe sus hitos.

export interface IHito {
  _id?: Types.ObjectId;
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface IMeta {
  videojuego: Types.ObjectId;
  horasSemanales: number;
  diasPorSemana: number;
  activa: boolean;
  hitos: IHito[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const MAX_HITOS = 5;

// ESQUEMA EMBEBIDO: HITO
const hitoSchema = new Schema<IHito>(
  {
    descripcion: {
      type: String,
      required: [true, "La descripción del hito es obligatoria"],
      trim: true,
      minlength: [2, "La descripción del hito debe tener al menos 2 caracteres"],
      maxlength: [80, "La descripción del hito no puede superar 80 caracteres"]
    },
    porcentajeObjetivo: {
      type: Number,
      required: [true, "El porcentaje objetivo del hito es obligatorio"],
      min: [1, "El porcentaje objetivo del hito mínimo es 1"],
      max: [100, "El porcentaje objetivo del hito máximo es 100"]
    }
  },
  { _id: true, strict: "throw" }
);

// ESQUEMA PRINCIPAL: META
const metaSchema = new Schema<IMeta>(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: [true, "El videojuego es obligatorio"]
    },
    horasSemanales: {
      type: Number,
      required: [true, "Las horas por semana son obligatorias"],
      validate: {
        validator: (valor: number) => Number.isFinite(valor) && valor > 0 && valor <= 100,
        message: "Las horas por semana deben ser mayores que 0 y como máximo 100"
      }
    },
    diasPorSemana: {
      type: Number,
      required: [true, "Los días por semana son obligatorios"],
      validate: {
        validator: (valor: number) => Number.isInteger(valor) && valor >= 1 && valor <= 7,
        message: "Los días por semana deben ser un número entero entre 1 y 7"
      }
    },
    activa: {
      type: Boolean,
      default: true
    },
    hitos: {
      type: [hitoSchema],
      default: [],
      validate: {
        validator: (hitos: IHito[]) => hitos.length <= MAX_HITOS,
        message: `Una meta puede tener como máximo ${MAX_HITOS} hitos`
      }
    }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw"
  }
);

// RN-01: como máximo una meta activa por videojuego (también ante peticiones concurrentes)
metaSchema.index(
  { videojuego: 1 },
  {
    unique: true,
    partialFilterExpression: { activa: true },
    name: "una_meta_activa_por_videojuego"
  }
);

metaSchema.index({ videojuego: 1, createdAt: -1 });

export const MetaModel = model<IMeta>("Meta", metaSchema, "metas");
