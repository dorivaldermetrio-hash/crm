import connectDB from '@/lib/db';
import ContatoDM, { IContatoDM } from '@/lib/models/ContatoDM';
import MensagemDM, { IMensagemDM } from '@/lib/models/MensagemDM';
import { ExtractedDataInstagram } from './extractDataInstagram';
import { validateMessageInstagram } from './validateMessageInstagram';
import { getInstagramUsername } from './getInstagramUsername';

/**
 * Processa uma mensagem recebida do Instagram DM
 * 
 * Cenário 1: Contato novo
 * - Cria novo contato DM
 * - Cria objeto mensagem com primeira mensagem
 * 
 * Cenário 2: Contato existente
 * - Atualiza última mensagem do contato
 * - Adiciona mensagem ao array (se não for duplicada)
 */
export async function processMessageInstagram(data: ExtractedDataInstagram): Promise<{
  success: boolean;
  message: string;
  contatoId?: string;
  mensagemId?: string;
  isNewContact?: boolean;
}> {
  try {
    // Conecta ao banco
    await connectDB();

    // Valida dados
    const validation = validateMessageInstagram(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Validação falhou',
      };
    }

    // Converte timestamp para Date
    const dataHora = new Date(data.timestamp * 1000);

    // Busca ou cria username se não tiver
    let username = data.username;
    if (!username || username.trim() === '') {
      const fetchedUsername = await getInstagramUsername(data.instagram_id);
      username = fetchedUsername || `@user_${data.instagram_id.slice(-6)}`;
    }

    // Garante que o username comece com @
    if (!username.startsWith('@')) {
      username = `@${username}`;
    }

    // Processa mídia se houver
    let midiaId: string | undefined;
    let midiaUrl: string | undefined;
    let midiaNome: string | undefined;
    let midiaTamanho: number | undefined;
    let midiaMimeType: string | undefined;

    if (data.mediaId && data.tipo !== 'texto') {
      midiaId = data.mediaId;
      midiaUrl = data.mediaUrl;
      midiaNome = `media_${data.messageId}`;
      // Para Instagram, a URL já está disponível, não precisamos baixar
    }

    // Busca ou cria contato usando o username como identificador
    let contato = await ContatoDM.findOne({ contato: username });

    if (!contato) {
      // CENÁRIO 1: Contato novo
      contato = await ContatoDM.create({
        contato: username,
        contatoNome: username, // Por padrão, usa o username como nome
        ultimaMensagem: data.mensagem,
        dataUltimaMensagem: dataHora,
      });

      // Exibe o objeto do contato salvo no terminal
      console.log('\n========================================');
      console.log('✅ NOVO CONTATO INSTAGRAM SALVO:');
      console.log('========================================');
      console.log(JSON.stringify(contato.toObject(), null, 2));
      console.log('========================================\n');

      // Cria objeto mensagem com primeira mensagem
      const mensagemUnica: any = {
        mensagemInstagramId: data.messageId,
        mensagem: data.mensagem,
        dataHora: dataHora,
        tipo: data.tipo,
        contatoID: contato._id.toString(),
      };

      // Adiciona campos de mídia se houver
      if (midiaId) {
        mensagemUnica.midiaId = midiaId;
        mensagemUnica.midiaUrl = midiaUrl;
        mensagemUnica.midiaNome = midiaNome;
        mensagemUnica.midiaTamanho = midiaTamanho;
        mensagemUnica.midiaMimeType = midiaMimeType;
      }

      const mensagem = await MensagemDM.create({
        contatoID: contato._id,
        mensagens: [mensagemUnica],
      });

      return {
        success: true,
        message: 'Contato e mensagem criados com sucesso',
        contatoId: contato._id.toString(),
        mensagemId: mensagem._id.toString(),
        isNewContact: true,
      };
    } else {
      // CENÁRIO 2: Contato existente
      contato.ultimaMensagem = data.mensagem;
      contato.dataUltimaMensagem = dataHora;

      await contato.save();

      // Busca objeto mensagem do contato
      let mensagem = await MensagemDM.findOne({ contatoID: contato._id });

      if (!mensagem) {
        // Se não existe objeto mensagem, cria um
        const mensagemUnica: any = {
          mensagemInstagramId: data.messageId,
          mensagem: data.mensagem,
          dataHora: dataHora,
          tipo: data.tipo,
          contatoID: contato._id.toString(),
        };

        // Adiciona campos de mídia se houver
        if (midiaId) {
          mensagemUnica.midiaId = midiaId;
          mensagemUnica.midiaUrl = midiaUrl;
          mensagemUnica.midiaNome = midiaNome;
          mensagemUnica.midiaTamanho = midiaTamanho;
          mensagemUnica.midiaMimeType = midiaMimeType;
        }

        mensagem = await MensagemDM.create({
          contatoID: contato._id,
          mensagens: [mensagemUnica],
        });
      } else {
        // Verifica se a mensagem já existe (evita duplicatas)
        const mensagemExiste = mensagem.mensagens.some(
          (msg) => msg.mensagemInstagramId === data.messageId
        );

        if (mensagemExiste) {
          return {
            success: true,
            message: 'Mensagem duplicada ignorada',
            contatoId: contato._id.toString(),
            mensagemId: mensagem._id.toString(),
          };
        }

        // Adiciona nova mensagem ao array
        const mensagemUnica: any = {
          mensagemInstagramId: data.messageId,
          mensagem: data.mensagem,
          dataHora: dataHora,
          tipo: data.tipo,
          contatoID: contato._id.toString(),
        };

        // Adiciona campos de mídia se houver
        if (midiaId) {
          mensagemUnica.midiaId = midiaId;
          mensagemUnica.midiaUrl = midiaUrl;
          mensagemUnica.midiaNome = midiaNome;
          mensagemUnica.midiaTamanho = midiaTamanho;
          mensagemUnica.midiaMimeType = midiaMimeType;
        }

        mensagem.mensagens.push(mensagemUnica);

        // Ordena mensagens por dataHora (mais antiga primeiro)
        mensagem.mensagens.sort(
          (a, b) => a.dataHora.getTime() - b.dataHora.getTime()
        );

        await mensagem.save();
      }

      return {
        success: true,
        message: 'Mensagem processada com sucesso',
        contatoId: contato._id.toString(),
        mensagemId: mensagem._id.toString(),
      };
    }
  } catch (error) {
    console.error('Erro ao processar mensagem do Instagram:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

