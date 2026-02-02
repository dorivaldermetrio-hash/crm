import { NextResponse } from 'next/server';

/**
 * API Route para manter o projeto "aquecido" na Vercel
 * GET /api/cron/keep-alive
 * 
 * Esta rota é chamada a cada 10 minutos pelo Vercel Cron para evitar
 * que o projeto entre em "cold start" e garante que webhooks sejam recebidos
 */
export async function GET() {
  try {
    // Apenas retorna sucesso para manter a função ativa
    return NextResponse.json({
      success: true,
      message: 'Keep-alive ping successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
