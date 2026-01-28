import mongoose, { Schema, Model, Types } from 'mongoose';
import connectDB from '@/lib/db';
import { MensagemUnicaDMSchema, IMensagemUnicaDM } from './MensagemUnicaDM';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Mensagem DM Instagram
 * Coleção: mensagensDM
 * Contém um array de mensagens únicas (MensagemUnicaDM)
 */
const MensagemDMSchema = new Schema(
  {
    contatoID: {
      type: Schema.Types.ObjectId,
      ref: 'ContatoDM',
      required: true,
    },
    mensagens: {
      type: [MensagemUnicaDMSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'mensagensDM',
  }
);

// Índice no contatoID para buscas rápidas
MensagemDMSchema.index({ contatoID: 1 });

export interface IMensagemDM {
  _id?: string;
  contatoID: Types.ObjectId | string;
  mensagens: IMensagemUnicaDM[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const MensagemDM: Model<IMensagemDM> =
  mongoose.models.MensagemDM ||
  mongoose.model<IMensagemDM>('MensagemDM', MensagemDMSchema);

export default MensagemDM;

