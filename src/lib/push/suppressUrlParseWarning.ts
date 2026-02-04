/**
 * Suprime o warning de depreciação do url.parse() usado pela biblioteca web-push
 * 
 * Este warning (DEP0169) é emitido pela biblioteca web-push que usa url.parse() internamente.
 * Não afeta a funcionalidade, mas gera ruído nos logs.
 * 
 * IMPORTANTE: Este arquivo deve ser importado ANTES de qualquer importação de web-push
 */

if (typeof process !== 'undefined') {
  // Intercepta process.emitWarning para suprimir o warning DEP0169
  const originalEmitWarning = process.emitWarning;
  
  process.emitWarning = function(
    warning: string | Error,
    type?: string | Function,
    code?: string,
    ctor?: Function
  ) {
    // Suprime apenas o warning DEP0169 sobre url.parse()
    if (code === 'DEP0169' || 
        (typeof warning === 'string' && warning.includes('url.parse()')) ||
        (warning instanceof Error && warning.message.includes('url.parse()'))) {
      return;
    }
    
    // Para todos os outros warnings, mantém o comportamento padrão
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
  
  // Também configura listener para warnings emitidos via process.on('warning')
  if (process.on) {
    process.on('warning', (warning: Error & { code?: string; name?: string }) => {
      // Ignora apenas o warning DEP0169 sobre url.parse()
      if (warning.name === 'DeprecationWarning' && warning.code === 'DEP0169') {
        // Silenciosamente ignora este warning específico
        return;
      }
    });
  }
}
