import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route para fazer logout
 * POST /api/auth/logout
 * 
 * Remove os cookies de sessão
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Remove os cookies de sessão
    cookieStore.delete('userId');
    cookieStore.delete('userEmail');

    console.log('✅ Logout realizado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
