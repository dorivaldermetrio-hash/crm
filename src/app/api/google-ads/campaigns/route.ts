import { NextRequest, NextResponse } from 'next/server';
import { listCampaigns } from '@/lib/services/googleAds.service';
import { enums } from 'google-ads-api';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para listar campanhas do Google Ads
 * GET /api/google-ads/campaigns
 * 
 * Query params:
 * - customerId: ID da conta do Google Ads (obrigatório, 10 dígitos)
 * - userId: ID do usuário (opcional, padrão: obtido da sessão/mock)
 * - status: Status das campanhas (opcional: ENABLED, PAUSED, REMOVED)
 * - limit: Limite de resultados (opcional, padrão: 1000)
 * 
 * O refresh_token é buscado automaticamente do MongoDB.
 * 
 * Exemplo:
 * GET /api/google-ads/campaigns?customerId=1234567890
 * GET /api/google-ads/campaigns?customerId=1234567890&status=ENABLED&limit=50
 * GET /api/google-ads/campaigns?customerId=1234567890&userId=user123
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém os parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    
    // Obtém userId (mockado por enquanto, será da sessão em produção)
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam || getUserId(request);

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

    // Prepara opções para listagem
    const options: {
      status?: enums.CampaignStatus;
      limit?: number;
    } = {};

    // Processa status se fornecido
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase();
      if (statusUpper === 'ENABLED') {
        options.status = enums.CampaignStatus.ENABLED;
      } else if (statusUpper === 'PAUSED') {
        options.status = enums.CampaignStatus.PAUSED;
      } else if (statusUpper === 'REMOVED') {
        options.status = enums.CampaignStatus.REMOVED;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Status inválido. Use: ENABLED, PAUSED ou REMOVED',
          },
          { status: 400 }
        );
      }
    }

    // Processa limit se fornecido
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 10000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Limit deve ser um número entre 1 e 10000',
          },
          { status: 400 }
        );
      }
      options.limit = limit;
    }

    console.log('📋 Listando campanhas do Google Ads...');
    console.log('👤 User ID:', userId);
    console.log('📝 Customer ID:', customerId);
    console.log('📝 Status:', options.status || 'ENABLED (padrão)');
    console.log('📝 Limit:', options.limit || 1000);

    // Lista as campanhas (refresh_token será buscado do MongoDB)
    const result = await listCampaigns(userId, customerId, options);

    return NextResponse.json(
      {
        success: true,
        total: result.total,
        campaigns: result.campaigns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao listar campanhas:', error);

    // Trata erros específicos
    if (error instanceof Error) {
      // Erro de conta não encontrada no banco
      if (error.message.includes('Conta do Google Ads não encontrada')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize a conta primeiro através do OAuth: GET /api/google/login?customerId=...',
          },
          { status: 404 }
        );
      }

      // Erro de refresh token não encontrado
      if (error.message.includes('Refresh token não encontrado')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize a conta novamente através do OAuth: GET /api/google/login?customerId=...',
          },
          { status: 401 }
        );
      }

      // Erro de autenticação
      if (error.message.includes('Token de autenticação inválido') || error.message.includes('invalid_grant')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'O refresh_token pode ter expirado. Autorize a conta novamente através do OAuth: GET /api/google/login?customerId=...',
          },
          { status: 401 }
        );
      }

      // Erro de permissão
      if (error.message.includes('Sem permissão')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Verifique se a conta tem permissão para acessar este customer_id',
          },
          { status: 403 }
        );
      }

      // Erro de customer ID
      if (error.message.includes('Customer ID inválido')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'O customer_id deve ter 10 dígitos (formato: 1234567890)',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao listar campanhas',
      },
      { status: 500 }
    );
  }
}

