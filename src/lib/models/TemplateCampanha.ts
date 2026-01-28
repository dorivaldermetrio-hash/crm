import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Template de Campanha
 * Coleção: templates-campanha
 */
const TemplateCampanhaSchema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    texto: {
      type: String,
      required: true,
    },
    btn: {
      type: Boolean,
      default: false,
      required: false,
    },
    linkBtn: {
      type: String,
      default: '',
      trim: true,
      required: false,
    },
    varNome: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'templates-campanha',
  }
);

export interface ITemplateCampanha {
  _id?: string;
  titulo: string;
  texto: string;
  btn?: boolean;
  linkBtn?: string;
  varNome?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const TemplateCampanha: Model<ITemplateCampanha> =
  mongoose.models.TemplateCampanha || mongoose.model<ITemplateCampanha>('TemplateCampanha', TemplateCampanhaSchema);

export default TemplateCampanha;

