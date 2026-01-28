import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Template WhatsApp
 * Coleção: templates-ws
 */
const TemplateWSSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    conteudo: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'templates-ws',
  }
);

export interface ITemplateWS {
  _id?: string;
  nome: string;
  conteudo: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const TemplateWS: Model<ITemplateWS> =
  mongoose.models.TemplateWS || mongoose.model<ITemplateWS>('TemplateWS', TemplateWSSchema);

export default TemplateWS;

