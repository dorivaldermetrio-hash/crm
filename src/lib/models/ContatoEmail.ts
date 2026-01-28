import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Contato Email
 * Coleção: contatos-emails
 */
const ContatoEmailSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'contatos-emails',
  }
);

// Índice único no campo email
ContatoEmailSchema.index({ email: 1 }, { unique: true });

export interface IContatoEmail {
  _id?: string;
  nome: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const ContatoEmail: Model<IContatoEmail> =
  mongoose.models.ContatoEmail || mongoose.model<IContatoEmail>('ContatoEmail', ContatoEmailSchema);

export default ContatoEmail;

