/**
 * Extrai e normaliza dados do webhook do Instagram
 */

export interface ExtractedDataInstagram {
  instagram_id: string; // ID do usuário do Instagram que enviou a mensagem
  username: string; // @ do usuário
  messageId: string;
  mensagem: string;
  timestamp: number;
  tipo: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface InstagramWebhookBody {
  object: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: {
        id?: string;
      };
      recipient?: {
        id?: string;
      };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        attachments?: Array<{
          type?: string;
          payload?: {
            url?: string;
          };
        }>;
      };
    }>;
    changes?: Array<{
      value?: {
        messaging?: Array<{
          sender?: {
            id?: string;
          };
          recipient?: {
            id?: string;
          };
          timestamp?: number;
          message?: {
            mid?: string;
            text?: string;
            attachments?: Array<{
              type?: string;
              payload?: {
                url?: string;
              };
            }>;
          };
        }>;
        from?: {
          id?: string;
          username?: string;
        };
        message?: {
          id?: string;
          text?: string;
          attachments?: Array<{
            type?: string;
            image_url?: string;
            video_url?: string;
          }>;
        };
        timestamp?: number;
      };
      field?: string;
    }>;
  }>;
}

/**
 * Extrai dados relevantes do webhook do Instagram
 * Instagram Graph API usa formato diferente do WhatsApp
 */
export function extractDataInstagram(body: InstagramWebhookBody): ExtractedDataInstagram | null {
  try {
    // Verifica se é um objeto do Instagram
    if (body.object !== 'instagram') {
      return null;
    }

    // Percorre as entries
    for (const entry of body.entry || []) {
      // Tenta primeiro o formato messaging (Facebook Messenger style)
      if (entry.messaging && entry.messaging.length > 0) {
        for (const messaging of entry.messaging) {
          const message = messaging.message;
          const sender = messaging.sender;

          if (!message || !sender?.id) {
            continue;
          }

          const messageId = message.mid;
          if (!messageId) {
            continue;
          }

          // Extrai o conteúdo da mensagem
          let mensagem = '';
          let tipo = 'texto';
          let mediaId: string | undefined;
          let mediaUrl: string | undefined;
          let mediaCaption: string | undefined;

          if (message.text) {
            mensagem = message.text;
            tipo = 'texto';
          } else if (message.attachments && message.attachments.length > 0) {
            const attachment = message.attachments[0];
            mediaUrl = attachment.payload?.url;
            mediaId = mediaUrl;
            
            switch (attachment.type) {
              case 'image':
                tipo = 'imagem';
                mensagem = '[Imagem]';
                break;
              case 'video':
                tipo = 'video';
                mensagem = '[Vídeo]';
                break;
              case 'audio':
                tipo = 'audio';
                mensagem = '[Áudio]';
                break;
              default:
                tipo = 'documento';
                mensagem = '[Anexo]';
            }
          } else {
            continue;
          }

          const timestamp = messaging.timestamp || Date.now();
          const timestampSeconds = Math.floor(timestamp / 1000);
          const instagram_id = sender.id;

          return {
            instagram_id,
            username: '', // Será preenchido depois via API
            messageId,
            mensagem,
            timestamp: timestampSeconds,
            tipo,
            mediaId,
            mediaUrl,
            mediaCaption,
          };
        }
      }

      // Tenta o formato changes (Instagram Graph API style)
      if (entry.changes && entry.changes.length > 0) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') {
            continue;
          }

          const value = change.value;
          if (!value) {
            continue;
          }

          // Formato 1: messaging array
          if (value.messaging && value.messaging.length > 0) {
            const messaging = value.messaging[0];
            const message = messaging.message;
            const sender = messaging.sender;

            if (!message || !sender?.id) {
              continue;
            }

            const messageId = message.mid || '';
            if (!messageId) {
              continue;
            }

            let mensagem = message.text || '';
            let tipo = 'texto';
            let mediaId: string | undefined;
            let mediaUrl: string | undefined;

            if (message.attachments && message.attachments.length > 0) {
              const attachment = message.attachments[0];
              mediaUrl = attachment.payload?.url || attachment.image_url || attachment.video_url;
              mediaId = mediaUrl;
              tipo = attachment.type === 'image' ? 'imagem' : attachment.type === 'video' ? 'video' : 'documento';
              mensagem = mensagem || `[${tipo}]`;
            }

            const timestamp = messaging.timestamp || value.timestamp || Date.now();
            const timestampSeconds = Math.floor(timestamp / 1000);
            const instagram_id = sender.id;

            return {
              instagram_id,
              username: value.from?.username || '',
              messageId,
              mensagem,
              timestamp: timestampSeconds,
              tipo,
              mediaId,
              mediaUrl,
            };
          }

          // Formato 2: message direto
          if (value.message) {
            const message = value.message;
            const from = value.from;

            if (!from?.id) {
              continue;
            }

            const messageId = message.id || '';
            if (!messageId) {
              continue;
            }

            let mensagem = message.text || '';
            let tipo = 'texto';
            let mediaId: string | undefined;
            let mediaUrl: string | undefined;

            if (message.attachments && message.attachments.length > 0) {
              const attachment = message.attachments[0];
              mediaUrl = attachment.image_url || attachment.video_url;
              mediaId = mediaUrl;
              tipo = attachment.image_url ? 'imagem' : 'video';
              mensagem = mensagem || `[${tipo}]`;
            }

            const timestamp = value.timestamp || Date.now();
            const timestampSeconds = Math.floor(timestamp / 1000);
            const instagram_id = from.id;

            return {
              instagram_id,
              username: from.username || '',
              messageId,
              mensagem,
              timestamp: timestampSeconds,
              tipo,
              mediaId,
              mediaUrl,
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao extrair dados do Instagram:', error);
    return null;
  }
}

