/**
 * Utilitário para salvar mensagens enviadas pelo sistema no banco de dados (Instagram DM)
 * Mensagens enviadas têm contatoID = "1"
 */

import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';
import MensagemDM from '@/lib/models/MensagemDM';

interface SaveSentMessageInstagramParams {
  contatoId: string;
  mensagem: string;
  messageId?: string;
}

/**
 * Salva uma mensagem enviada pelo sistema no banco de dados (Instagram DM)
 */
export async function saveSentMessageInstagram({
  contatoId,
  mensagem,
  messageId,
}: SaveSentMessageInstagramParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();

    // Verifica se o contato existe
    const contato = await ContatoDM.findById(contatoId);
    if (!contato) {
      return {
        success: false,
        error: 'Contato não encontrado',
      };
    }

    // Busca ou cria o objeto mensagem do contato
    let mensagemDoc = await MensagemDM.findOne({ contatoID: contatoId });

    if (!mensagemDoc) {
      // Se não existe, cria um novo
      mensagemDoc = await MensagemDM.create({
        contatoID: contatoId,
        mensagens: [],
      });
    }

    // Cria a nova mensagem do sistema
    const novaMensagem = {
      mensagemInstagramId: messageId || `sistema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

