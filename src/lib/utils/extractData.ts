/**
 * Extrai e normaliza dados do webhook do WhatsApp
 */

export interface ExtractedData {
  wa_id: string;
  contatoNome: string;
  messageId: string;
  mensagem: string;
  timestamp: number;
  tipo: string;
  mediaId?: string; // ID da mídia no WhatsApp (para imagens, áudios, vídeos, etc.)
  mediaCaption?: string; // Legenda da mídia (se houver)
}

export interface WhatsAppWebhookBody {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        contacts?: Array<{
          profile?: {
            name?: string;
          };
          wa_id?: string;
        }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: {
            body?: string;
          };
          image?: {
            id?: string;
            mime_type?: string;
            sha256?: string;
            caption?: string;
          };
          audio?: {
            id?: string;
            mime_type?: string;
            sha256?: string;
          };
          video?: {
            id?: string;
            mime_type?: string;
            sha256?: string;
            caption?: string;
          };
          document?: {
            id?: string;
            mime_type?: string;
            sha256?: string;
            filename?: string;
          };
          location?: {
            latitude?: number;
            longitude?: number;
          };
        }>;
      };
      field?: string;
    }>;
  }>;
}

/**
 * Extrai dados relevantes do webhook do WhatsApp
 */
export function extractData(body: WhatsAppWebhookBody): ExtractedData | null {
  try {
    // Verifica se é um objeto do WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      return null;
    }

    // Percorre as entries
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        // Verifica se é uma mensagem
        if (change.field === 'messages' && change.value) {
          const value = change.value;

          // Extrai informações do contato
          const contact = value.contacts?.[0];
          const wa_id = contact?.wa_id || value.messages?.[0]?.from;

          if (!wa_id) {
            return null;
          }

          // Extrai informações da mensagem
          const message = value.messages?.[0];
          if (!message) {
            return null;
          }

          const messageId = message.id;
          if (!messageId) {
            return null;
          }

          // Extrai o conteúdo da mensagem baseado no tipo
          let mensagem = '';
          let tipo = message.type || 'texto';
          let mediaId: string | undefined;
          let mediaCaption: string | undefined;

          if (message.type === 'text' && message.text?.body) {
            mensagem = message.text.body;
            tipo = 'texto';
          } else if (message.type === 'image') {
            mediaId = message.image?.id;
            mediaCaption = message.image?.caption;
            mensagem = mediaCaption || '[Imagem]';
            tipo = 'imagem';
          } else if (message.type === 'audio') {
            mediaId = message.audio?.id;
            mensagem = '[Áudio]';
            tipo = 'audio';
          } else if (message.type === 'video') {
            mediaId = message.video?.id;
            mediaCaption = message.video?.caption;
            mensagem = mediaCaption || '[Vídeo]';
            tipo = 'video';
          } else if (message.type === 'document') {
            mediaId = message.document?.id;
            mensagem = message.document?.filename || '[Documento]';
            tipo = 'documento';
          } else if (message.type === 'location') {
            mensagem = `[Localização] Lat: ${message.location?.latitude}, Lng: ${message.location?.longitude}`;
            tipo = 'localizacao';
          } else {
            // Tipo não suportado ainda
            return null;
          }

          // Converte timestamp
          const timestamp = parseInt(message.timestamp || '0', 10);
          if (!timestamp || isNaN(timestamp)) {
            return null;
          }

          // Extrai nome do contato
          const contatoNome = contact?.profile?.name || '';

          return {
            wa_id,
            contatoNome,
            messageId,
            mensagem,
            timestamp,
            tipo,
            mediaId,
            mediaCaption,
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

