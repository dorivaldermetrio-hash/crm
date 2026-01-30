/**
 * Configuração centralizada de IA
 * 
 * Suporta múltiplos providers: OpenAI e Ollama
 * Para alterar o provider ou modelo usado em todo o sistema, modifique apenas este arquivo.
 */

export type AIProvider = 'openai' | 'ollama';

/**
 * Retorna o provider de IA a ser usado
 * Prioridade: AI_PROVIDER (env) > padrão 'openai'
 * 
 * @returns Provider de IA ('openai' ou 'ollama')
 */
export function getAIProvider(): AIProvider {
  return (process.env.AI_PROVIDER || 'openai') as AIProvider;
}

/**
 * Retorna o nome do modelo a ser usado baseado no provider
 * Prioridade: Variável de ambiente específica > padrão
 * 
 * @returns Nome do modelo (ex: 'gpt-4o-mini' ou 'llama3.1:8b')
 */
export function getAIModel(): string {
  const provider = getAIProvider();
  
  if (provider === 'openai') {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }
  
  // Ollama
  return process.env.OLLAMA_MODEL || 'llama3.1:8b';
}

/**
 * Retorna a API Key da OpenAI
 * 
 * @returns API Key da OpenAI
 */
export function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || '';
}

/**
 * Retorna a URL do Ollama
 * 
 * @returns URL do Ollama
 */
export function getOllamaURL(): string {
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}
