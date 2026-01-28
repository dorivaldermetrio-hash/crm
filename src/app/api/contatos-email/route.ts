import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContatoEmail from '@/lib/models/ContatoEmail';

/**
 * API Route para criar um novo contato email
 * POST /api/contatos-email
 * Body: { nome: string, email: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validações
    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome é obrigatório',
        },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email é obrigatório',
        },
        { status: 400 }
      );
    }

    // Valida formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email inválido',
        },
        { status: 400 }
      );
    }

    // Verifica se o email já existe
    const emailExistente = await ContatoEmail.findOne({ email: body.email.trim().toLowerCase() });
    if (emailExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado',
        },
        { status: 400 }
      );
    }

    // Cria o novo contato email
    const novoContatoEmail = new ContatoEmail({
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
    });

    const contatoEmailSalvo = await novoContatoEmail.save();

    console.log('✅ Contato email criado:', {
      id: contatoEmailSalvo._id.toString(),
      nome: contatoEmailSalvo.nome,
      email: contatoEmailSalvo.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contato email criado com sucesso',
        contatoEmail: {
          id: contatoEmailSalvo._id.toString(),
          nome: contatoEmailSalvo.nome,
          email: contatoEmailSalvo.email,
          createdAt: contatoEmailSalvo.createdAt
            ? new Date(contatoEmailSalvo.createdAt).toISOString()
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar contato email:', error);
    
    // Erro de duplicação
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para buscar todos os contatos email
 * GET /api/contatos-email
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os contatos email, ordenados por nome
    const contatosEmail = await ContatoEmail.find({})
      .sort({ nome: 1, createdAt: -1 })
      .select('nome email createdAt')
      .lean();

    return NextResponse.json(
      {
        success: true,
        contatosEmail: contatosEmail.map((contato: any) => ({
          id: contato._id.toString(),
          nome: contato.nome,
          email: contato.email,
          createdAt: contato.createdAt
            ? new Date(contato.createdAt).toISOString()
            : null,
        })),
        total: contatosEmail.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar contatos email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        contatosEmail: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

