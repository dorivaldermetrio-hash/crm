import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para iniciar o fluxo OAuth 2.0 do Google Calendar
 * GET /api/google-calendar/auth
 * 
 * Redireciona o usuário para a página de autorização do Google
 * com o scope necessário para Google Calendar API
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    // Obtém as variáveis de ambiente
    // Pode reutilizar as credenciais do Google Ads ou usar específicas
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-calendar/callback`;

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

    if (!redirectUri) {
      console.error('❌ GOOGLE_CALENDAR_REDIRECT_URI não está configurado no .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_CALENDAR_REDIRECT_URI não está configurado',
        },
        { status: 500 }
      );
    }

    // Scope necessário para Google Calendar API
    // Usa calendar (escopo completo) para ter todas as permissões necessárias:
    // - Criar, atualizar e deletar eventos
    // - Listar calendários
    // - Todas as operações do Google Calendar
    const scope = 'https://www.googleapis.com/auth/calendar';

    // Gera um state aleatório para segurança (proteção CSRF)
    const stateData = {
      random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      userId: userId,
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Parâmetros da URL de autorização do Google
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline', // Necessário para obter refresh_token
      prompt: 'consent', // Força a tela de consentimento para garantir refresh_token
      state: state, // Proteção CSRF + userId
    });

    // URL de autorização do Google OAuth 2.0
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

    console.log('🔐 Redirecionando para autorização Google Calendar OAuth...');
    console.log('📍 Scope solicitado:', scope);
    console.log('📍 Client ID:', clientId?.substring(0, 30) + '...');
    console.log('📍 Redirect URI:', redirectUri);
    console.log('📍 URL completa:', authUrl);

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
