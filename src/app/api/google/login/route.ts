import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para iniciar o fluxo OAuth 2.0 do Google
 * GET /api/google/login
 * 
 * Redireciona o usuário para a página de autorização do Google
 * com o scope necessário para Google Ads API
 * 
 * Query params:
 * - customerId: ID da conta do Google Ads (opcional, será passado no callback)
 * - userId: ID do usuário (opcional, padrão: 'default-user' para mock)
 * 
 * Exemplo:
 * GET /api/google/login
 * GET /api/google/login?customerId=1234567890
 * GET /api/google/login?customerId=1234567890&userId=user123
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém parâmetros opcionais da query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const userId = searchParams.get('userId') || 'default-user';

    // Obtém as variáveis de ambiente
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

    // Valida se as variáveis de ambiente estão configuradas
    if (!clientId) {
      console.error('❌ GOOGLE_ADS_CLIENT_ID não está configurado no .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_ADS_CLIENT_ID não está configurado',
        },
        { status: 500 }
      );
    }

    if (!redirectUri) {
      console.error('❌ GOOGLE_ADS_REDIRECT_URI não está configurado no .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_ADS_REDIRECT_URI não está configurado',
        },
        { status: 500 }
      );
    }

    // Scope necessário para Google Ads API
    const scope = 'https://www.googleapis.com/auth/adwords';

    // Gera um state aleatório para segurança (proteção CSRF)
    // Inclui customerId e userId no state para recuperar no callback
    // NOTA: O redirect_uri deve ser fixo no Google Cloud Console, então passamos dados via state
    const stateData = {
      random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      customerId: customerId || '',
      userId: userId,
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Parâmetros da URL de autorização do Google
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri, // Deve ser exatamente o mesmo configurado no Google Cloud Console
      response_type: 'code',
      scope: scope,
      access_type: 'offline', // Necessário para obter refresh_token
      prompt: 'consent', // Força a tela de consentimento para garantir refresh_token
      state: state, // Proteção CSRF + dados adicionais (customerId, userId)
    });

    // URL de autorização do Google OAuth 2.0
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

    console.log('🔐 Redirecionando para autorização Google OAuth...');
    console.log('📍 URL:', authUrl);

    // Redireciona o usuário para a página de autorização do Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('❌ Erro ao iniciar fluxo OAuth:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao iniciar OAuth',
      },
      { status: 500 }
    );
  }
}

