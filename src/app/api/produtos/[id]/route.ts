import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Produto from '@/lib/models/Produto';
import mongoose from 'mongoose';

/**
 * API Route para atualizar um produto
 * PUT /api/produtos/[id]
 * Body: { nome?: string, descBreve?: string, descCompleta?: string, ativado?: string, valor?: string, duracao?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Valida ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de produto inválido',
        },
        { status: 400 }
      );
    }

    // Validações
    if (body.nome !== undefined && (typeof body.nome !== 'string' || body.nome.trim() === '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome do produto não pode ser vazio',
        },
        { status: 400 }
      );
    }

    // Prepara objeto de atualização
    const updateData: any = {};

    if (body.nome !== undefined) {
      updateData.nome = body.nome.trim();
    }
    if (body.descBreve !== undefined) {
      updateData.descBreve = body.descBreve.trim();
    }
    if (body.descCompleta !== undefined) {
      updateData.descCompleta = body.descCompleta.trim();
    }
    if (body.ativado !== undefined) {
      updateData.ativado = body.ativado.trim();
    }
    if (body.valor !== undefined) {
      updateData.valor = body.valor.trim();
    }
    if (body.duracao !== undefined) {
      updateData.duracao = body.duracao.trim();
    }

    // Verifica se há algo para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum campo para atualizar',
        },
        { status: 400 }
      );
    }

    // Atualiza o produto
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!produtoAtualizado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Produto atualizado:', {
      id: produtoAtualizado._id.toString(),
      nome: produtoAtualizado.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Produto atualizado com sucesso',
        produto: {
          id: produtoAtualizado._id.toString(),
          nome: produtoAtualizado.nome,
          descBreve: produtoAtualizado.descBreve || '',
          descCompleta: produtoAtualizado.descCompleta || '',
          ativado: produtoAtualizado.ativado || 'sim',
          valor: produtoAtualizado.valor || '',
          duracao: produtoAtualizado.duracao || '',
          createdAt: produtoAtualizado.createdAt
            ? new Date(produtoAtualizado.createdAt).toISOString()
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error);

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
 * API Route para deletar um produto
 * DELETE /api/produtos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Valida ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de produto inválido',
        },
        { status: 400 }
      );
    }

    // Busca e deleta o produto
    const produto = await Produto.findByIdAndDelete(id);

    if (!produto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Produto deletado:', {
      id: produto._id.toString(),
      nome: produto.nome,
    });

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar produto',
      },
      { status: 500 }
    );
  }
}

