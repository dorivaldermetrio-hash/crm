import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * API Route para enviar um único email
 * POST /api/email/send-single
 * Body: { email: string, nome: string, subject: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, subject, message } = body;

    // Validações
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email é obrigatório',
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

    // Valida formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email inválido',
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
    
    // Substitui {nome} no assunto e na mensagem
    const nomeContato = nome || 'Cliente';
    const emailSubject = (subject || 'Campanha de Email').replace(/{nome}/g, nomeContato);
    const emailMessage = message.replace(/{nome}/g, nomeContato);

    // Envia o email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: email.trim(),
      subject: emailSubject,
      html: emailMessage.replace(/\n/g, '<br>'), // Converte quebras de linha para HTML
      text: emailMessage, // Versão texto plano
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email enviado com sucesso',
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

