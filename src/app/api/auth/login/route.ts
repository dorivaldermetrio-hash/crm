import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para iniciar o fluxo OAuth 2.0 do Google
 * GET /api/auth/login
 * 
 * Redireciona o usuário para a página de autorização do Google
 * com os scopes necessários para Google Calendar e Google Ads
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém a URL de retorno (se houver)
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/';

    // Obtém as variáveis de ambiente
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    // Sempre usa /api/auth/callback para o fluxo de login principal
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`;

    // Valida se as variáveis de ambiente estão configuradas
    if (!clientId) {
      console.error('❌ GOOGLE_CALENDAR_CLIENT_ID não está configurado no .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_CALENDAR_CLIENT_ID não está configurado',
        },
        { status: 500 }
      );
    }


    // Scopes necessários para Google Calendar API e Google Ads API
    const scopes = [
      'https://www.googleapis.com/auth/calendar', // Google Calendar (escopo completo)
      'https://www.googleapis.com/auth/adwords',   // Google Ads API
      'https://www.googleapis.com/auth/userinfo.email', // Email do usuário
      'https://www.googleapis.com/auth/userinfo.profile', // Perfil do usuário
    ];
    const scope = scopes.join(' ');

    // Gera um state aleatório para segurança (proteção CSRF)
    // Inclui a URL de retorno no state para redirecionar após login
    const state = Buffer.from(
      JSON.stringify({
        returnUrl: returnUrl,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // URL de autorização do Google OAuth 2.0
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline'); // Necessário para obter refresh_token
    authUrl.searchParams.set('prompt', 'consent'); // Força a tela de consentimento para garantir refresh_token
    authUrl.searchParams.set('state', state);

    console.log('🔐 Redirecionando para autorização Google OAuth...');
    console.log('📍 Return URL:', returnUrl);
    console.log('🔗 Redirect URI enviado ao Google:', redirectUri);
    console.log('🔑 Client ID:', clientId?.substring(0, 20) + '...');

    // Redireciona para a página de autorização do Google
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Erro ao iniciar fluxo OAuth:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
