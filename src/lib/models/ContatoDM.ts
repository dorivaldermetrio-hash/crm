import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco antes de definir o modelo
// (será executado apenas uma vez devido ao cache)
connectDB().catch(console.error);

/**
 * Modelo de Contato DM Instagram
 * Coleção: contatoDM
 * Armazena @ do Instagram em vez de número de telefone
 */
const ContatoDMSchema = new Schema(
  {
    contato: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contatoNome: {
      type: String,
      default: '',
      trim: true,
    },
    ultimaMensagem: {
      type: String,
      default: '',
    },
    dataUltimaMensagem: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'],
      default: 'Novo Contato',
      required: false,
    },
    tags: {
      type: [{
        type: String,
        enum: ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto'],
      }],
      default: [],
      required: false,
    },
    nota: {
      type: String,
      default: '',
      trim: true,
      required: false,
    },
    favorito: {
      type: Boolean,
      default: false,
      required: false,
    },
    arquivar: {
      type: Boolean,
      default: false,
      required: false,
    },
    produtoInteresse: {
      type: String,
      default: 'DESCONHECIDO',
      trim: true,
      required: false,
    },
    saudacao: {
      type: Boolean,
      default: false,
      required: false,
    },
    pedidoResumo: {
      type: Boolean,
      default: false,
      required: false,
    },
    confirmacaoResumo: {
      type: Boolean,
      default: false,
      required: false,
    },
    urgenciaDefinida: {
      type: Boolean,
      default: false,
      required: false,
    },
    selecionandoData: {
      type: Boolean,
      default: false,
      required: false,
    },
    propostaAgendamento: {
      type: Boolean,
      default: false,
      required: false,
    },
    confirmaAgendamento: {
      type: Boolean,
      default: false,
      required: false,
    },
    nomeCompleto: {
      type: String,
      default: '',
      trim: true,
      required: false,
    },
    resumoCaso: {
      type: String,
      default: '',
      trim: true,
      required: false,
    },
    informacoesCaso: {
      type: String,
      default: '',
      trim: true,
      required: false,
    },
    inicialConcluido: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'contatoDM',
  }
);

// Índice único no campo contato
ContatoDMSchema.index({ contato: 1 }, { unique: true });

export interface IContatoDM {
  _id?: string;
  contato: string; // @ do Instagram
  contatoNome: string;
  ultimaMensagem: string;
  dataUltimaMensagem: Date | null;
  status?: 'Novo Contato' | 'Triagem em Andamento' | 'Triagem Jurídica Concluída' | 'Caso Urgente' | 'Encaminhado para Atendimento Humano' | 'Não é caso Jurídico';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  nota?: string;
  favorito?: boolean;
  arquivar?: boolean;
  produtoInteresse?: string;
  saudacao?: boolean;
  pedidoResumo?: boolean;
  confirmacaoResumo?: boolean;
  urgenciaDefinida?: boolean;
  selecionandoData?: boolean;
  propostaAgendamento?: boolean;
  confirmaAgendamento?: boolean;
  nomeCompleto?: string;
  resumoCaso?: string;
  informacoesCaso?: string;
  inicialConcluido?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Evita redefinir o modelo durante hot-reload do Next.js
const ContatoDM: Model<IContatoDM> =
  mongoose.models.ContatoDM || mongoose.model<IContatoDM>('ContatoDM', ContatoDMSchema);

export default ContatoDM;

