import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';

/**
 * API Route para verificar se o usuário está autenticado
 * GET /api/auth/me
 * 
 * Retorna informações do usuário autenticado baseado na sessão (cookie)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const userEmail = cookieStore.get('userEmail')?.value;

    console.log('🔍 Verificando autenticação - userId:', userId ? 'encontrado' : 'não encontrado');
    console.log('🔍 userEmail:', userEmail || 'não encontrado');

    if (!userId) {
      console.log('❌ Usuário não autenticado (sem userId no cookie)');
      return NextResponse.json({
        success: false,
        user: null,
      });
    }

    // Busca informações adicionais do usuário no MongoDB (se necessário)
    await connectDB();
    const account = await GoogleCalendarAccount.findOne({ userId }).lean();

    const userData = {
      userId: userId,
      email: userEmail || account?.email || '',
      name: account?.name || '',
      picture: account?.picture || '',
    };

    console.log('✅ Usuário autenticado:', userData);

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
