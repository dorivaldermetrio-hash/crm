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
  
  // Usa type assertion para evitar problemas com múltiplas assinaturas sobrecarregadas
  (process as any).emitWarning = function(
    warning: string | Error,
    typeOrCtor?: string | Function,
    codeOrCtor?: string | Function,
    ctor?: Function
  ) {
    // Determina qual parâmetro é o code baseado nos tipos
    let code: string | undefined;
    
    if (typeof typeOrCtor === 'string' && typeof codeOrCtor === 'string') {
      code = codeOrCtor;
    }
    
    // Suprime apenas o warning DEP0169 sobre url.parse()
    if (code === 'DEP0169' || 
        (typeof warning === 'string' && warning.includes('url.parse()')) ||
        (warning instanceof Error && warning.message.includes('url.parse()'))) {
      return;
    }
    
    // Para todos os outros warnings, mantém o comportamento padrão
    // Usa apply para passar os argumentos corretamente
    const args: any[] = [warning];
    if (typeof typeOrCtor === 'string' && typeof codeOrCtor === 'string') {
      // Assinatura: emitWarning(warning, { type, code, ctor? })
      args.push({ type: typeOrCtor, code: codeOrCtor, ctor: ctor });
    } else if (typeof typeOrCtor === 'string') {
      // Assinatura: emitWarning(warning, type, ctor?)
      args.push(typeOrCtor);
      if (codeOrCtor) args.push(codeOrCtor);
    } else if (typeof typeOrCtor === 'function') {
      // Assinatura: emitWarning(warning, ctor)
      args.push(typeOrCtor);
    }
    return (originalEmitWarning as any).apply(this, args);
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
