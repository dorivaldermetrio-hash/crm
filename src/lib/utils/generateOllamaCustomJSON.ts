/**
 * Gera uma resposta em formato JSON customizado usando o provider de IA configurado
 * Permite definir um schema JSON personalizado
 */

import { getAIProvider, getAIModel, getOpenAIKey, getOllamaURL } from '@/lib/config/ai';

interface CustomJSONResponse {
  [key: string]: any;
}

/**
 * Gera uma resposta em formato JSON usando o provider de IA configurado com schema customizado
 * @param prompt - O prompt completo estruturado
 * @param jsonSchema - Schema JSON customizado
 * @param modelName - Nome do modelo (padrão: obtido de getAIModel())
 * @returns Objeto JSON com a resposta
 */
export async function generateOllamaCustomJSON(
  prompt: string,
  jsonSchema: any,
  modelName?: string
): Promise<CustomJSONResponse> {
  const provider = getAIProvider();
  const model = modelName || getAIModel();

  // Chama a API apropriada
  if (provider === 'openai') {
    return await callOpenAICustomJSON(prompt, model, jsonSchema);
  } else {
    return await callOllamaCustomJSON(prompt, model, jsonSchema);
  }
}

/**
 * Chama a API da OpenAI para JSON customizado
 */
async function callOpenAICustomJSON(
  prompt: string,
  model: string,
  jsonSchema: any
): Promise<CustomJSONResponse> {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada. Configure no .env.local');
    }

    // OpenAI usa response_format com json_object
    // Nota: OpenAI não suporta schema customizado diretamente, mas força JSON
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
            content: `${prompt}\n\nResponda APENAS com um JSON válido seguindo este schema: ${JSON.stringify(jsonSchema)}`,
          },
        ],
        response_format: { type: 'json_object' },
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

    let jsonResponse: CustomJSONResponse;

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
    } catch (parseError) {
      throw new Error(`Erro ao fazer parse do JSON: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}`);
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
 * Chama a API do Ollama para JSON customizado
 */
async function callOllamaCustomJSON(
  prompt: string,
  model: string,
  jsonSchema: any
): Promise<CustomJSONResponse> {
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

    let jsonResponse: CustomJSONResponse;

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
    } catch (parseError) {
      throw new Error(`Erro ao fazer parse do JSON: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}`);
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao Ollama. Verifique se está rodando em http://localhost:11434');
    }
    throw error;
  }
}

