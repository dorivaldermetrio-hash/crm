import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Agendamento
 * Coleção: agendamentos
 */
const AgendamentoSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    notas: {
      type: String,
      default: '',
      trim: true,
    },
    data: {
      type: String,
      required: true,
      trim: true,
    },
    horarioInicio: {
      type: String,
      required: true,
      trim: true,
    },
    duracao: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'agendado',
      trim: true,
    },
    googleEventId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'agendamentos',
  }
);

export interface IAgendamento {
  _id?: string;
  nome: string;
  notas: string;
  data: string;
  horarioInicio: string;
  duracao: string;
  status: string;
  googleEventId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const Agendamento: Model<IAgendamento> =
  mongoose.models.Agendamento || mongoose.model<IAgendamento>('Agendamento', AgendamentoSchema);

export default Agendamento;

