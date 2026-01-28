import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';
import MensagemDM from '@/lib/models/MensagemDM';
import mongoose from 'mongoose';

/**
 * API Route para buscar mensagens de um contato específico do Instagram DM
 * GET /api/contatos-instagram/[id]/mensagens
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
    const contato = await ContatoDM.findById(contatoId).lean();

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
    const mensagemDoc = await MensagemDM.findOne({ contatoID: contatoId })
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
          mensagemInstagramId: msg.mensagemInstagramId,
          mensagem: msg.mensagem,
          dataHora: new Date(msg.dataHora).toISOString(),
          tipo: msg.tipo,
          contatoID: msg.contatoID || contato._id.toString(),
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
    console.error('❌ Erro ao buscar mensagens do Instagram:', error);
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

