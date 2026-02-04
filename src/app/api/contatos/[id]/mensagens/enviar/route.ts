import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import Mensagem from '@/lib/models/Mensagem';
import mongoose from 'mongoose';
import { sendWhatsAppMessage } from '@/lib/utils/sendWhatsAppMessage';
import { emitEvent } from '@/lib/utils/emitEvent';

/**
 * API Route para enviar uma mensagem (salvar no banco)
 * POST /api/contatos/[id]/mensagens/enviar
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

    // ============================================
    // PASSO 1: ENVIA A MENSAGEM PARA O WHATSAPP
    // ============================================
    console.log('\n📤 Enviando mensagem para o WhatsApp...');
    const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagem.trim());

    if (!whatsappResult.success) {
      console.error('❌ Falha ao enviar mensagem para o WhatsApp:', whatsappResult.error);
      return NextResponse.json(
        {
          success: false,
          error: whatsappResult.error || 'Erro ao enviar mensagem para o WhatsApp',
        },
        { status: 500 }
      );
    }

    // ============================================
    // PASSO 2: SALVA A MENSAGEM NO BANCO DE DADOS
    // ============================================
    console.log('💾 Salvando mensagem no banco de dados...');

    // Busca ou cria o objeto mensagem do contato
    let mensagemDoc = await Mensagem.findOne({ contatoID: contatoId });

    if (!mensagemDoc) {
      // Se não existe, cria um novo
      mensagemDoc = await Mensagem.create({
        contatoID: contatoId,
        mensagens: [],
      });
    }

    // Cria a nova mensagem do sistema
    const novaMensagem = {
      mensagemWhatsAppId: whatsappResult.messageId || `sistema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mensagem: mensagem.trim(),
      dataHora: new Date(),
      tipo: 'texto',
      contatoID: '1', // "1" indica que é mensagem do usuário do sistema
    };

    // Adiciona a mensagem ao array
    mensagemDoc.mensagens.push(novaMensagem);

    // Ordena mensagens por dataHora (mais antiga primeiro)
    mensagemDoc.mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    // Salva no banco
    await mensagemDoc.save();

    // Atualiza última mensagem do contato
    contato.ultimaMensagem = mensagem.trim();
    contato.dataUltimaMensagem = new Date();
    await contato.save();

    console.log('✅ Mensagem enviada e salva com sucesso!');

    // Emite evento para atualizar o frontend
    emitEvent({
      type: 'mensagem_enviada',
      contatoId: contatoId,
      contato: contato.contato,
      data: {
        mensagem: mensagem.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Mensagem enviada com sucesso',
        mensagem: {
          id: novaMensagem.mensagemWhatsAppId,
          mensagem: novaMensagem.mensagem,
          dataHora: novaMensagem.dataHora.toISOString(),
          tipo: novaMensagem.tipo,
          contatoID: novaMensagem.contatoID,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

