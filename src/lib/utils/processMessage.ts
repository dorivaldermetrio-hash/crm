import connectDB from '@/lib/db';
import Contato, { IContato } from '@/lib/models/Contato';
import Mensagem, { IMensagem } from '@/lib/models/Mensagem';
import { ExtractedData } from './extractData';
import { validateMessage } from './validateMessage';
import { downloadMediaFromWhatsApp } from './downloadMedia';
import { saveFileToGridFS } from './gridfs';
import { transcribeAudio } from './transcribeAudio';

/**
 * Processa uma mensagem recebida do WhatsApp
 * 
 * Cenário 1: Contato novo
 * - Cria novo contato
 * - Cria objeto mensagem com primeira mensagem
 * 
 * Cenário 2: Contato existente
 * - Atualiza última mensagem do contato
 * - Adiciona mensagem ao array (se não for duplicada)
 */
export async function processMessage(data: ExtractedData): Promise<{
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
    const validation = validateMessage(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Validação falhou',
      };
    }

    // Converte timestamp para Date
    const dataHora = new Date(data.timestamp * 1000);

    // Processa mídia se houver
    let midiaId: string | undefined;
    let midiaUrl: string | undefined;
    let midiaNome: string | undefined;
    let midiaTamanho: number | undefined;
    let midiaMimeType: string | undefined;
    let transcricao: string | undefined;

    if (data.mediaId && data.tipo !== 'texto') {
      try {
        const mediaData = await downloadMediaFromWhatsApp(data.mediaId);
        
        if (mediaData) {
          // Salva no GridFS
          midiaId = await saveFileToGridFS(
            mediaData.buffer,
            mediaData.filename,
            mediaData.contentType
          );
          midiaNome = mediaData.filename;
          midiaTamanho = mediaData.buffer.length;
          midiaMimeType = mediaData.contentType;
          midiaUrl = `https://graph.facebook.com/v21.0/${data.mediaId}`;

          // Transcreve áudio se for tipo audio
          if (data.tipo === 'audio' && midiaId) {
            try {
              console.log(`🎤 Iniciando transcrição do áudio: ${midiaId}`);
              transcricao = (await transcribeAudio(midiaId)) || undefined;
              if (transcricao) {
                console.log(`✅ Transcrição salva: ${transcricao.substring(0, 50)}...`);
              } else {
                console.warn(`⚠️ Transcrição não foi gerada para o áudio: ${midiaId}`);
              }
            } catch (error) {
              console.error('❌ Erro ao transcrever áudio:', error);
              // Continua processando a mensagem mesmo se a transcrição falhar
            }
          }
        }
      } catch (error) {
        // Continua processando a mensagem mesmo se a mídia falhar
      }
    }

    // Busca ou cria contato
    let contato = await Contato.findOne({ contato: data.wa_id });

    if (!contato) {
      // CENÁRIO 1: Contato novo
      contato = await Contato.create({
        contato: data.wa_id,
        contatoNome: data.contatoNome || '',
        ultimaMensagem: data.mensagem,
        dataUltimaMensagem: dataHora,
      });

      // Exibe o objeto do contato salvo no terminal
      console.log('\n========================================');
      console.log('✅ NOVO CONTATO SALVO:');
      console.log('========================================');
      console.log(JSON.stringify(contato.toObject(), null, 2));
      console.log('========================================\n');

      // Cria objeto mensagem com primeira mensagem
      const mensagemUnica: any = {
        mensagemWhatsAppId: data.messageId,
        mensagem: data.mensagem,
        dataHora: dataHora,
        tipo: data.tipo,
        contatoID: contato._id.toString(), // ID do contato (não é "1")
      };

      // Adiciona campos de mídia se houver
      if (midiaId) {
        mensagemUnica.midiaId = midiaId;
        mensagemUnica.midiaUrl = midiaUrl;
        mensagemUnica.midiaNome = midiaNome;
        mensagemUnica.midiaTamanho = midiaTamanho;
        mensagemUnica.midiaMimeType = midiaMimeType;
      }

      // Adiciona transcrição se houver
      if (transcricao) {
        mensagemUnica.transcricao = transcricao;
      }

      const mensagem = await Mensagem.create({
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
      
      if (data.contatoNome && data.contatoNome !== contato.contatoNome) {
        contato.contatoNome = data.contatoNome;
      }

      await contato.save();

      // Busca objeto mensagem do contato
      let mensagem = await Mensagem.findOne({ contatoID: contato._id });

      if (!mensagem) {
        // Se não existe objeto mensagem, cria um
        const mensagemUnica: any = {
          mensagemWhatsAppId: data.messageId,
          mensagem: data.mensagem,
          dataHora: dataHora,
          tipo: data.tipo,
          contatoID: contato._id.toString(), // ID do contato (não é "1")
        };

        // Adiciona campos de mídia se houver
        if (midiaId) {
          mensagemUnica.midiaId = midiaId;
          mensagemUnica.midiaUrl = midiaUrl;
          mensagemUnica.midiaNome = midiaNome;
          mensagemUnica.midiaTamanho = midiaTamanho;
          mensagemUnica.midiaMimeType = midiaMimeType;
        }

        // Adiciona transcrição se houver
        if (transcricao) {
          mensagemUnica.transcricao = transcricao;
        }

        mensagem = await Mensagem.create({
          contatoID: contato._id,
          mensagens: [mensagemUnica],
        });
      } else {
        // Verifica se a mensagem já existe (evita duplicatas)
        const mensagemExiste = mensagem.mensagens.some(
          (msg) => msg.mensagemWhatsAppId === data.messageId
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
          mensagemWhatsAppId: data.messageId,
          mensagem: data.mensagem,
          dataHora: dataHora,
          tipo: data.tipo,
          contatoID: contato._id.toString(), // ID do contato (não é "1")
        };

        // Adiciona campos de mídia se houver
        if (midiaId) {
          mensagemUnica.midiaId = midiaId;
          mensagemUnica.midiaUrl = midiaUrl;
          mensagemUnica.midiaNome = midiaNome;
          mensagemUnica.midiaTamanho = midiaTamanho;
          mensagemUnica.midiaMimeType = midiaMimeType;
        }

        // Adiciona transcrição se houver
        if (transcricao) {
          mensagemUnica.transcricao = transcricao;
          console.log(`✅ Transcrição adicionada à mensagem: "${transcricao.substring(0, 50)}..."`);
        }

        mensagem.mensagens.push(mensagemUnica);

        // Ordena mensagens por dataHora (mais antiga primeiro)
        mensagem.mensagens.sort(
          (a, b) => a.dataHora.getTime() - b.dataHora.getTime()
        );

        await mensagem.save();
        console.log(`💾 Mensagem salva com ${mensagem.mensagens.length} mensagem(ns). Última tem transcrição: ${mensagemUnica.transcricao ? 'SIM' : 'NÃO'}`);
      }

      return {
        success: true,
        message: 'Mensagem processada com sucesso',
        contatoId: contato._id.toString(),
        mensagemId: mensagem._id.toString(),
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

