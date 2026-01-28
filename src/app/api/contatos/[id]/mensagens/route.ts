import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import Mensagem from '@/lib/models/Mensagem';
import mongoose from 'mongoose';

/**
 * API Route para buscar mensagens de um contato específico
 * GET /api/contatos/[id]/mensagens
 */
export async function GET(
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
          mensagens: [],
        },
        { status: 400 }
      );
    }

    // Busca o contato
    const contato = await Contato.findById(contatoId).lean();

    if (!contato) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato não encontrado',
          mensagens: [],
        },
        { status: 404 }
      );
    }

    // Busca as mensagens do contato
    const mensagemDoc = await Mensagem.findOne({ contatoID: contatoId })
      .populate('contatoID')
      .lean();

    // Ordena mensagens por dataHora (mais antiga primeiro)
    const mensagens = mensagemDoc?.mensagens || [];
    mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    return NextResponse.json(
      {
        success: true,
        contato: {
          id: contato._id.toString(),
          contato: contato.contato,
          contatoNome: contato.contatoNome || '',
        },
        mensagens: mensagens.map((msg: any) => ({
          id: msg._id?.toString() || '',
          mensagemWhatsAppId: msg.mensagemWhatsAppId,
          mensagem: msg.mensagem,
          dataHora: new Date(msg.dataHora).toISOString(),
          tipo: msg.tipo,
          contatoID: msg.contatoID || contato._id.toString(), // Se não tiver contatoID, usa o _id do contato
          midiaId: msg.midiaId || undefined,
          midiaUrl: msg.midiaUrl || undefined,
          midiaNome: msg.midiaNome || undefined,
          midiaTamanho: msg.midiaTamanho || undefined,
          midiaMimeType: msg.midiaMimeType || undefined,
        })),
        total: mensagens.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        mensagens: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para deletar todas as mensagens de um contato
 * DELETE /api/contatos/[id]/mensagens
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

    // Busca e deleta o documento de mensagens
    const mensagemDoc = await Mensagem.findOneAndDelete({ contatoID: contatoId });

    // Atualiza o contato para limpar a última mensagem
    contato.ultimaMensagem = '';
    contato.dataUltimaMensagem = null;
    await contato.save();

    console.log(`✅ Histórico de conversa deletado para contato ${contatoId}`);

    return NextResponse.json({
      success: true,
      message: 'Histórico de conversa deletado com sucesso',
      mensagensDeletadas: mensagemDoc?.mensagens?.length || 0,
    });
  } catch (error) {
    console.error('❌ Erro ao deletar mensagens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
