import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Profissional
 * Coleção: profissionais
 */
const ProfissionalSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    areas_atuacao: {
      type: [String],
      default: [],
      required: false,
    },
    mensagem_autoridade: {
      type: Schema.Types.Mixed,
      default: {},
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'profissionais',
  }
);

export interface IProfissional {
  _id?: string;
  nome: string;
  areas_atuacao: string[];
  mensagem_autoridade: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const Profissional: Model<IProfissional> =
  mongoose.models.Profissional || mongoose.model<IProfissional>('Profissional', ProfissionalSchema);

export default Profissional;

