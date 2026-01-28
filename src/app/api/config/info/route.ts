import { NextRequest, NextResponse } from 'next/server';
import { getOllamaModel } from '@/lib/config/ollama';

/**
 * API Route para buscar informações de configuração (apenas leitura)
 * GET /api/config/info
 * Retorna informações sobre variáveis de ambiente (mascaradas)
 */
export async function GET() {
  try {
    // Retorna informações mascaradas das variáveis de ambiente
    return NextResponse.json(
      {
        success: true,
        data: {
          ollama: {
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: getOllamaModel(),
            enabled: process.env.OLLAMA_AUTO_REPLY_ENABLED !== 'false',
          },
          whatsapp: {
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? maskValue(process.env.WHATSAPP_PHONE_NUMBER_ID) : null,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN ? 'configured' : null,
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ? 'configured' : null,
          },
          instagram: {
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN ? 'configured' : null,
            userId: process.env.INSTAGRAM_USER_ID ? maskValue(process.env.INSTAGRAM_USER_ID) : null,
            verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN ? 'configured' : null,
          },
          email: {
            host: process.env.EMAIL_SERVER_HOST || null,
            port: process.env.EMAIL_SERVER_PORT || null,
            user: process.env.EMAIL_SERVER_USER || null,
            password: process.env.EMAIL_SERVER_PASSWORD ? 'configured' : null,
            from: process.env.EMAIL_FROM || null,
          },
          mongodb: {
            url: process.env.MONGODB_URL ? maskValue(process.env.MONGODB_URL) : null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar informações de configuração:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

function maskValue(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '•'.repeat(value.length);
  return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 12)) + value.substring(value.length - 4);
}

