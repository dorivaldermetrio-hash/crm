import mongoose, { Schema, Model, Types } from 'mongoose';
import connectDB from '@/lib/db';
import { MensagemUnicaSchema, IMensagemUnica } from './MensagemUnica';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Mensagem
 * Coleção: mensagens
 * Contém um array de mensagens únicas (MensagemUnica)
 */
const MensagemSchema = new Schema(
  {
    contatoID: {
      type: Schema.Types.ObjectId,
      ref: 'Contato',
      required: true,
    },
    mensagens: {
      type: [MensagemUnicaSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'mensagens',
  }
);

// Índice no contatoID para buscas rápidas
MensagemSchema.index({ contatoID: 1 });

export interface IMensagem {
  _id?: string;
  contatoID: Types.ObjectId | string;
  mensagens: IMensagemUnica[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const Mensagem: Model<IMensagem> =
  mongoose.models.Mensagem ||
  mongoose.model<IMensagem>('Mensagem', MensagemSchema);

export default Mensagem;

