import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GoogleAdsAccount from '@/lib/models/GoogleAdsAccount';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para listar contas do Google Ads conectadas
 * GET /api/google-ads/accounts
 * 
 * Retorna todas as contas do Google Ads associadas ao usuário autenticado
 * 
 * Query params:
 * - userId: ID do usuário (opcional, padrão: obtido da sessão/mock)
 * 
 * Exemplo:
 * GET /api/google-ads/accounts
 * GET /api/google-ads/accounts?userId=user123
 */
export async function GET(request: NextRequest) {
  try {
    // Conecta ao banco de dados
    await connectDB();

    // Obtém userId (mockado por enquanto)
    const userIdParam = request.nextUrl.searchParams.get('userId');
    const userId = userIdParam || await getUserId(request);

    console.log('📋 Listando contas do Google Ads para userId:', userId);

    // Busca todas as contas do usuário
    const accounts = await GoogleAdsAccount.find({ userId: userId })
      .select('userId customerId createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Formata os resultados (NÃO expõe refresh_token)
    const formattedAccounts = accounts.map((account: any) => ({
      id: account._id.toString(),
      userId: account.userId,
      customerId: account.customerId,
      createdAt: account.createdAt ? new Date(account.createdAt).toISOString() : null,
      updatedAt: account.updatedAt ? new Date(account.updatedAt).toISOString() : null,
    }));

    console.log(`✅ ${formattedAccounts.length} conta(s) encontrada(s)`);

    return NextResponse.json(
      {
        success: true,
        total: formattedAccounts.length,
        accounts: formattedAccounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao listar contas:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao listar contas',
      },
      { status: 500 }
    );
  }
}

