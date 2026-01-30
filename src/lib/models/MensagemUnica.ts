import { Schema } from 'mongoose';

/**
 * Schema para uma mensagem única (subdocumento)
 * Não é um modelo separado, será usado como subdocumento em Mensagem
 */
export const MensagemUnicaSchema = new Schema(
  {
    mensagemWhatsAppId: {
      type: String,
      required: true,
    },
    mensagem: {
      type: String,
      required: true,
    },
    dataHora: {
      type: Date,
      required: true,
    },
    tipo: {
      type: String,
      required: true,
      enum: [
        'texto',
        'imagem',
        'audio',
        'video',
        'documento',
        'link',
        'contato',
        'localizacao',
        'sticker',
      ],
      default: 'texto',
    },
    contatoID: {
      type: String,
      default: '1', // "1" indica mensagem do sistema/usuário
    },
    // Campos para mídia (opcionais, só preenchidos quando tipo !== 'texto')
    midiaId: {
      type: String,
      required: false,
    },
    midiaUrl: {
      type: String,
      required: false,
    },
    midiaNome: {
      type: String,
      required: false,
    },
    midiaTamanho: {
      type: Number,
      required: false,
    },
    midiaMimeType: {
      type: String,
      required: false,
    },
    midiaThumbnailId: {
      type: String,
      required: false,
    },
    transcricao: {
      type: String,
      required: false,
    },
  },
  {
    _id: true, // Cada mensagem terá seu próprio _id
    timestamps: false, // Não precisamos de timestamps aqui, já temos dataHora
  }
);

export interface IMensagemUnica {
  mensagemWhatsAppId: string;
  mensagem: string;
  dataHora: Date;
  tipo: string;
  contatoID?: string;
  midiaId?: string;
  midiaUrl?: string;
  midiaNome?: string;
  midiaTamanho?: number;
  midiaMimeType?: string;
  midiaThumbnailId?: string;
  transcricao?: string;
  _id?: string;
}

