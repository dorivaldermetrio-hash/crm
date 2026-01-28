import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContatoEmail from '@/lib/models/ContatoEmail';
import mongoose from 'mongoose';

/**
 * API Route para atualizar um contato email
 * PUT /api/contatos-email/[id]
 * Body: { nome: string, email: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoEmailId = id;
    const body = await request.json();

    // Validações
    if (!mongoose.Types.ObjectId.isValid(contatoEmailId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de contato email inválido',
        },
        { status: 400 }
      );
    }

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

    // Verifica se o email já existe em outro contato
    const emailExistente = await ContatoEmail.findOne({ 
      email: body.email.trim().toLowerCase(),
      _id: { $ne: contatoEmailId }
    });
    
    if (emailExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado em outro contato',
        },
        { status: 400 }
      );
    }

    // Atualiza o contato email
    const contatoEmailAtualizado = await ContatoEmail.findByIdAndUpdate(
      contatoEmailId,
      {
        $set: {
          nome: body.nome.trim(),
          email: body.email.trim().toLowerCase(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!contatoEmailAtualizado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato email não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Contato email atualizado:', {
      id: contatoEmailAtualizado._id.toString(),
      nome: contatoEmailAtualizado.nome,
      email: contatoEmailAtualizado.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contato email atualizado com sucesso',
        contatoEmail: {
          id: contatoEmailAtualizado._id.toString(),
          nome: contatoEmailAtualizado.nome,
          email: contatoEmailAtualizado.email,
          createdAt: contatoEmailAtualizado.createdAt
            ? new Date(contatoEmailAtualizado.createdAt).toISOString()
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao atualizar contato email:', error);
    
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
 * API Route para deletar um contato email
 * DELETE /api/contatos-email/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoEmailId = id;

    // Validações
    if (!mongoose.Types.ObjectId.isValid(contatoEmailId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de contato email inválido',
        },
        { status: 400 }
      );
    }

    // Deleta o contato email
    const contatoEmailDeletado = await ContatoEmail.findByIdAndDelete(contatoEmailId);

    if (!contatoEmailDeletado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato email não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Contato email deletado:', {
      id: contatoEmailDeletado._id.toString(),
      nome: contatoEmailDeletado.nome,
      email: contatoEmailDeletado.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contato email deletado com sucesso',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao deletar contato email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

