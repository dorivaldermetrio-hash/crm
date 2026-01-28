/**
 * Salva uma mensagem enviada pelo sistema no banco de dados
 */

import connectDB from '@/lib/db';
import Mensagem from '@/lib/models/Mensagem';
import MensagemDM from '@/lib/models/MensagemDM';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Salva uma mensagem enviada pelo sistema no banco de dados
 * @param contatoId - ID do contato
 * @param mensagemTexto - Texto da mensagem
 * @param messageId - ID da mensagem do WhatsApp/Instagram (opcional)
 * @param isInstagram - Se true, salva no MensagemDM, senão no Mensagem
 * @returns Sucesso ou erro
 */
export async function saveSystemMessage(
  contatoId: string,
  mensagemTexto: string,
  messageId?: string,
  isInstagram: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const MensagemModel = isInstagram ? MensagemDM : Mensagem;

    // Busca ou cria o objeto mensagem do contato
    let mensagemDoc = await MensagemModel.findOne({ contatoID: contatoId });

    if (!mensagemDoc) {
      mensagemDoc = await MensagemModel.create({
        contatoID: contatoId,
        mensagens: [],
      });
    }

    // Cria a nova mensagem do sistema
    const novaMensagem: any = {
      mensagem: mensagemTexto.trim(),
      dataHora: new Date(),
      tipo: 'texto',
      contatoID: '1', // "1" indica que é mensagem do sistema
    };

    // Adiciona o ID específico da plataforma
    if (isInstagram) {
      novaMensagem.mensagemInstagramId = messageId || `sistema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      novaMensagem.mensagemWhatsAppId = messageId || `sistema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

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
    const ContatoModel = isInstagram ? ContatoDM : Contato;
    const contato = await ContatoModel.findById(contatoId);
    if (contato) {
      contato.ultimaMensagem = mensagemTexto.trim();
      contato.dataUltimaMensagem = new Date();
      await contato.save();
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem do sistema:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

