import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FeedPost from '@/lib/models/FeedPost';
import mongoose from 'mongoose';

/**
 * API Route para gerenciar um post específico
 * GET /api/feedposts/[id] - Busca um post
 * PUT /api/feedposts/[id] - Atualiza um post
 * DELETE /api/feedposts/[id] - Deleta um post
 */
export async function GET(
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
          error: 'ID de post inválido',
        },
        { status: 400 }
      );
    }

    const post = await FeedPost.findById(id).lean();

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post não encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar post',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { imagem, dataPublicacao, descricao } = body;

    // Valida ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de post inválido',
        },
        { status: 400 }
      );
    }

    // Busca o post
    const post = await FeedPost.findById(id);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post não encontrado',
        },
        { status: 404 }
      );
    }

    // Atualiza apenas os campos fornecidos
    if (imagem !== undefined) post.imagem = imagem;
    if (dataPublicacao !== undefined) post.dataPublicacao = new Date(dataPublicacao);
    if (descricao !== undefined) post.descricao = descricao;

    await post.save();

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar post',
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

    // Valida ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de post inválido',
        },
        { status: 400 }
      );
    }

    // Busca e deleta o post
    const post = await FeedPost.findByIdAndDelete(id);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post não encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar post',
      },
      { status: 500 }
    );
  }
}

