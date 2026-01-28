import { NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/utils/processScheduledPosts';

/**
 * API Route para processar posts agendados manualmente
 * GET /api/cron/scheduled-posts - Processa posts agendados
 * 
 * Esta rota também é usada para inicializar o processador automático
 */
export async function GET() {
  try {
    await processScheduledPosts();
    return NextResponse.json({
      success: true,
      message: 'Posts agendados processados com sucesso',
    });
  } catch (error) {
    console.error('Erro ao processar posts agendados:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar posts',
      },
      { status: 500 }
    );
  }
}

