import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';
import { configurarWatchGoogleCalendar } from '@/lib/google-calendar/watch';
import { cookies } from 'next/headers';

/**
 * API Route para processar o callback do OAuth 2.0 do Google Calendar
 * GET /api/google-calendar/callback
 * 
 * Recebe o código de autorização do Google, troca por access_token e refresh_token,
 * e persiste o refresh_token no MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');

    // Decodifica o state para obter returnUrl
    let returnUrl = '/';
    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        if (stateData.returnUrl) {
          returnUrl = stateData.returnUrl;
        }
        // Compatibilidade com formato antigo
        if (stateData.userId && !stateData.returnUrl) {
          // Formato antigo, ignora
        }
      } catch (e) {
        console.warn('⚠️ Não foi possível decodificar o state');
      }
    }

    // Verifica se houve erro na autorização
    if (error) {
      console.error('❌ Erro na autorização Google Calendar:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(error)}`
      );
    }

    // Verifica se o código de autorização foi recebido
    if (!code) {
      console.error('❌ Código de autorização não recebido');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=no_code`
      );
    }

    // Obtém as variáveis de ambiente
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-calendar/callback`;

    // Valida se as variáveis de ambiente estão configuradas
    if (!clientId || !clientSecret) {
      console.error('❌ Credenciais do Google Calendar não configuradas');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=config`
      );
    }

    console.log('🔄 Trocando código de autorização por tokens...');

    // Cria o cliente OAuth2
    const oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    // Troca o código de autorização por tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Verifica se os tokens foram obtidos
    if (!tokens) {
      console.error('❌ Não foi possível obter os tokens');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=no_tokens`
      );
    }

    // Extrai os tokens importantes
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // Valida se o refresh_token foi obtido
    if (!refreshToken) {
      console.warn('⚠️ refresh_token não foi retornado');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=no_refresh_token`
      );
    }

    // Obtém informações do usuário (email, nome, foto) usando o access token
    let email = '';
    let name = '';
    let picture = '';
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const response = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        method: 'GET',
      });
      const userInfo = response.data as { email?: string; name?: string; picture?: string };
      email = userInfo.email || '';
      name = userInfo.name || '';
      picture = userInfo.picture || '';
    } catch (e) {
      console.warn('⚠️ Não foi possível obter informações do usuário');
    }

    // Usa o email como userId (não "default-user")
    const userId = email || `user-${Date.now()}`;

    console.log('✅ Tokens obtidos com sucesso!');
    console.log('👤 User ID:', userId);
    console.log('📧 Email:', email);
    console.log('👤 Nome:', name);
    console.log('🔑 Scope do token:', tokens.scope || 'não fornecido');
    console.log('⏰ Token expira em:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'não fornecido');

    // Persiste ou atualiza o refresh_token no MongoDB
    const accountData = {
      userId: userId,
      refreshToken: refreshToken,
      email: email,
      name: name,
      picture: picture,
      calendarId: 'primary', // Calendário principal por padrão
    };

    const savedAccount = await GoogleCalendarAccount.findOneAndUpdate(
      { userId: userId },
      accountData,
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log('✅ Refresh token salvo no MongoDB com sucesso!');
    console.log('📝 Account ID:', savedAccount._id.toString());

    // Configura o watch (webhook) para receber notificações do Google Calendar
    try {
      console.log('📡 Configurando watch do Google Calendar...');
      const { configurarWatchGoogleCalendar } = await import('@/lib/google-calendar/watch');
      await configurarWatchGoogleCalendar(userId);
    } catch (watchError) {
      console.error('⚠️ Erro ao configurar watch (não crítico):', watchError);
      // Não falha o callback se o watch não puder ser configurado
    }

    // Cria uma sessão usando cookies
    const cookieStore = await cookies();
    
    // Define os cookies antes de redirecionar
    cookieStore.set('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    });
    cookieStore.set('userEmail', email, {
      httpOnly: false, // Permite acesso no client-side para exibir
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    console.log('✅ Sessão criada com sucesso!');
    console.log('🍪 Cookies definidos:', { userId, email });

    // Cria a resposta de redirect
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${returnUrl}`;
    console.log('🔄 Redirecionando para:', redirectUrl);
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Garante que os cookies sejam enviados no header da resposta
    response.cookies.set('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    response.cookies.set('userEmail', email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ Erro ao processar callback OAuth:', error);

    // Trata erros específicos
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=invalid_grant`
        );
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=unknown`
    );
  }
}
