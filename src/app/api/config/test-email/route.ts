import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * API Route para testar envio de email
 * POST /api/config/test-email
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
    const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT;
    const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
    const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
    const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_SERVER_USER;

    if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_PORT || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Configuração de email incompleta',
      });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER_HOST,
      port: parseInt(EMAIL_SERVER_PORT),
      secure: EMAIL_SERVER_PORT === '465',
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Teste de Email - WhatsApp CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Teste de Email</h2>
          <p>Este é um email de teste enviado pelo sistema WhatsApp CRM.</p>
          <p>Se você recebeu este email, significa que a configuração de email está funcionando corretamente!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Enviado em ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
      text: 'Este é um email de teste enviado pelo sistema WhatsApp CRM. Se você recebeu este email, significa que a configuração de email está funcionando corretamente!',
    });

    return NextResponse.json({
      success: true,
      message: `Email de teste enviado para ${email}`,
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar email',
      },
      { status: 500 }
    );
  }
}

