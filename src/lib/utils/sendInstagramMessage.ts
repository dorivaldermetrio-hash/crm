/**
 * Função para enviar mensagem via Instagram Graph API
 * 
 * Documentação: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/messaging
 */

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia uma mensagem de texto para um usuário via Instagram DM
 */
export async function sendInstagramMessage(
  to: string, // Instagram User ID ou username
  message: string
): Promise<SendMessageResponse> {
  try {
    // Variáveis de ambiente necessárias
    const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
    const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      return {
        success: false,
        error: 'Configuração do Instagram não encontrada. Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID no .env.local',
      };
    }

    // URL da API do Instagram Graph API
    // Para Instagram DM, usamos a API de mensagens do Instagram
    const url = `https://graph.facebook.com/v21.0/${INSTAGRAM_USER_ID}/messages`;

    // Corpo da requisição
    const body = {
      recipient: {
        id: to, // ID do usuário do Instagram
      },
      message: {
        text: message,
      },
    };

    // Faz a requisição
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro ao enviar mensagem no Instagram:', data);
      return {
        success: false,
        error: data.error?.message || `Erro ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      messageId: data.message_id || data.id || `ig_${Date.now()}`,
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem no Instagram:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

