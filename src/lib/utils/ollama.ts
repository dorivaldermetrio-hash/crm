/**
 * Integração com IA para gerar respostas automáticas
 * Suporta OpenAI e Ollama
 */

import { getAIProvider, getAIModel, getOpenAIKey, getOllamaURL } from '@/lib/config/ai';

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
 * Gera uma resposta usando o provider de IA configurado (OpenAI ou Ollama)
 * @param prompt - A mensagem do usuário
 * @param conversationHistory - Histórico da conversa (últimas mensagens)
 * @param modelName - Nome do modelo (padrão: obtido de getAIModel())
 */
export async function generateOllamaResponse(
  prompt: string,
  conversationHistory: MessageHistory[] = [],
  modelName?: string
): Promise<string> {
  const provider = getAIProvider();
  const model = modelName || getAIModel();
  
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

  // Chama a API apropriada baseada no provider
  if (provider === 'openai') {
    return await callOpenAI(messages, model);
  } else {
    return await callOllama(messages, model);
  }
}

/**
 * Chama a API da OpenAI
 */
async function callOpenAI(messages: MessageHistory[], model: string): Promise<string> {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada. Configure no .env.local');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao chamar OpenAI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Resposta inválida da OpenAI');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar à API da OpenAI. Verifique sua conexão com a internet.');
    }
    throw error;
  }
}

/**
 * Chama a API do Ollama
 */
async function callOllama(messages: MessageHistory[], model: string): Promise<string> {
  try {
    const OLLAMA_URL = getOllamaURL();

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
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
 * Gera uma resposta em formato JSON usando o provider de IA configurado
 * @param prompt - O prompt completo estruturado
 * @param modelName - Nome do modelo (padrão: obtido de getAIModel())
 * @returns Objeto JSON com resposta
 */
export async function generateOllamaJSONResponse(
  prompt: string,
  modelName?: string
): Promise<OllamaJSONResponse> {
  const provider = getAIProvider();
  const model = modelName || getAIModel();

  // JSON schema para forçar formato JSON
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

  // Chama a API apropriada
  if (provider === 'openai') {
    return await callOpenAIJSON(prompt, model, jsonSchema);
  } else {
    return await callOllamaJSON(prompt, model, jsonSchema);
  }
}

/**
 * Chama a API da OpenAI para resposta JSON
 */
async function callOpenAIJSON(
  prompt: string,
  model: string,
  jsonSchema: any
): Promise<OllamaJSONResponse> {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada. Configure no .env.local');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nResponda APENAS com um JSON válido no formato: {"resposta": "sua resposta aqui"}`,
          },
        ],
        response_format: { type: 'json_object' }, // OpenAI requer json_object para JSON e a palavra "json" nas mensagens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao chamar OpenAI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Resposta inválida da OpenAI');
    }

    const rawResponse = data.choices[0].message.content.trim();

    // Tenta fazer parse do JSON
    let jsonResponse: OllamaJSONResponse;

    try {
      let jsonString = rawResponse;
      
      // Remove markdown code blocks se existirem
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        const jsonObjectMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }

      jsonResponse = JSON.parse(jsonString);

      if (!jsonResponse.resposta) {
        throw new Error('Campo "resposta" não encontrado no JSON');
      }

    } catch (parseError) {
      jsonResponse = {
        resposta: rawResponse,
      };
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar à API da OpenAI. Verifique sua conexão com a internet.');
    }
    throw error;
  }
}

/**
 * Chama a API do Ollama para resposta JSON
 */
async function callOllamaJSON(
  prompt: string,
  model: string,
  jsonSchema: any
): Promise<OllamaJSONResponse> {
  try {
    const OLLAMA_URL = getOllamaURL();

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        format: jsonSchema,
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

    let jsonResponse: OllamaJSONResponse;

    try {
      let jsonString = rawResponse;
      
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        const jsonObjectMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }

      jsonResponse = JSON.parse(jsonString);

      if (!jsonResponse.resposta) {
        throw new Error('Campo "resposta" não encontrado no JSON');
      }

    } catch (parseError) {
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

