import { NextRequest, NextResponse } from 'next/server';
import { extractData } from '@/lib/utils/extractData';
import { processMessage } from '@/lib/utils/processMessage';
import connectDB from '@/lib/db';
import AtendimentoAI from '@/lib/models/AtendimentoAI';
import { processPromptVariables } from '@/lib/utils/processPromptVariables';
import { generateOllamaJSONResponse } from '@/lib/utils/ollama';
import { generateOllamaCustomJSON } from '@/lib/utils/generateOllamaCustomJSON';
import { getAIModel } from '@/lib/config/ai';
import { verificadorDeConversa } from '@/lib/utils/verificadorDeConversa';
import { gerenciadorDeConversa } from '@/lib/utils/gerenciadorDeConversa';
import { setContactProperty } from '@/lib/utils/setContactProperty';
import { updateResumoCaso } from '@/lib/utils/updateResumoCaso';
import { updateNomeCompleto } from '@/lib/utils/updateNomeCompleto';
import { criarAgendamento } from '@/lib/utils/criarAgendamento';
import { obterDatasDisponiveisServer } from '@/lib/utils/obterDatasDisponiveisServer';
import { sendWhatsAppMessage } from '@/lib/utils/sendWhatsAppMessage';
import { saveSystemMessage } from '@/lib/utils/saveSystemMessage';
import { emitEvent } from '@/app/api/events/route';
import { scheduleAIProcessing } from '@/lib/utils/messageDebouncer';

// Token de verificação do webhook (configure no Meta Developers)
// Em produção, use variável de ambiente
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'seu_token_secreto_aqui';

/**
 * Webhook do WhatsApp Business API
 * 
 * GET: Verificação do webhook pelo Meta
 * POST: Recebimento de mensagens
 * 
 * URL: https://SUA_URL_NGROK.ngrok-free.app/api/webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificação do webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verifica se é uma mensagem do WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ success: true, message: 'Not a message object' }, { status: 200 });
    }

    // Extrai dados do webhook
    const extractedData = extractData(body);

    if (!extractedData) {
      return NextResponse.json({ success: true, message: 'No message data extracted' }, { status: 200 });
    }

    // Processa a mensagem (salva no banco de dados)
    const result = await processMessage(extractedData);

    // Emite evento SSE imediatamente após salvar mensagem do cliente
    if (result.success && result.contatoId) {
      emitEvent({
        type: 'nova_mensagem',
        contatoId: result.contatoId,
        contato: extractedData.wa_id,
        data: {
          mensagem: extractedData.mensagem,
          contatoNome: extractedData.contatoNome,
          tipo: extractedData.tipo,
        },
      });
    }

    // Agenda processamento de IA para mensagens de texto ou áudio (com transcrição)
    if (result.success && result.contatoId && (extractedData.tipo === 'texto' || extractedData.tipo === 'audio')) {
      // Para áudio, aguarda a transcrição estar disponível
      if (extractedData.tipo === 'audio') {
        // Aguarda um pouco para garantir que a transcrição foi salva
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Agenda o processamento da IA com debounce de 10 segundos
      // Isso evita múltiplas respostas quando o cliente envia várias mensagens rapidamente
      scheduleAIProcessing(
        result.contatoId,
        'whatsapp',
        async () => {
          try {
            await connectDB();

            // Para áudio, busca a transcrição da mensagem
            let mensagemParaIA = extractedData.mensagem;
            
            if (extractedData.tipo === 'audio') {
              // Busca a mensagem de áudio recém-criada para pegar a transcrição
              const MensagemModel = (await import('@/lib/models/Mensagem')).default;
              const mensagemDoc = await MensagemModel.findOne({ contatoID: result.contatoId }).lean();
              
              if (mensagemDoc && mensagemDoc.mensagens) {
                // Encontra a última mensagem de áudio (a que acabou de ser recebida)
                const ultimaMensagemAudio = mensagemDoc.mensagens
                  .filter((msg: any) => msg.tipo === 'audio' && msg.mensagemWhatsAppId === extractedData.messageId)
                  .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())[0];
                
                if (ultimaMensagemAudio && ultimaMensagemAudio.transcricao) {
                  mensagemParaIA = ultimaMensagemAudio.transcricao;
                  console.log(`🎤 Usando transcrição do áudio para IA: "${mensagemParaIA.substring(0, 50)}..."`);
                } else {
                  console.log('⚠️ Transcrição do áudio ainda não está disponível. Aguardando...');
                  // Aguarda mais um pouco e tenta novamente
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  
                  const mensagemDocRetry = await MensagemModel.findOne({ contatoID: result.contatoId }).lean();
                  if (mensagemDocRetry && mensagemDocRetry.mensagens) {
                    const ultimaMensagemAudioRetry = mensagemDocRetry.mensagens
                      .filter((msg: any) => msg.tipo === 'audio' && msg.mensagemWhatsAppId === extractedData.messageId)
                      .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())[0];
                    
                    if (ultimaMensagemAudioRetry && ultimaMensagemAudioRetry.transcricao) {
                      mensagemParaIA = ultimaMensagemAudioRetry.transcricao;
                      console.log(`✅ Transcrição encontrada após retry: "${mensagemParaIA.substring(0, 50)}..."`);
                    } else {
                      console.log('⚠️ Transcrição não disponível após retry. Pulando processamento de IA.');
                      return;
                    }
                  }
                }
              }
            }

            // Verifica se há mensagem para processar
            if (!mensagemParaIA || mensagemParaIA.trim() === '') {
              console.log('⚠️ Nenhuma mensagem de texto ou transcrição disponível para processar.');
              return;
            }

          // 1. Verifica o estado da conversa e decide qual prompt executar
          const verificacao = await verificadorDeConversa(result.contatoId, false);

          if (!verificacao) {
            console.log('⚠️ Nenhum prompt a ser executado para este contato no momento.');
            return;
          }

          console.log(`\n🔍 Verificação de conversa: Executando prompt "${verificacao.promptNome}"`);

          // 2. Busca o prompt do banco
          const promptDoc = await AtendimentoAI.findOne({ nome: verificacao.promptNome }).lean();

          if (!promptDoc || !promptDoc.prompt || promptDoc.prompt.trim() === '') {
            console.log(`⚠️ Prompt "${verificacao.promptNome}" não encontrado ou vazio no banco de dados.`);
            return;
          }

            // 3. Processa as variáveis de atendimento no prompt
            // Busca a última mensagem do contato para usar no prompt (ao invés de extractedData.mensagem que pode estar desatualizado)
            const ContatoModel = (await import('@/lib/models/Contato')).default;
            const contatoAtualizado = await ContatoModel.findById(result.contatoId).lean();
            // Para áudio, usa a transcrição; para texto, usa a mensagem normal
            const ultimaMensagemTexto = mensagemParaIA || contatoAtualizado?.ultimaMensagem || extractedData.mensagem;
            
            const promptProcessado = await processPromptVariables(
              promptDoc.prompt,
              result.contatoId,
              ultimaMensagemTexto
            );

          console.log('\n========================================');
          console.log(`📝 PROMPT ${verificacao.promptNome}:`);
          console.log('========================================');
          console.log(promptProcessado);
          console.log('========================================\n');

          // 4. Verifica se precisa de validação de agendamento (todas propriedades true incluindo propostaAgendamento)
          if (verificacao.precisaValidacaoAgendamento && verificacao.promptNome === 'Validação de Agendamento') {
            // FLUXO: Validação de Agendamento -> (possivelmente) criar agendamento -> Agendamento Aceito/Não Aceito
            
            // 4.1. Executa Validação de Agendamento
            const promptValidacaoAgendamento = await AtendimentoAI.findOne({ nome: 'Validação de Agendamento' }).lean();
            if (!promptValidacaoAgendamento || !promptValidacaoAgendamento.prompt || promptValidacaoAgendamento.prompt.trim() === '') {
              console.log('⚠️ Prompt "Validação de Agendamento" não encontrado.');
              return;
            }

            const promptValidacaoAgendamentoProcessado = await processPromptVariables(
              promptValidacaoAgendamento.prompt,
              result.contatoId,
              mensagemParaIA
            );

            console.log('\n========================================');
            console.log('📝 PROMPT VALIDAÇÃO DE AGENDAMENTO:');
            console.log('========================================');
            console.log(promptValidacaoAgendamentoProcessado);
            console.log('========================================\n');

            const jsonSchemaValidacaoAgendamento = {
              type: 'object',
              properties: {
                agendamentoAceito: {
                  type: 'string',
                  enum: ['true', 'false'],
                  description: 'Indica se o agendamento foi aceito'
                },
                motivo: {
                  type: 'string',
                  description: 'Motivo caso agendamento não seja aceito (string vazia se aceito)'
                }
              },
              required: ['agendamentoAceito', 'motivo'],
              additionalProperties: false
            };

            const respostaValidacaoAgendamento = await generateOllamaCustomJSON(promptValidacaoAgendamentoProcessado, jsonSchemaValidacaoAgendamento, getAIModel());

            console.log('\n========================================');
            console.log('🤖 RESULTADO DO PROMPT VALIDAÇÃO DE AGENDAMENTO:');
            console.log('========================================');
            console.log(JSON.stringify(respostaValidacaoAgendamento, null, 2));
            console.log('========================================\n');

            const agendamentoAceito = respostaValidacaoAgendamento.agendamentoAceito === 'true';

            if (agendamentoAceito) {
              // Agendamento aceito: criar evento na agenda
              console.log('✅ Agendamento aceito. Criando evento na agenda...');

              // 4.2. Busca primeiro horário disponível
              const horariosDisponiveis = await obterDatasDisponiveisServer();
              if (horariosDisponiveis.length === 0) {
                console.error('❌ Nenhum horário disponível encontrado');
                return;
              }

              const primeiroHorario = horariosDisponiveis[0];
              // primeiroHorario.data está no formato YYYY-MM-DD
              // primeiroHorario.horario está no formato HH:MM

              // 4.3. Busca contato para obter nomeCompleto e resumoCaso
              const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId).lean();
              if (!contato) {
                console.error('❌ Contato não encontrado');
                return;
              }

              const nomeCompleto = (contato as any).nomeCompleto || '';
              const resumoCaso = (contato as any).resumoCaso || '';

              if (!nomeCompleto.trim()) {
                console.error('❌ nomeCompleto não encontrado no contato');
                return;
              }

              // 4.4. Cria agendamento
              const resultadoAgendamento = await criarAgendamento({
                nome: nomeCompleto.trim(),
                data: primeiroHorario.data, // YYYY-MM-DD
                horarioInicio: primeiroHorario.horario, // HH:MM
                duracao: '2:00',
                notas: resumoCaso.trim(),
                status: 'agendado',
              });

              if (!resultadoAgendamento.success) {
                console.error('❌ Erro ao criar agendamento:', resultadoAgendamento.error);
                return;
              }

              console.log(`✅ Agendamento criado com sucesso! ID: ${resultadoAgendamento.agendamentoId}`);

              // 4.5. Executa Agendamento Aceito
              const promptAgendamentoAceito = await AtendimentoAI.findOne({ nome: 'Agendamento Aceito' }).lean();
              if (!promptAgendamentoAceito || !promptAgendamentoAceito.prompt || promptAgendamentoAceito.prompt.trim() === '') {
                console.log('⚠️ Prompt "Agendamento Aceito" não encontrado.');
                return;
              }

              const promptAgendamentoAceitoProcessado = await processPromptVariables(
                promptAgendamentoAceito.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const respostaAgendamentoAceito = await generateOllamaJSONResponse(promptAgendamentoAceitoProcessado, getAIModel());
              const mensagemAgendamentoAceito = respostaAgendamentoAceito.resposta.trim();

              console.log('\n========================================');
              console.log('🤖 RESPOSTA DO PROMPT AGENDAMENTO ACEITO:');
              console.log('========================================');
              console.log(mensagemAgendamentoAceito);
              console.log('========================================\n');

              const whatsappResult = await sendWhatsAppMessage((contato as any).contato, mensagemAgendamentoAceito);
              if (!whatsappResult.success) {
                console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                return;
              }

              await saveSystemMessage(result.contatoId, mensagemAgendamentoAceito, whatsappResult.messageId, false);
              
              // Emite evento SSE para atualizar frontend após resposta da IA
              emitEvent({
                type: 'mensagem_enviada',
                contatoId: result.contatoId,
                contato: (contato as any).contato,
                data: {
                  mensagem: mensagemAgendamentoAceito,
                },
              });
              
              // 4.6. Altera confirmaAgendamento para true
              await setContactProperty(result.contatoId, 'confirmaAgendamento', true, false);
              console.log('✅ confirmaAgendamento atualizado para true');
            } else {
              // Agendamento não aceito: executa Agendamento Não Aceito
              console.log('⚠️ Agendamento não aceito. Executando Agendamento Não Aceito...');

              // Adiciona tag 'Importante' ao contato antes de executar o prompt
              const ContatoModel = (await import('@/lib/models/Contato')).default;
              await ContatoModel.findByIdAndUpdate(
                result.contatoId,
                { $addToSet: { tags: 'Importante' } },
                { new: true }
              );
              console.log('✅ Tag "Importante" adicionada ao contato');

              const promptAgendamentoNaoAceito = await AtendimentoAI.findOne({ nome: 'Agendamento Não Aceito' }).lean();
              if (!promptAgendamentoNaoAceito || !promptAgendamentoNaoAceito.prompt || promptAgendamentoNaoAceito.prompt.trim() === '') {
                console.log('⚠️ Prompt "Agendamento Não Aceito" não encontrado.');
                return;
              }

              const promptAgendamentoNaoAceitoProcessado = await processPromptVariables(
                promptAgendamentoNaoAceito.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const respostaAgendamentoNaoAceito = await generateOllamaJSONResponse(promptAgendamentoNaoAceitoProcessado, getAIModel());
              const mensagemAgendamentoNaoAceito = respostaAgendamentoNaoAceito.resposta.trim();

              console.log('\n========================================');
              console.log('🤖 RESPOSTA DO PROMPT AGENDAMENTO NÃO ACEITO:');
              console.log('========================================');
              console.log(mensagemAgendamentoNaoAceito);
              console.log('========================================\n');

              const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId).lean();
              if (!contato) {
                console.error('❌ Contato não encontrado');
                return;
              }

              const whatsappResult = await sendWhatsAppMessage((contato as any).contato, mensagemAgendamentoNaoAceito);
              if (!whatsappResult.success) {
                console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                return;
              }

              await saveSystemMessage(result.contatoId, mensagemAgendamentoNaoAceito, whatsappResult.messageId, false);
              
              // Emite evento SSE para atualizar frontend após resposta da IA
              emitEvent({
                type: 'mensagem_enviada',
                contatoId: result.contatoId,
                contato: (contato as any).contato,
                data: {
                  mensagem: mensagemAgendamentoNaoAceito,
                },
              });
              
              // Altera confirmaAgendamento para true
              await setContactProperty(result.contatoId, 'confirmaAgendamento', true, false);
              console.log('✅ confirmaAgendamento atualizado para true');
            }
          } else if (verificacao.precisaValidacaoNome && verificacao.promptNome === 'Validação de Nome') {
            // FLUXO: Validação de Nome -> (possivelmente) Solicitação de Nome -> Oferecendo Agendamento
            
            // 4.1. Executa Validação de Nome
            const promptValidacaoNome = await AtendimentoAI.findOne({ nome: 'Validação de Nome' }).lean();
            if (!promptValidacaoNome || !promptValidacaoNome.prompt || promptValidacaoNome.prompt.trim() === '') {
              console.log('⚠️ Prompt "Validação de Nome" não encontrado.');
              return;
            }

            const promptValidacaoNomeProcessado = await processPromptVariables(
              promptValidacaoNome.prompt,
              result.contatoId,
              mensagemParaIA
            );

            console.log('\n========================================');
            console.log('📝 PROMPT VALIDAÇÃO DE NOME:');
            console.log('========================================');
            console.log(promptValidacaoNomeProcessado);
            console.log('========================================\n');

            const jsonSchemaValidacaoNome = {
              type: 'object',
              properties: {
                nomeIdentificado: {
                  type: 'string',
                  enum: ['true', 'false'],
                  description: 'Indica se o nome foi identificado'
                },
                nomeCompleto: {
                  type: 'string',
                  description: 'Nome completo identificado'
                }
              },
              required: ['nomeIdentificado', 'nomeCompleto'],
              additionalProperties: false
            };

            const respostaValidacaoNome = await generateOllamaCustomJSON(promptValidacaoNomeProcessado, jsonSchemaValidacaoNome, getAIModel());

            console.log('\n========================================');
            console.log('🤖 RESULTADO DO PROMPT VALIDAÇÃO DE NOME:');
            console.log('========================================');
            console.log(JSON.stringify(respostaValidacaoNome, null, 2));
            console.log('========================================\n');

            const nomeIdentificado = respostaValidacaoNome.nomeIdentificado === 'true';

            if (!nomeIdentificado) {
              // Nome não identificado: executa Solicitação de Nome novamente
              console.log('⚠️ Nome não identificado. Executando Solicitação de Nome novamente...');

              const promptSolicitacaoNome = await AtendimentoAI.findOne({ nome: 'Solicitação de Nome' }).lean();
              if (!promptSolicitacaoNome || !promptSolicitacaoNome.prompt || promptSolicitacaoNome.prompt.trim() === '') {
                console.log('⚠️ Prompt "Solicitação de Nome" não encontrado.');
                return;
              }

              const promptSolicitacaoNomeProcessado = await processPromptVariables(
                promptSolicitacaoNome.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const respostaSolicitacaoNome = await generateOllamaJSONResponse(promptSolicitacaoNomeProcessado, getAIModel());
              const mensagemSolicitacaoNome = respostaSolicitacaoNome.resposta.trim();

              console.log('\n========================================');
              console.log('🤖 RESPOSTA DO PROMPT SOLICITAÇÃO DE NOME (REEXECUÇÃO):');
              console.log('========================================');
              console.log(mensagemSolicitacaoNome);
              console.log('========================================\n');

              const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
              if (!contato) {
                console.error('❌ Contato não encontrado');
                return;
              }

              const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemSolicitacaoNome);
              if (!whatsappResult.success) {
                console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                return;
              }

              await saveSystemMessage(result.contatoId, mensagemSolicitacaoNome, whatsappResult.messageId, false);
              
              // Emite evento SSE para atualizar frontend após resposta da IA
              emitEvent({
                type: 'mensagem_enviada',
                contatoId: result.contatoId,
                contato: contato.contato,
                data: {
                  mensagem: mensagemSolicitacaoNome,
                },
              });
              
              console.log('✅ Mensagem de solicitação de nome enviada');
            } else {
              // Nome identificado: armazena nomeCompleto e executa Oferecendo Agendamento
              console.log('✅ Nome identificado. Armazenando nomeCompleto...');

              const nomeCompleto = respostaValidacaoNome.nomeCompleto || '';
              if (nomeCompleto.trim()) {
                await updateNomeCompleto(result.contatoId, nomeCompleto, false);
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log(`✅ nomeCompleto armazenado: "${nomeCompleto.trim()}"`);
              }

              // 4.2. Executa Oferecendo Agendamento
              const promptOferecendoAgendamento = await AtendimentoAI.findOne({ nome: 'Oferecendo Agendamento' }).lean();
              if (!promptOferecendoAgendamento || !promptOferecendoAgendamento.prompt || promptOferecendoAgendamento.prompt.trim() === '') {
                console.log('⚠️ Prompt "Oferecendo Agendamento" não encontrado.');
                return;
              }

              const promptOferecendoAgendamentoProcessado = await processPromptVariables(
                promptOferecendoAgendamento.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const respostaOferecendoAgendamento = await generateOllamaJSONResponse(promptOferecendoAgendamentoProcessado, getAIModel());
              const mensagemOferecendoAgendamento = respostaOferecendoAgendamento.resposta.trim();

              console.log('\n========================================');
              console.log('🤖 RESPOSTA DO PROMPT OFERECENDO AGENDAMENTO:');
              console.log('========================================');
              console.log(mensagemOferecendoAgendamento);
              console.log('========================================\n');

              const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
              if (!contato) {
                console.error('❌ Contato não encontrado');
                return;
              }

              const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemOferecendoAgendamento);
              if (!whatsappResult.success) {
                console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                return;
              }

              await saveSystemMessage(result.contatoId, mensagemOferecendoAgendamento, whatsappResult.messageId, false);
              
              // Emite evento SSE para atualizar frontend após resposta da IA
              emitEvent({
                type: 'mensagem_enviada',
                contatoId: result.contatoId,
                contato: contato.contato,
                data: {
                  mensagem: mensagemOferecendoAgendamento,
                },
              });
              
              // 4.3. Altera propostaAgendamento para true
              await setContactProperty(result.contatoId, 'propostaAgendamento', true, false);
              console.log('✅ propostaAgendamento atualizado para true');
            }
          } else if (verificacao.precisaValidacaoUrgenciaFinal && verificacao.promptNome === 'Validação de Urgência') {
            // FLUXO FINAL: Validação de Urgência -> Solicitação de Nome
            
            // 4.1. Executa Validação de Urgência
            const promptValidacaoUrgencia = await AtendimentoAI.findOne({ nome: 'Validação de Urgência' }).lean();
            if (!promptValidacaoUrgencia || !promptValidacaoUrgencia.prompt || promptValidacaoUrgencia.prompt.trim() === '') {
              console.log('⚠️ Prompt "Validação de Urgência" não encontrado.');
              return;
            }

            const promptValidacaoUrgenciaProcessado = await processPromptVariables(
              promptValidacaoUrgencia.prompt,
              result.contatoId,
              mensagemParaIA
            );

            console.log('\n========================================');
            console.log('📝 PROMPT VALIDAÇÃO DE URGÊNCIA (FLUXO FINAL):');
            console.log('========================================');
            console.log(promptValidacaoUrgenciaProcessado);
            console.log('========================================\n');

            // Apenas executa o prompt, não precisa de JSON response aqui
            const respostaUrgencia = await generateOllamaJSONResponse(promptValidacaoUrgenciaProcessado, getAIModel());
            console.log('\n========================================');
            console.log('🤖 RESULTADO DO PROMPT VALIDAÇÃO DE URGÊNCIA (FLUXO FINAL):');
            console.log('========================================');
            console.log(respostaUrgencia.resposta);
            console.log('========================================\n');

            // 4.2. Executa Solicitação de Nome
            const promptEncaminhado = await AtendimentoAI.findOne({ nome: 'Solicitação de Nome' }).lean();
            if (!promptEncaminhado || !promptEncaminhado.prompt || promptEncaminhado.prompt.trim() === '') {
              console.log('⚠️ Prompt "Solicitação de Nome" não encontrado.');
              return;
            }

            const promptEncaminhadoProcessado = await processPromptVariables(
              promptEncaminhado.prompt,
              result.contatoId,
              mensagemParaIA
            );

            const respostaEncaminhado = await generateOllamaJSONResponse(promptEncaminhadoProcessado, getAIModel());
            const mensagemEncaminhado = respostaEncaminhado.resposta.trim();

            console.log('\n========================================');
            console.log('🤖 RESPOSTA DO PROMPT SOLICITAÇÃO DE NOME (FLUXO FINAL):');
            console.log('========================================');
            console.log(mensagemEncaminhado);
            console.log('========================================\n');

            // 4.3. Envia mensagem para o WhatsApp
            const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
            if (!contato) {
              console.error('❌ Contato não encontrado');
              return;
            }

            const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemEncaminhado);
            if (!whatsappResult.success) {
              console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
              return;
            }

            await saveSystemMessage(result.contatoId, mensagemEncaminhado, whatsappResult.messageId, false);
            
            // Emite evento SSE para atualizar frontend após resposta da IA
            emitEvent({
              type: 'mensagem_enviada',
              contatoId: result.contatoId,
              contato: contato.contato,
              data: {
                mensagem: mensagemEncaminhado,
              },
            });
            
            // 4.4. Altera selecionandoData para true
            await setContactProperty(result.contatoId, 'selecionandoData', true, false);
            console.log('✅ selecionandoData atualizado para true');
          } else if (verificacao.precisaValidacaoResumoIncorporacao && verificacao.promptNome === 'Validação do Resumo e Incorporação') {
            // FLUXO ESPECIAL: Validação do Resumo e Incorporação -> (possivelmente) Verificador de Resumo -> Validação de Resumo OU Validação de Urgência
            
            // 4.1. Gera resposta JSON customizada para Validação do Resumo e Incorporação
            const jsonSchemaValidacao = {
              type: 'object',
              properties: {
                resumoCorreto: {
                  type: 'string',
                  enum: ['true', 'false'],
                  description: 'Indica se o resumo está correto'
                }
              },
              required: ['resumoCorreto'],
              additionalProperties: false
            };

            const respostaValidacaoResumo = await generateOllamaCustomJSON(promptProcessado, jsonSchemaValidacao, getAIModel());

            console.log('\n========================================');
            console.log('🤖 RESULTADO DO PROMPT VALIDAÇÃO DO RESUMO E INCORPORAÇÃO:');
            console.log('========================================');
            console.log(JSON.stringify(respostaValidacaoResumo, null, 2));
            console.log('========================================\n');

            const resumoCorreto = respostaValidacaoResumo.resumoCorreto === 'true';

            if (!resumoCorreto) {
              // Resumo incorreto: resetar confirmacaoResumo e refazer o fluxo
              console.log('⚠️ Resumo incorreto detectado. Reiniciando fluxo de resumo...');
              
              // 4.2. Altera confirmacaoResumo para false
              await setContactProperty(result.contatoId, 'confirmacaoResumo', false, false);
              console.log('✅ confirmacaoResumo alterado para false');

              // 4.3. Executa Verificador de Resumo novamente
              const promptVerificador = await AtendimentoAI.findOne({ nome: 'Verificador de Resumo' }).lean();
              if (!promptVerificador || !promptVerificador.prompt || promptVerificador.prompt.trim() === '') {
                console.log('⚠️ Prompt "Verificador de Resumo" não encontrado.');
                return;
              }

              const promptVerificadorProcessado = await processPromptVariables(
                promptVerificador.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const jsonSchemaVerificador = {
                type: 'object',
                properties: {
                  resumo: {
                    type: 'string',
                    description: 'Resumo do caso do cliente'
                  }
                },
                required: ['resumo'],
                additionalProperties: false
              };

              const respostaVerificador = await generateOllamaCustomJSON(promptVerificadorProcessado, jsonSchemaVerificador, getAIModel());
              console.log('\n========================================');
              console.log('🤖 RESULTADO DO PROMPT VERIFICADOR DE RESUMO (REEXECUÇÃO):');
              console.log('========================================');
              console.log(JSON.stringify(respostaVerificador, null, 2));
              console.log('========================================\n');

              // Atualiza resumoCaso
              const resumoCaso = respostaVerificador.resumo || '';
              if (resumoCaso.trim()) {
                await updateResumoCaso(result.contatoId, resumoCaso, false);
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log('✅ resumoCaso atualizado novamente');
              }

              // 4.4. Executa Validação de Resumo
              const promptValidacao = await AtendimentoAI.findOne({ nome: 'Validação de Resumo' }).lean();
              if (!promptValidacao || !promptValidacao.prompt || promptValidacao.prompt.trim() === '') {
                console.log('⚠️ Prompt "Validação de Resumo" não encontrado.');
                return;
              }

              const promptValidacaoProcessado = await processPromptVariables(
                promptValidacao.prompt,
                result.contatoId,
                mensagemParaIA
              );

              const respostaValidacao = await generateOllamaJSONResponse(promptValidacaoProcessado, getAIModel());
              const mensagemValidacao = respostaValidacao.resposta.trim();

              console.log('\n========================================');
              console.log('🤖 RESPOSTA DO PROMPT VALIDAÇÃO DE RESUMO (REEXECUÇÃO):');
              console.log('========================================');
              console.log(mensagemValidacao);
              console.log('========================================\n');

              // Envia mensagem
              const contato = await ContatoModel.findById(result.contatoId);
              if (!contato) {
                console.error('❌ Contato não encontrado');
                return;
              }

              const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemValidacao);
              if (!whatsappResult.success) {
                console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                return;
              }

              await saveSystemMessage(result.contatoId, mensagemValidacao, whatsappResult.messageId, false);
              
              // Emite evento SSE para atualizar frontend após resposta da IA
              emitEvent({
                type: 'mensagem_enviada',
                contatoId: result.contatoId,
                contato: contato.contato,
                data: {
                  mensagem: mensagemValidacao,
                },
              });
              
              await gerenciadorDeConversa(result.contatoId, 'confirmacaoResumo', false);
              console.log('✅ confirmacaoResumo atualizado para true novamente');
            } else {
              // Resumo correto: executa Validação de Urgência
              console.log('✅ Resumo correto. Executando Validação de Urgência...');

              // 4.5. Executa Validação de Urgência
              const promptValidacaoUrgencia = await AtendimentoAI.findOne({ nome: 'Validação de Urgência' }).lean();
              if (!promptValidacaoUrgencia || !promptValidacaoUrgencia.prompt || promptValidacaoUrgencia.prompt.trim() === '') {
                console.log('⚠️ Prompt "Validação de Urgência" não encontrado.');
                return;
              }

              const promptValidacaoUrgenciaProcessado = await processPromptVariables(
                promptValidacaoUrgencia.prompt,
                result.contatoId,
                mensagemParaIA
              );

              console.log('\n========================================');
              console.log('📝 PROMPT VALIDAÇÃO DE URGÊNCIA:');
              console.log('========================================');
              console.log(promptValidacaoUrgenciaProcessado);
              console.log('========================================\n');

              const jsonSchemaUrgencia = {
                type: 'object',
                properties: {
                  processoDefinido: {
                    type: 'string',
                    enum: ['true', 'false'],
                    description: 'Indica se o processo foi definido'
                  }
                },
                required: ['processoDefinido'],
                additionalProperties: false
              };

              const respostaUrgencia = await generateOllamaCustomJSON(promptValidacaoUrgenciaProcessado, jsonSchemaUrgencia, getAIModel());

              console.log('\n========================================');
              console.log('🤖 RESULTADO DO PROMPT VALIDAÇÃO DE URGÊNCIA:');
              console.log('========================================');
              console.log(JSON.stringify(respostaUrgencia, null, 2));
              console.log('========================================\n');

              const processoDefinido = respostaUrgencia.processoDefinido === 'true';

              if (!processoDefinido) {
                // Processo não definido: executa Urgência Não Definida
                console.log('⚠️ Processo não definido. Executando Urgência Não Definida...');

                const promptUrgenciaNaoDefinida = await AtendimentoAI.findOne({ nome: 'Urgência Não Definida' }).lean();
                if (!promptUrgenciaNaoDefinida || !promptUrgenciaNaoDefinida.prompt || promptUrgenciaNaoDefinida.prompt.trim() === '') {
                  console.log('⚠️ Prompt "Urgência Não Definida" não encontrado.');
                  return;
                }

                const promptUrgenciaNaoDefinidaProcessado = await processPromptVariables(
                  promptUrgenciaNaoDefinida.prompt,
                  result.contatoId,
                  mensagemParaIA
                );

                const respostaUrgenciaNaoDefinida = await generateOllamaJSONResponse(promptUrgenciaNaoDefinidaProcessado, getAIModel());
                const mensagemUrgenciaNaoDefinida = respostaUrgenciaNaoDefinida.resposta.trim();

                console.log('\n========================================');
                console.log('🤖 RESPOSTA DO PROMPT URGÊNCIA NÃO DEFINIDA:');
                console.log('========================================');
                console.log(mensagemUrgenciaNaoDefinida);
                console.log('========================================\n');

                const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
                if (!contato) {
                  console.error('❌ Contato não encontrado');
                  return;
                }

                const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemUrgenciaNaoDefinida);
                if (!whatsappResult.success) {
                  console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                  return;
                }

                await saveSystemMessage(result.contatoId, mensagemUrgenciaNaoDefinida, whatsappResult.messageId, false);
                
                // Emite evento SSE para atualizar frontend após resposta da IA
                emitEvent({
                  type: 'mensagem_enviada',
                  contatoId: result.contatoId,
                  contato: contato.contato,
                  data: {
                    mensagem: mensagemUrgenciaNaoDefinida,
                  },
                });
                
                await gerenciadorDeConversa(result.contatoId, 'urgenciaDefinida', false);
                console.log('✅ urgenciaDefinida atualizado para true');
              } else {
                // Processo definido: executa Solicitação de Nome
                console.log('✅ Processo definido. Executando Solicitação de Nome...');

                const promptEncaminhado = await AtendimentoAI.findOne({ nome: 'Solicitação de Nome' }).lean();
                if (!promptEncaminhado || !promptEncaminhado.prompt || promptEncaminhado.prompt.trim() === '') {
                  console.log('⚠️ Prompt "Solicitação de Nome" não encontrado.');
                  return;
                }

                const promptEncaminhadoProcessado = await processPromptVariables(
                  promptEncaminhado.prompt,
                  result.contatoId,
                  mensagemParaIA
                );

                const respostaEncaminhado = await generateOllamaJSONResponse(promptEncaminhadoProcessado, getAIModel());
                const mensagemEncaminhado = respostaEncaminhado.resposta.trim();

                console.log('\n========================================');
                console.log('🤖 RESPOSTA DO PROMPT SOLICITAÇÃO DE NOME:');
                console.log('========================================');
                console.log(mensagemEncaminhado);
                console.log('========================================\n');

                const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
                if (!contato) {
                  console.error('❌ Contato não encontrado');
                  return;
                }

                const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemEncaminhado);
                if (!whatsappResult.success) {
                  console.error('❌ Erro ao enviar mensagem:', whatsappResult.error);
                  return;
                }

                await saveSystemMessage(result.contatoId, mensagemEncaminhado, whatsappResult.messageId, false);
                
                // Emite evento SSE para atualizar frontend após resposta da IA
                emitEvent({
                  type: 'mensagem_enviada',
                  contatoId: result.contatoId,
                  contato: contato.contato,
                  data: {
                    mensagem: mensagemEncaminhado,
                  },
                });
                
                await gerenciadorDeConversa(result.contatoId, 'urgenciaDefinida', false);
                console.log('✅ urgenciaDefinida atualizado para true');
              }
            }
          } else if (verificacao.precisaValidacao && verificacao.promptNome === 'Verificador de Resumo') {
            // FLUXO ESPECIAL: Verificador de Resumo -> Validação de Resumo
            
            // 4.1. Gera resposta JSON customizada para Verificador de Resumo
            const jsonSchema = {
              type: 'object',
              properties: {
                resumo: {
                  type: 'string',
                  description: 'Resumo do caso do cliente'
                }
              },
              required: ['resumo'],
              additionalProperties: false
            };

            const respostaVerificador = await generateOllamaCustomJSON(promptProcessado, jsonSchema, getAIModel());

            console.log('\n========================================');
            console.log('🤖 RESULTADO DO PROMPT VERIFICADOR DE RESUMO:');
            console.log('========================================');
            console.log(JSON.stringify(respostaVerificador, null, 2));
            console.log('========================================\n');

            // 4.2. Extrai o resumo e atualiza o contato
            const resumoCaso = respostaVerificador.resumo || '';
            if (resumoCaso.trim()) {
              const updateResult = await updateResumoCaso(result.contatoId, resumoCaso, false);
              if (updateResult.success) {
                console.log('✅ resumoCaso atualizado com sucesso!');
                
                // Força um pequeno delay para garantir que o banco foi atualizado
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verifica se o resumoCaso foi realmente salvo
                const ContatoModel = (await import('@/lib/models/Contato')).default;
                const contatoVerificado = await ContatoModel.findById(result.contatoId).lean();
                console.log(`🔍 Verificação: resumoCaso no banco = "${contatoVerificado?.resumoCaso || '(não encontrado)'}"`);
              } else {
                console.error('❌ Erro ao atualizar resumoCaso:', updateResult.error);
              }
            } else {
              console.warn('⚠️ Resumo vazio retornado pelo Verificador de Resumo');
            }

            // 4.3. Busca e executa o prompt "Validação de Resumo"
            const promptValidacao = await AtendimentoAI.findOne({ nome: 'Validação de Resumo' }).lean();

            if (!promptValidacao || !promptValidacao.prompt || promptValidacao.prompt.trim() === '') {
              console.log('⚠️ Prompt "Validação de Resumo" não encontrado ou vazio no banco de dados.');
              return;
            }

            // Força refresh do contato antes de processar variáveis
            // Busca o contato novamente do banco para garantir dados atualizados
            const ContatoModel = (await import('@/lib/models/Contato')).default;
            const contatoAtualizado = await ContatoModel.findById(result.contatoId).lean();
            if (contatoAtualizado) {
              console.log(`🔍 Contato recarregado. resumoCaso: "${contatoAtualizado.resumoCaso || '(vazio)'}"`);
            }

            const promptValidacaoProcessado = await processPromptVariables(
              promptValidacao.prompt,
              result.contatoId,
              extractedData.mensagem
            );

            console.log('\n========================================');
            console.log('📝 PROMPT VALIDAÇÃO DE RESUMO:');
            console.log('========================================');
            console.log(promptValidacaoProcessado);
            console.log('========================================\n');

            // 4.4. Gera resposta para Validação de Resumo
            const respostaValidacao = await generateOllamaJSONResponse(promptValidacaoProcessado, getAIModel());
            const mensagemValidacao = respostaValidacao.resposta.trim();

            console.log('\n========================================');
            console.log('🤖 RESPOSTA DO PROMPT VALIDAÇÃO DE RESUMO:');
            console.log('========================================');
            console.log(mensagemValidacao);
            console.log('========================================\n');

            // 4.5. Envia a mensagem de validação para o WhatsApp
            const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
            if (!contato) {
              console.error('❌ Contato não encontrado para enviar mensagem');
              return;
            }

            const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemValidacao);

            if (!whatsappResult.success) {
              console.error('❌ Erro ao enviar mensagem para o WhatsApp:', whatsappResult.error);
              return;
            }

            console.log('✅ Mensagem de validação enviada para o WhatsApp com sucesso!');

            // 4.6. Salva a mensagem no banco de dados
            await saveSystemMessage(result.contatoId, mensagemValidacao, whatsappResult.messageId, false);

            // Emite evento SSE para atualizar frontend após resposta da IA
            emitEvent({
              type: 'mensagem_enviada',
              contatoId: result.contatoId,
              contato: contato.contato,
              data: {
                mensagem: mensagemValidacao,
              },
            });

            // 4.7. Atualiza confirmacaoResumo para true
            await gerenciadorDeConversa(result.contatoId, 'confirmacaoResumo', false);
            console.log('✅ Propriedade confirmacaoResumo atualizada para true');
          } else {
            // FLUXO NORMAL: Prompt simples -> Envia resposta -> Atualiza propriedade
            
            // 4.1. Gera resposta usando Ollama
            const respostaOllama = await generateOllamaJSONResponse(promptProcessado, getAIModel());
            const mensagemResposta = respostaOllama.resposta.trim();

            console.log('\n========================================');
            console.log(`🤖 RESPOSTA DO PROMPT ${verificacao.promptNome}:`);
            console.log('========================================');
            console.log(mensagemResposta);
            console.log('========================================\n');

            // 4.2. Envia a mensagem para o WhatsApp
            const contato = await (await import('@/lib/models/Contato')).default.findById(result.contatoId);
            if (!contato) {
              console.error('❌ Contato não encontrado para enviar mensagem');
              return;
            }

            const whatsappResult = await sendWhatsAppMessage(contato.contato, mensagemResposta);

            if (!whatsappResult.success) {
              console.error('❌ Erro ao enviar mensagem para o WhatsApp:', whatsappResult.error);
              return;
            }

            console.log('✅ Mensagem enviada para o WhatsApp com sucesso!');

            // 4.3. Salva a mensagem no banco de dados
            await saveSystemMessage(result.contatoId, mensagemResposta, whatsappResult.messageId, false);

            // Emite evento SSE para atualizar frontend após resposta da IA
            emitEvent({
              type: 'mensagem_enviada',
              contatoId: result.contatoId,
              contato: contato.contato,
              data: {
                mensagem: mensagemResposta,
              },
            });

            // 4.4. Atualiza a propriedade do contato usando gerenciadorDeConversa
            if (verificacao.propriedadeParaAtualizar) {
              await gerenciadorDeConversa(
                result.contatoId,
                verificacao.propriedadeParaAtualizar,
                false
              );
              console.log(`✅ Propriedade ${verificacao.propriedadeParaAtualizar} atualizada para true`);
            }
          }
          } catch (error) {
            console.error('❌ Erro ao executar fluxo de conversa:', error);
          }
        }
      );
    }

    // Sempre retorna 200 OK para o WhatsApp (mesmo em caso de erro interno)
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Retorna 200 OK mesmo em caso de erro para não quebrar o webhook
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 200 }
    );
  }
}

