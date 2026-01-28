/**
 * Integração com Ollama para gerar respostas automáticas
 */

import { getOllamaModel } from '@/lib/config/ollama';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface OllamaJSONResponse {
  resposta: string;
}

/**
 * Gera uma resposta usando o modelo Ollama
 * @param prompt - A mensagem do usuário
 * @param conversationHistory - Histórico da conversa (últimas mensagens)
 * @param modelName - Nome do modelo (padrão: obtido de getOllamaModel())
 */
export async function generateOllamaResponse(
  prompt: string,
  conversationHistory: MessageHistory[] = [],
  modelName: string = getOllamaModel()
): Promise<string> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // Monta o contexto da conversa
    const messages: MessageHistory[] = [
      ...conversationHistory,
      { role: 'user', content: prompt },
    ];

    // Se não houver histórico, adiciona um prompt inicial para contexto de CRM
    if (conversationHistory.length === 0) {
      messages.unshift({
        role: 'assistant',
        content: 'Você é um assistente virtual de um sistema CRM que responde mensagens do WhatsApp de forma profissional, amigável e objetiva. Mantenha as respostas concisas e úteis.',
      });
    }


    // Chama a API do Ollama usando o endpoint /api/chat (streaming)
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: false, // Para receber resposta completa de uma vez
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao chamar Ollama: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.message || !data.message.content) {
      throw new Error('Resposta inválida do Ollama');
    }

    return data.message.content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao Ollama. Verifique se está rodando em http://localhost:11434');
    }
    throw error;
  }
}

/**
 * Busca o histórico de mensagens de um contato para usar como contexto
 * @param contatoId - ID do contato no banco de dados
 * @param limit - Número máximo de mensagens anteriores (padrão: 10)
 * @param excludeLastMessage - Se true, exclui a última mensagem recebida (para evitar duplicação)
 */
export async function getConversationHistory(
  contatoId: string,
  limit: number = 10,
  excludeLastMessage: boolean = false
): Promise<MessageHistory[]> {
  try {
    const { default: connectDB } = await import('@/lib/db');
    const { default: Mensagem } = await import('@/lib/models/Mensagem');
    
    await connectDB();

    // Busca as mensagens do contato
    const mensagemDoc = await Mensagem.findOne({ contatoID: contatoId })
      .lean();

    if (!mensagemDoc || !mensagemDoc.mensagens || mensagemDoc.mensagens.length === 0) {
      return [];
    }

    // Ordena mensagens por data (mais antiga primeiro)
    const mensagens = [...mensagemDoc.mensagens];
    mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    // Filtra apenas mensagens de texto com conteúdo
    const mensagensTexto = mensagens.filter((msg: any) => {
      return msg.tipo === 'texto' && msg.mensagem && msg.mensagem.trim() !== '';
    });

    // Se excludeLastMessage, remove a última mensagem recebida (não é do sistema)
    let mensagensParaContexto = mensagensTexto;
    if (excludeLastMessage && mensagensTexto.length > 0) {
      // Encontra a última mensagem que não foi enviada pelo sistema (contatoID !== "1")
      const ultimaMensagemRecebidaIndex = mensagensTexto
        .map((msg: any, index: number) => ({ msg, index }))
        .reverse()
        .find(({ msg }: { msg: any }) => msg.contatoID !== '1')?.index;
      
      if (ultimaMensagemRecebidaIndex !== undefined) {
        mensagensParaContexto = mensagensTexto.filter(
          (_: any, index: number) => index !== ultimaMensagemRecebidaIndex
        );
      }
    }

    // Pega as últimas N mensagens
    const ultimasMensagens = mensagensParaContexto.slice(-limit);

    // Converte para o formato do Ollama
    const history: MessageHistory[] = ultimasMensagens.map((msg: any) => {
      // Se contatoID === "1", a mensagem foi enviada pelo sistema (assistente)
      // Caso contrário, foi recebida do contato (usuário)
      const role = msg.contatoID === '1' ? 'assistant' : 'user';
      
      return {
        role,
        content: msg.mensagem.trim(),
      };
    });

    return history;
  } catch (error) {
    return [];
  }
}

/**
 * Gera uma resposta em formato JSON usando o modelo Ollama
 * @param prompt - O prompt completo estruturado
 * @param modelName - Nome do modelo (padrão: obtido de getOllamaModel())
 * @returns Objeto JSON com resposta
 */
export async function generateOllamaJSONResponse(
  prompt: string,
  modelName: string = getOllamaModel()
): Promise<OllamaJSONResponse> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';


    // Usa JSON schema para forçar formato JSON (mais confiável)
    const jsonSchema = {
      type: 'object',
      properties: {
        resposta: {
          type: 'string',
          description: 'Resposta contextualizada ao cliente'
        }
      },
      required: ['resposta'],
      additionalProperties: false
    };

    // Chama a API do Ollama usando o endpoint /api/chat
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false, // Para receber resposta completa de uma vez
        format: jsonSchema, // Usa JSON schema para forçar formato
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao chamar Ollama: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.message || !data.message.content) {
      throw new Error('Resposta inválida do Ollama');
    }

    const rawResponse = data.message.content.trim();

    // Tenta fazer parse do JSON
    let jsonResponse: OllamaJSONResponse;

    try {
      // Tenta extrair JSON se vier dentro de markdown code blocks
      let jsonString = rawResponse;
      
      // Remove markdown code blocks se existirem
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        // Tenta encontrar JSON dentro da resposta
        const jsonObjectMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }

      jsonResponse = JSON.parse(jsonString);

      // Valida se tem os campos obrigatórios
      if (!jsonResponse.resposta) {
        throw new Error('Campo "resposta" não encontrado no JSON');
      }

    } catch (parseError) {
      // Fallback: retorna a resposta como texto
      jsonResponse = {
        resposta: rawResponse,
      };
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao Ollama. Verifique se está rodando em http://localhost:11434');
    }
    throw error;
  }
}

