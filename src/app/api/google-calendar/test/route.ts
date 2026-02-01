import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarClient, getCalendarAPI, isGoogleCalendarConnected, getGoogleCalendarAccount } from '@/lib/google-calendar/client';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para testar a conexão com Google Calendar
 * GET /api/google-calendar/test
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    console.log('🧪 Testando conexão Google Calendar para userId:', userId);

    // 1. Verifica se está conectado
    const connected = await isGoogleCalendarConnected(userId);
    console.log('   Conectado:', connected);

    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Calendar não está conectado. Conecte primeiro em /agenda',
          connected: false,
        },
        { status: 400 }
      );
    }

    // 2. Busca informações da conta
    const account = await getGoogleCalendarAccount(userId);
    console.log('   Conta encontrada:', {
      email: account?.email,
      calendarId: account?.calendarId,
      hasRefreshToken: !!account?.refreshToken,
    });

    if (!account || !account.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token não encontrado na conta',
          connected: false,
        },
        { status: 400 }
      );
    }

    // 3. Tenta obter cliente autenticado
    console.log('   Obtendo cliente OAuth2...');
    const oauth2Client = await getGoogleCalendarClient(userId);
    
    if (!oauth2Client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível obter cliente OAuth2. Verifique as credenciais e o refresh token.',
          connected: false,
        },
        { status: 500 }
      );
    }

    // Verifica credenciais antes de criar a API
    const credentials = oauth2Client.credentials;
    console.log('   Credenciais do OAuth2Client:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'não fornecido',
      scopes: credentials.scope || 'não fornecido',
    });

    // 4. Tenta obter API do Calendar (reutilizando o oauth2Client já autenticado)
    console.log('   Obtendo API do Calendar...');
    const calendar = await getCalendarAPI(userId, oauth2Client);
    
    if (!calendar) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível obter API do Calendar',
          connected: false,
        },
        { status: 500 }
      );
    }

    // 5. Testa se o auth está funcionando fazendo uma requisição direta primeiro
    console.log('   Verificando se o auth está funcionando...');
    try {
      // Testa se o auth pode fazer uma requisição simples
      const testAuth = oauth2Client.credentials;
      console.log('   Auth credentials antes da chamada:', {
        hasAccessToken: !!testAuth.access_token,
        accessTokenPreview: testAuth.access_token ? testAuth.access_token.substring(0, 30) + '...' : 'não presente',
        expiryDate: testAuth.expiry_date ? new Date(testAuth.expiry_date).toISOString() : 'não fornecido',
      });
    } catch (authError) {
      console.error('   Erro ao verificar auth:', authError);
    }

    // 6. Testa fazer uma requisição manual primeiro para verificar se o auth funciona
    console.log('   Testando requisição manual com o auth...');
    try {
      // Tenta fazer uma requisição manual usando o oauth2Client diretamente
      const testResponse = await oauth2Client.request({
        url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        method: 'GET',
        params: {
          maxResults: 1,
        },
      });
      console.log('   ✅ Requisição manual funcionou!', testResponse.status);
    } catch (manualError: any) {
      console.error('   ❌ Requisição manual falhou:', manualError.message);
      console.error('   Status:', manualError.response?.status);
      console.error('   Data:', JSON.stringify(manualError.response?.data, null, 2));
    }

    // 7. Tenta listar calendários usando a API do googleapis
    // IMPORTANTE: Como a requisição manual funciona mas o googleapis não,
    // vamos recriar a instância do Calendar API ANTES de fazer a chamada
    // para garantir que está usando o auth mais recente
    console.log('   Recriando instância do Calendar API com auth atualizado...');
    const calendarFresh = google.calendar({ 
      version: 'v3', 
      auth: oauth2Client, // Usa o auth já autenticado
    });
    
    console.log('   Testando acesso à API (listando calendários)...');
    try {
      const calendars = await calendarFresh.calendarList.list({
        maxResults: 1,
      });

      console.log('✅ Teste bem-sucedido!');
      
      return NextResponse.json(
        {
          success: true,
          connected: true,
          account: {
            email: account.email,
            calendarId: account.calendarId,
          },
          test: {
            canAccessAPI: true,
            calendarsFound: calendars.data.items?.length || 0,
          },
        },
        { status: 200 }
      );
    } catch (apiError: any) {
      console.error('❌ Erro ao acessar API:', apiError);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao acessar Google Calendar API',
          connected: true, // Está conectado, mas API falhou
          details: {
            message: apiError.message,
            code: apiError.code,
            status: apiError.response?.status,
            data: apiError.response?.data,
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        connected: false,
      },
      { status: 500 }
    );
  }
}
