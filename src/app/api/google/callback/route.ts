import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/db';
import GoogleAdsAccount from '@/lib/models/GoogleAdsAccount';

/**
 * API Route para processar o callback do OAuth 2.0 do Google
 * GET /api/google/callback
 * 
 * Recebe o código de autorização do Google, troca por access_token e refresh_token,
 * e persiste o refresh_token no MongoDB associado ao usuário
 * 
 * Query params:
 * - code: Código de autorização do Google (obrigatório)
 * - customerId: ID da conta do Google Ads (obrigatório, 10 dígitos)
 * - userId: ID do usuário (opcional, padrão: 'default-user' para mock)
 */
export async function GET(request: NextRequest) {
  try {
    // Conecta ao banco de dados
    await connectDB();

    // Obtém os parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Tenta obter customerId e userId do query param (fallback)
    // Mas preferencialmente do state (mais seguro)
    let customerId = searchParams.get('customerId');
    let userId = searchParams.get('userId') || 'default-user';
    
    // Decodifica o state para obter customerId e userId se estiverem lá
    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        if (stateData.customerId) {
          customerId = stateData.customerId;
        }
        if (stateData.userId) {
          userId = stateData.userId;
        }
      } catch (e) {
        // Se não conseguir decodificar, usa os valores do query param
        console.warn('⚠️ Não foi possível decodificar o state, usando query params');
      }
    }
    
    // TODO: Em produção, obter userId da sessão/autenticação ao invés de query param/state

    // Verifica se houve erro na autorização
    if (error) {
      console.error('❌ Erro na autorização Google:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Erro na autorização: ${error}`,
        },
        { status: 400 }
      );
    }

    // Verifica se o código de autorização foi recebido
    if (!code) {
      console.error('❌ Código de autorização não recebido');
      return NextResponse.json(
        {
          success: false,
          error: 'Código de autorização não fornecido',
        },
        { status: 400 }
      );
    }

    // Valida se o customerId foi fornecido
    if (!customerId) {
      console.error('❌ customerId não fornecido');
      return NextResponse.json(
        {
          success: false,
          error: 'customerId é obrigatório. Forneça via query param: ?customerId=1234567890',
        },
        { status: 400 }
      );
    }

    // Valida formato do customerId
    const cleanCustomerId = customerId.replace(/-/g, '');
    if (!/^\d{10}$/.test(cleanCustomerId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId deve ter 10 dígitos (formato: 1234567890)',
        },
        { status: 400 }
      );
    }

    // Obtém as variáveis de ambiente
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
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

    if (!clientSecret) {
      console.error('❌ GOOGLE_ADS_CLIENT_SECRET não está configurado no .env.local');
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_ADS_CLIENT_SECRET não está configurado',
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

    console.log('🔄 Trocando código de autorização por tokens...');

    // Cria o cliente OAuth2
    const oauth2Client = new OAuth2Client({
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUri,
    });

    // Troca o código de autorização por tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Verifica se os tokens foram obtidos
    if (!tokens) {
      console.error('❌ Não foi possível obter os tokens');
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível obter os tokens de acesso',
        },
        { status: 500 }
      );
    }

    // Extrai os tokens importantes
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiryDate = tokens.expiry_date;

    // Valida se o access_token foi obtido
    if (!accessToken) {
      console.error('❌ access_token não foi retornado');
      return NextResponse.json(
        {
          success: false,
          error: 'access_token não foi retornado pelo Google',
        },
        { status: 500 }
      );
    }

    // Valida se o refresh_token foi obtido (obrigatório para persistir)
    if (!refreshToken) {
      console.warn('⚠️ refresh_token não foi retornado. O usuário pode precisar autorizar novamente.');
      return NextResponse.json(
        {
          success: false,
          error: 'refresh_token não foi retornado pelo Google. Tente autorizar novamente com prompt=consent.',
        },
        { status: 400 }
      );
    }

    console.log('✅ Tokens obtidos com sucesso!');
    console.log('📝 Access Token:', accessToken.substring(0, 20) + '...');
    console.log('📝 Refresh Token:', refreshToken.substring(0, 20) + '...');
    console.log('⏰ Expiry Date:', expiryDate ? new Date(expiryDate).toISOString() : 'não fornecido');
    console.log('👤 User ID:', userId);
    console.log('🏢 Customer ID:', cleanCustomerId);

    // Persiste ou atualiza o refresh_token no MongoDB
    // Usa upsert para criar se não existir, ou atualizar se já existir
    const accountData = {
      userId: userId,
      customerId: cleanCustomerId,
      refreshToken: refreshToken,
    };

    const savedAccount = await GoogleAdsAccount.findOneAndUpdate(
      { userId: userId, customerId: cleanCustomerId },
      accountData,
      {
        upsert: true, // Cria se não existir
        new: true, // Retorna o documento atualizado
        runValidators: true, // Executa validações do schema
      }
    );

    console.log('✅ Refresh token salvo no MongoDB com sucesso!');
    console.log('📝 Account ID:', savedAccount._id.toString());

    // Retorna sucesso sem expor os tokens (segurança)
    // Em produção, você pode redirecionar para uma página de sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Conta do Google Ads conectada com sucesso!',
        account: {
          id: savedAccount._id.toString(),
          userId: savedAccount.userId,
          customerId: savedAccount.customerId,
          createdAt: savedAccount.createdAt,
          updatedAt: savedAccount.updatedAt,
        },
        // NÃO retornamos os tokens por segurança
        // Eles estão salvos no MongoDB e serão recuperados automaticamente pelo service
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao processar callback OAuth:', error);

    // Trata erros específicos do Google Auth Library
    if (error instanceof Error) {
      // Erro de código inválido ou expirado
      if (error.message.includes('invalid_grant')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Código de autorização inválido ou expirado. Tente autorizar novamente.',
          },
          { status: 400 }
        );
      }

      // Erro de credenciais inválidas
      if (error.message.includes('invalid_client')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Credenciais do cliente inválidas. Verifique GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar callback',
      },
      { status: 500 }
    );
  }
}

