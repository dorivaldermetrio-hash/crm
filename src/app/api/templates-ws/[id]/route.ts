import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TemplateWS from '@/lib/models/TemplateWS';
import mongoose from 'mongoose';

/**
 * API Route para atualizar um template WhatsApp
 * PUT /api/templates-ws/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do template inválido',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nome, conteudo } = body;

    // Validações
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O nome do template é obrigatório',
        },
        { status: 400 }
      );
    }

    if (!conteudo || !conteudo.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O conteúdo do template é obrigatório',
        },
        { status: 400 }
      );
    }

    // Busca o template
    const template = await TemplateWS.findById(id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template não encontrado',
        },
        { status: 404 }
      );
    }

    // Atualiza o template
    template.nome = nome.trim();
    template.conteudo = conteudo.trim();
    await template.save();

    return NextResponse.json(
      {
        success: true,
        template: {
          id: template._id.toString(),
          nome: template.nome,
          conteudo: template.conteudo,
          createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar template WhatsApp:', error);
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
 * API Route para deletar um template WhatsApp
 * DELETE /api/templates-ws/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do template inválido',
        },
        { status: 400 }
      );
    }

    // Busca e remove o template
    const template = await TemplateWS.findByIdAndDelete(id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template não encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Template removido com sucesso',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao deletar template WhatsApp:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

