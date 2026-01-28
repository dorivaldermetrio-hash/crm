/**
 * Gera uma resposta em formato JSON customizado usando o modelo Ollama
 * Permite definir um schema JSON personalizado
 */

import { getOllamaModel } from '@/lib/config/ollama';

interface CustomJSONResponse {
  [key: string]: any;
}

/**
 * Gera uma resposta em formato JSON usando o modelo Ollama com schema customizado
 * @param prompt - O prompt completo estruturado
 * @param jsonSchema - Schema JSON customizado
 * @param modelName - Nome do modelo (padrão: obtido de getOllamaModel())
 * @returns Objeto JSON com a resposta
 */
export async function generateOllamaCustomJSON(
  prompt: string,
  jsonSchema: any,
  modelName: string = getOllamaModel()
): Promise<CustomJSONResponse> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

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
        format: jsonSchema, // Usa JSON schema customizado
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
    let jsonResponse: CustomJSONResponse;

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

