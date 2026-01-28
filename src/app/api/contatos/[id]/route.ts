import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import mongoose from 'mongoose';

/**
 * API Route para atualizar um contato
 * PATCH /api/contatos/[id]
 * Body: { status?, tags?, nota?, favorito?, arquivar?, produtoInteresse? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoId = id;
    const body = await request.json();

    // Validações
    if (!mongoose.Types.ObjectId.isValid(contatoId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de contato inválido',
        },
        { status: 400 }
      );
    }

    // Valida status se fornecido
    if (body.status && !['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status inválido',
        },
        { status: 400 }
      );
    }

    // Valida tags se fornecidas
    const validTags = ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto'];
    if (body.tags && Array.isArray(body.tags)) {
      const invalidTags = body.tags.filter((tag: string) => !validTags.includes(tag));
      if (invalidTags.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Tags inválidas: ${invalidTags.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Log dos dados recebidos
    console.log('\n📝 Atualizando contato:', contatoId);
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Prepara objeto de atualização
    const updateData: any = {};

    if (body.contatoNome !== undefined) {
      updateData.contatoNome = body.contatoNome.trim();
      console.log('Nome do contato atualizado:', body.contatoNome);
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      console.log('Status atualizado:', body.status);
    }
    if (body.tags !== undefined) {
      updateData.tags = body.tags;
      console.log('Tags atualizadas:', body.tags);
    }
    if (body.nota !== undefined) {
      updateData.nota = body.nota;
      console.log('Nota atualizada:', body.nota);
    }
    if (body.favorito !== undefined) {
      updateData.favorito = body.favorito;
      console.log('Favorito atualizado:', body.favorito);
    }
    if (body.arquivar !== undefined) {
      updateData.arquivar = body.arquivar;
      console.log('Arquivar atualizado:', body.arquivar);
    }
    if (body.produtoInteresse !== undefined) {
      updateData.produtoInteresse = body.produtoInteresse.trim();
      console.log('Produto de interesse atualizado:', body.produtoInteresse);
    }
    if (body.informacoesCaso !== undefined) {
      updateData.informacoesCaso = body.informacoesCaso.trim();
      console.log('Informações do caso atualizadas');
    }
    if (body.inicialConcluido !== undefined) {
      updateData.inicialConcluido = body.inicialConcluido;
      console.log('Inicial concluído atualizado:', body.inicialConcluido);
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

    // Atualiza usando findOneAndUpdate (mais confiável)
    const contatoSalvo = await Contato.findByIdAndUpdate(
      contatoId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!contatoSalvo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato não encontrado',
        },
        { status: 404 }
      );
    }

    console.log('✅ Contato salvo:', {
      status: contatoSalvo.status,
      tags: contatoSalvo.tags,
      nota: contatoSalvo.nota,
      favorito: contatoSalvo.favorito,
      arquivar: contatoSalvo.arquivar,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contato atualizado com sucesso',
        contato: {
          id: contatoSalvo._id.toString(),
          contato: contatoSalvo.contato,
          contatoNome: contatoSalvo.contatoNome,
          status: contatoSalvo.status,
          tags: contatoSalvo.tags,
          nota: contatoSalvo.nota,
          favorito: contatoSalvo.favorito,
          arquivar: contatoSalvo.arquivar,
          produtoInteresse: contatoSalvo.produtoInteresse ?? '',
          informacoesCaso: contatoSalvo.informacoesCaso ?? '',
          inicialConcluido: contatoSalvo.inicialConcluido ?? false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar contato:', error);
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
 * API Route para deletar um contato e todas suas mensagens
 * DELETE /api/contatos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoId = id;

    // Valida se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(contatoId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de contato inválido',
        },
        { status: 400 }
      );
    }

    // Verifica se o contato existe
    const contato = await Contato.findById(contatoId);

    if (!contato) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato não encontrado',
        },
        { status: 404 }
      );
    }

    // Importa Mensagem dinamicamente para evitar problemas de dependência circular
    const Mensagem = (await import('@/lib/models/Mensagem')).default;

    // Deleta todas as mensagens do contato
    const mensagemDoc = await Mensagem.findOneAndDelete({ contatoID: contatoId });
    const mensagensDeletadas = mensagemDoc?.mensagens?.length || 0;

    // Deleta o contato
    await Contato.findByIdAndDelete(contatoId);

    console.log(`✅ Contato ${contatoId} e ${mensagensDeletadas} mensagens deletados com sucesso`);

    return NextResponse.json({
      success: true,
      message: 'Contato e histórico de conversa deletados com sucesso',
      mensagensDeletadas,
    });
  } catch (error) {
    console.error('❌ Erro ao deletar contato:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
