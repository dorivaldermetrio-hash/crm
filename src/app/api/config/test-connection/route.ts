import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/utils/sendWhatsAppMessage';
import { sendInstagramMessage } from '@/lib/utils/sendInstagramMessage';
import nodemailer from 'nodemailer';
import connectDB from '@/lib/db';
import { getOllamaModel } from '@/lib/config/ollama';

/**
 * API Route para testar conexões
 * POST /api/config/test-connection
 * Body: { type: 'whatsapp' | 'instagram' | 'email' | 'mongodb' | 'ollama' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'whatsapp':
        return await testWhatsApp();
      case 'instagram':
        return await testInstagram();
      case 'email':
        return await testEmail();
      case 'mongodb':
        return await testMongoDB();
      case 'ollama':
        return await testOllama();
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de conexão inválido' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

async function testWhatsApp() {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'Configuração do WhatsApp não encontrada',
      details: 'Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env.local',
    });
  }

  // Tenta fazer uma requisição simples para verificar o token
  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Conexão com WhatsApp estabelecida com sucesso',
      });
    } else {
      const data = await response.json();
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Erro ao conectar com WhatsApp',
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar conexão',
    });
  }
}

async function testInstagram() {
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return NextResponse.json({
      success: false,
      error: 'Configuração do Instagram não encontrada',
      details: 'Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID no .env.local',
    });
  }

  // Tenta fazer uma requisição simples para verificar o token
  try {
    const url = `https://graph.facebook.com/v21.0/${INSTAGRAM_USER_ID}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Conexão com Instagram estabelecida com sucesso',
      });
    } else {
      const data = await response.json();
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Erro ao conectar com Instagram',
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar conexão',
    });
  }
}

async function testEmail() {
  const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
  const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT;
  const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
  const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_PORT || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
    return NextResponse.json({
      success: false,
      error: 'Configuração de email incompleta',
      details: 'Configure todas as variáveis de email no .env.local',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER_HOST,
      port: parseInt(EMAIL_SERVER_PORT),
      secure: EMAIL_SERVER_PORT === '465',
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD,
      },
    });

    // Testa a conexão
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: 'Conexão com servidor de email estabelecida com sucesso',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com servidor de email',
    });
  }
}

async function testMongoDB() {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      message: 'Conexão com MongoDB estabelecida com sucesso',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com MongoDB',
    });
  }
}

async function testOllama() {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const OLLAMA_MODEL = getOllamaModel();

  try {
    // Testa se o servidor Ollama está rodando
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Servidor Ollama não está respondendo',
        details: `Verifique se o Ollama está rodando em ${OLLAMA_URL}`,
      });
    }

    // Verifica se o modelo está disponível
    const data = await response.json();
    const modelos = data.models || [];
    const modeloExiste = modelos.some((m: any) => m.name.includes(OLLAMA_MODEL.split(':')[0]));

    if (!modeloExiste) {
      return NextResponse.json({
        success: false,
        error: `Modelo ${OLLAMA_MODEL} não encontrado`,
        details: `Execute: ollama pull ${OLLAMA_MODEL}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com Ollama estabelecida com sucesso',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com Ollama',
      details: `Verifique se o Ollama está rodando em ${OLLAMA_URL}`,
    });
  }
}

