import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';
import MensagemDM from '@/lib/models/MensagemDM';
import mongoose from 'mongoose';
import { sendInstagramMessage } from '@/lib/utils/sendInstagramMessage';
import { emitEvent } from '@/app/api/events/route';

/**
 * API Route para enviar uma mensagem do Instagram DM
 * POST /api/contatos-instagram/[id]/mensagens/enviar
 * Body: { mensagem: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoId = id;
    const body = await request.json();
    const { mensagem } = body;

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

    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mensagem é obrigatória',
        },
        { status: 400 }
      );
    }

    // Verifica se o contato existe
    const contato = await ContatoDM.findById(contatoId);

    if (!contato) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato não encontrado',
        },
        { status: 404 }
      );
    }

    // Extrai o ID do Instagram do campo contato (pode ser @username ou ID)
    // Se for @username, precisamos buscar o ID via API
    // Por enquanto, vamos tentar usar diretamente
    const instagramId = contato.contato.replace('@', ''); // Remove @ se houver

    // Envia a mensagem para o Instagram
    console.log('\n📤 Enviando mensagem para o Instagram...');
    const instagramResult = await sendInstagramMessage(instagramId, mensagem.trim());

    if (!instagramResult.success) {
      console.error('❌ Erro ao enviar mensagem para o Instagram:', instagramResult.error);
      return NextResponse.json(
        {
          success: false,
          error: instagramResult.error || 'Erro ao enviar mensagem para o Instagram',
        },
        { status: 500 }
      );
    }

    console.log('✅ Mensagem enviada para o Instagram:', instagramResult.messageId);

    // Salva a mensagem no banco
    let mensagemDoc = await MensagemDM.findOne({ contatoID: contatoId });

    if (!mensagemDoc) {
      mensagemDoc = await MensagemDM.create({
        contatoID: contatoId,
        mensagens: [],
      });
    }

    const novaMensagem = {
      mensagemInstagramId: instagramResult.messageId || `sistema_${Date.now()}`,
      mensagem: mensagem.trim(),
      dataHora: new Date(),
      tipo: 'texto',
      contatoID: '1', // "1" indica que é mensagem do sistema
    };

    mensagemDoc.mensagens.push(novaMensagem);
    mensagemDoc.mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    await mensagemDoc.save();

    // Atualiza última mensagem do contato
    contato.ultimaMensagem = mensagem.trim();
    contato.dataUltimaMensagem = new Date();
    await contato.save();

    // Emite evento para atualizar o frontend
    emitEvent({
      type: 'mensagem_enviada',
      contatoId: contatoId,
      contato: contato.contato,
      data: {
        mensagem: mensagem.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: instagramResult.messageId,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem do Instagram:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

