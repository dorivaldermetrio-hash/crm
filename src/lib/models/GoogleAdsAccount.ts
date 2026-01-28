import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de GoogleAdsAccount
 * Coleção: google-ads-accounts
 * 
 * Armazena as credenciais OAuth do Google Ads associadas a um usuário
 * e uma conta específica do Google Ads (customerId)
 */
const GoogleAdsAccountSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true, // Índice para buscas rápidas por usuário
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Remove hífens e valida que tem 10 dígitos
          const clean = v.replace(/-/g, '');
          return /^\d{10}$/.test(clean);
        },
        message: 'customerId deve ter 10 dígitos (formato: 1234567890)',
      },
    },
    refreshToken: {
      type: String,
      required: true,
      trim: true,
      // Não indexamos o refreshToken por segurança
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'google-ads-accounts',
  }
);

// Índice composto para garantir que um usuário não tenha duplicatas do mesmo customerId
GoogleAdsAccountSchema.index({ userId: 1, customerId: 1 }, { unique: true });

export interface IGoogleAdsAccount {
  _id?: string;
  userId: string;
  customerId: string;
  refreshToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const GoogleAdsAccount: Model<IGoogleAdsAccount> =
  mongoose.models.GoogleAdsAccount ||
  mongoose.model<IGoogleAdsAccount>('GoogleAdsAccount', GoogleAdsAccountSchema);

export default GoogleAdsAccount;

