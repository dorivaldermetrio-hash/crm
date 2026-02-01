import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
connectDB().catch(console.error);

/**
 * Modelo de GoogleCalendarAccount
 * Coleção: google-calendar-accounts
 * Armazena tokens de autenticação do Google Calendar por usuário
 */
const GoogleCalendarAccountSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      // Removido index: true para evitar duplicação com schema.index() abaixo
    },
    refreshToken: {
      type: String,
      required: true,
      trim: true,
    },
    calendarId: {
      type: String,
      default: 'primary', // Calendário principal por padrão
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    watchResourceId: {
      type: String,
      default: null,
      trim: true,
    },
    watchExpiration: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'google-calendar-accounts',
  }
);

// Índice composto para garantir um único registro por usuário
GoogleCalendarAccountSchema.index({ userId: 1 }, { unique: true });

export interface IGoogleCalendarAccount {
  _id?: string;
  userId: string;
  refreshToken: string;
  calendarId: string;
  email?: string;
  watchResourceId?: string | null;
  watchExpiration?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const GoogleCalendarAccount: Model<IGoogleCalendarAccount> =
  mongoose.models.GoogleCalendarAccount ||
  mongoose.model<IGoogleCalendarAccount>('GoogleCalendarAccount', GoogleCalendarAccountSchema);

export default GoogleCalendarAccount;
