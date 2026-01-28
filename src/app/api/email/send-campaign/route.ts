import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * API Route para enviar campanha de email
 * POST /api/email/send-campaign
 * Body: { emails: string[], subject: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails, subject, message } = body;

    // Validações
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lista de emails é obrigatória',
        },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mensagem é obrigatória',
        },
        { status: 400 }
      );
    }

    // Configuração do transporter Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
      secure: parseInt(process.env.EMAIL_SERVER_PORT || '465') === 465,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Valida se as credenciais estão configuradas
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciais de email não configuradas. Configure EMAIL_SERVER_USER e EMAIL_SERVER_PASSWORD no .env.local',
        },
        { status: 500 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;
    const emailSubject = subject || 'Campanha de Email';

    // Envia emails em lote
    const results = [];
    
    for (const email of emails) {
      try {
        const info = await transporter.sendMail({
          from: emailFrom,
          to: email,
          subject: emailSubject,
          html: message.replace(/\n/g, '<br>'), // Converte quebras de linha para HTML
          text: message, // Versão texto plano
        });

        results.push({
          email,
          success: true,
          messageId: info.messageId,
        });
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        success: true,
        message: `Campanha enviada: ${successCount} sucesso, ${errorCount} erros`,
        results,
        total: emails.length,
        successCount,
        errorCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao enviar campanha de email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

