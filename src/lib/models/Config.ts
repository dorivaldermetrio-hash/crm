import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
// (será executado apenas uma vez devido ao cache)
connectDB().catch(console.error);

/**
 * Modelo de Config
 * Coleção: config
 */
const ConfigSchema = new Schema(
  {
    numMsgHist: {
      type: Number,
      default: 0,
    },
    duracaoAgendamento: {
      type: String,
      default: '0:00',
      trim: true,
    },
    pararAtendimento: {
      type: String,
      default: 'Nenhum',
      trim: true,
    },
    horarioInicio: {
      type: String,
      default: '08:00',
      trim: true,
    },
    horarioFim: {
      type: String,
      default: '18:00',
      trim: true,
    },
    horarioInicioSab: {
      type: String,
      default: '08:00',
      trim: true,
    },
    horarioFimSab: {
      type: String,
      default: '18:00',
      trim: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'config',
  }
);

export interface IConfig {
  _id?: string;
  numMsgHist: number;
  duracaoAgendamento: string;
  pararAtendimento: string;
  horarioInicio: string;
  horarioFim: string;
  horarioInicioSab: string;
  horarioFimSab: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const Config: Model<IConfig> =
  mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);

export default Config;

