import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
// (será executado apenas uma vez devido ao cache)
connectDB().catch(console.error);

/**
 * Modelo de AtendimentoAI
 * Coleção: atendimento-ai
 */
const AtendimentoAISchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    prompt: {
      type: String,
      default: '',
      trim: true,
    },
    numMaxMsg: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'atendimento-ai',
  }
);

// Índice único no campo nome
AtendimentoAISchema.index({ nome: 1 }, { unique: true });

export interface IAtendimentoAI {
  _id?: string;
  nome: string;
  prompt: string;
  numMaxMsg: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const AtendimentoAI: Model<IAtendimentoAI> =
  mongoose.models.AtendimentoAI || mongoose.model<IAtendimentoAI>('AtendimentoAI', AtendimentoAISchema);

export default AtendimentoAI;

