/**
 * Função para enviar mensagem via WhatsApp Business API
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia uma mensagem de texto para um número via WhatsApp Business API
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<SendMessageResponse> {
  try {
    // Variáveis de ambiente necessárias
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return {
        success: false,
        error: 'Configuração do WhatsApp não encontrada. Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env.local',
      };
    }

    // Formata o número (remove caracteres não numéricos e adiciona código do país se necessário)
    const numeroFormatado = formatarNumero(to);

    // URL da API do WhatsApp
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

    // Corpo da requisição
    const body = {
      messaging_product: 'whatsapp',
      to: numeroFormatado,
      type: 'text',
      text: {
        body: message,
      },
    };

    // Faz a requisição
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Erro ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Formata o número de telefone para o formato do WhatsApp
 * Remove caracteres não numéricos e garante formato internacional
 */
function formatarNumero(numero: string): string {
  // Remove todos os caracteres não numéricos
  let numeroLimpo = numero.replace(/\D/g, '');

  // Se não começar com código do país, assume Brasil (55)
  if (!numeroLimpo.startsWith('55') && numeroLimpo.length === 11) {
    numeroLimpo = '55' + numeroLimpo;
  }

  return numeroLimpo;
}

