import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/services/googleAds.service';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para testar a conexão com Google Ads API
 * GET /api/google-ads/test
 * 
 * Query params:
 * - customerId: ID da conta do Google Ads (10 dígitos, obrigatório)
 * - userId: ID do usuário (opcional, padrão: obtido da sessão/mock)
 * 
 * O refresh_token é buscado automaticamente do MongoDB.
 * 
 * Exemplo:
 * GET /api/google-ads/test?customerId=1234567890
 * GET /api/google-ads/test?customerId=1234567890&userId=user123
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém os parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    
    // Obtém userId (mockado por enquanto, será da sessão em produção)
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam || await getUserId(request);

    // Valida parâmetros obrigatórios
    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId é obrigatório. Forneça via query param: ?customerId=1234567890',
        },
        { status: 400 }
      );
    }

    console.log('🧪 Iniciando teste de conexão com Google Ads API...');
    console.log('👤 User ID:', userId);
    console.log('📝 Customer ID:', customerId);

    // Executa o teste de conexão (refresh_token será buscado do MongoDB)
    const result = await testConnection(userId, customerId);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: {
            customerId: result.customerId,
            campaignsFound: result.campaignsFound,
            sampleCampaigns: result.sampleCampaigns,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão Google Ads:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao testar conexão',
      },
      { status: 500 }
    );
  }
}

