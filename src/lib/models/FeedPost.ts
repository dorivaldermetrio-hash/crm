import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
// (será executado apenas uma vez devido ao cache)
connectDB().catch(console.error);

/**
 * Modelo de FeedPost
 * Coleção: feedposts
 */
const FeedPostSchema = new Schema(
  {
    imagem: {
      type: String,
      required: true,
      trim: true,
    },
    dataPublicacao: {
      type: Date,
      required: true,
    },
    statusPost: {
      type: Boolean,
      default: false,
      required: true,
    },
    descricao: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'feedposts',
  }
);

export interface IFeedPost {
  _id?: string;
  imagem: string;
  dataPublicacao: Date;
  statusPost: boolean;
  descricao?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const FeedPost: Model<IFeedPost> =
  mongoose.models.FeedPost || mongoose.model<IFeedPost>('FeedPost', FeedPostSchema);

export default FeedPost;

