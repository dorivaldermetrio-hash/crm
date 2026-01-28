/**
 * Configuração centralizada do modelo Ollama
 * 
 * Para alterar o modelo usado em todo o sistema, modifique apenas este arquivo.
 * O modelo pode ser configurado via variável de ambiente OLLAMA_MODEL
 * ou será usado o padrão 'llama3.1:8b'
 */

/**
 * Retorna o nome do modelo Ollama a ser usado
 * Prioridade: OLLAMA_MODEL (env) > padrão 'llama3.1:8b'
 * 
 * @returns Nome do modelo Ollama (ex: 'llama3.1:8b')
 */
export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || 'llama3.1:8b';
}

/**
 * Constante com o modelo padrão (para uso direto quando necessário)
 */
export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';
