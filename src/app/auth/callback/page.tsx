'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente interno que usa useSearchParams
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Aguarda um pouco para garantir que os cookies estejam disponíveis
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verifica autenticação
        await checkAuth();
        
        // Obtém a URL de retorno ou usa a raiz
        const returnUrl = searchParams.get('returnUrl') || '/';
        
        // Aguarda mais um pouco antes de redirecionar
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redireciona para a página principal
        router.push(returnUrl);
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router, searchParams, checkAuth]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-400">Finalizando login...</p>
      </div>
    </div>
  );
}

/**
 * Página intermediária para processar o callback do OAuth
 * Esta página recebe os cookies do servidor e redireciona para a página principal
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
