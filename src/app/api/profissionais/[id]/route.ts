import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Profissional from '@/lib/models/Profissional';
import mongoose from 'mongoose';

/**
 * API Route para atualizar ou deletar um profissional
 * PUT /api/profissionais/[id] - Atualiza um profissional
 * DELETE /api/profissionais/[id] - Deleta um profissional
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const profissionalId = id;
    const body = await request.json();

    // Validações
    if (!mongoose.Types.ObjectId.isValid(profissionalId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de profissional inválido',
        },
        { status: 400 }
      );
    }

    if (body.nome !== undefined && (typeof body.nome !== 'string' || body.nome.trim() === '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome do profissional é obrigatório',
        },
        { status: 400 }
      );
    }

    if (body.areas_atuacao !== undefined && !Array.isArray(body.areas_atuacao)) {
      return NextResponse.json(
        {
          success: false,
          error: 'areas_atuacao deve ser um array',
        },
        { status: 400 }
      );
    }

    if (body.mensagem_autoridade !== undefined && typeof body.mensagem_autoridade !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'mensagem_autoridade deve ser um objeto',
        },
        { status: 400 }
      );
    }

    // Prepara objeto de atualização
    const updateData: any = {};

    if (body.nome !== undefined) {
      updateData.nome = body.nome.trim();
    }
    if (body.areas_atuacao !== undefined) {
      updateData.areas_atuacao = body.areas_atuacao;
    }
    if (body.mensagem_autoridade !== undefined) {
      updateData.mensagem_autoridade = body.mensagem_autoridade;
    }

    // Atualiza o profissional
    const profissionalAtualizado = await Profissional.findByIdAndUpdate(
      profissionalId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!profissionalAtualizado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profissional não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Profissional atualizado:', {
      id: profissionalAtualizado._id.toString(),
      nome: profissionalAtualizado.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profissional atualizado com sucesso',
        profissional: {
          id: profissionalAtualizado._id.toString(),
          nome: profissionalAtualizado.nome,
          areas_atuacao: profissionalAtualizado.areas_atuacao,
          mensagem_autoridade: profissionalAtualizado.mensagem_autoridade || {},
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar profissional:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const profissionalId = id;

    // Validações
    if (!mongoose.Types.ObjectId.isValid(profissionalId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de profissional inválido',
        },
        { status: 400 }
      );
    }

    // Deleta o profissional
    const profissionalDeletado = await Profissional.findByIdAndDelete(profissionalId);

    if (!profissionalDeletado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profissional não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Profissional deletado:', {
      id: profissionalDeletado._id.toString(),
      nome: profissionalDeletado.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profissional deletado com sucesso',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao deletar profissional:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

