import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de Produto
 * Coleção: produtos
 */
const ProdutoSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    descBreve: {
      type: String,
      default: '',
      trim: true,
    },
    descCompleta: {
      type: String,
      default: '',
      trim: true,
    },
    ativado: {
      type: String,
      default: 'sim',
      trim: true,
    },
    valor: {
      type: String,
      default: '',
      trim: true,
    },
    duracao: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'produtos',
  }
);

export interface IProduto {
  _id?: string;
  nome: string;
  descBreve: string;
  descCompleta: string;
  ativado: string;
  valor: string;
  duracao: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const Produto: Model<IProduto> =
  mongoose.models.Produto || mongoose.model<IProduto>('Produto', ProdutoSchema);

export default Produto;

