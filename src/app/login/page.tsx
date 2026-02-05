'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useAuth } from '@/contexts/AuthContext';

function LoginContent() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Remove scroll do body e html quando a página carregar
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Limpa os estilos quando o componente desmontar
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Se já estiver autenticado, redireciona para a página principal
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const returnUrl = searchParams.get('returnUrl') || '/';
      router.push(returnUrl);
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

  // Verifica se há erro na URL
  const error = searchParams.get('error');
  const errorMessages: Record<string, string> = {
    'no_code': 'Código de autorização não recebido. Tente novamente.',
    'no_tokens': 'Não foi possível obter os tokens. Tente novamente.',
    'no_refresh_token': 'Não foi possível obter o refresh token. Tente novamente.',
    'invalid_grant': 'Autorização inválida. Tente fazer login novamente.',
    'config': 'Erro de configuração. Entre em contato com o suporte.',
    'unknown': 'Erro desconhecido. Tente novamente.',
  };

  const handleLogin = () => {
    setIsLoggingIn(true);
    const returnUrl = searchParams.get('returnUrl') || '/';
    window.location.href = `/api/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Vídeo de fundo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/login/vdbackground.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/50 z-[5]"></div>
      
      {/* Conteúdo da página */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        {/* Painel de Login */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-6 md:p-8 w-full max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Lado Esquerdo - Logo e Nome */}
            <div className="flex flex-col items-center justify-center -mt-12 md:-mt-14">
              {/* Logo */}
              <div className="mb-0">
                <AnimatedLogo
                  className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
                  strokeWidth={3}
                />
              </div>
              
              {/* Nome do Sistema */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-center advosoft-title -mt-12 md:-mt-14 lg:-mt-16">
                AdvoSoft
              </h1>
              
              {/* Subtítulo */}
              <p className="text-xl md:text-2xl lg:text-3xl font-medium text-center mt-2 assistant-subtitle">
                Assistant
              </p>
            </div>

            {/* Lado Direito - Mensagem, Botão e Link */}
            <div className="flex flex-col items-center justify-center gap-3">
              {/* Mensagem de Saudação */}
              <div className="mb-1 text-center">
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 drop-shadow-lg">
                  Seja bem-vindo!
                </h2>
                <p className="text-base md:text-lg text-white/90 drop-shadow-md">
                  Ao melhor sistema de atendimento para advogados
                </p>
              </div>

              {/* Mensagem de Erro */}
              {error && errorMessages[error] && (
                <div className="w-full md:w-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {errorMessages[error]}
                </div>
              )}

              {/* Botão de Login com Google */}
              <button
                onClick={handleLogin}
                disabled={isLoading || isLoggingIn}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                    <span>Redirecionando para Google...</span>
                  </>
                ) : (
                  <>
                    {/* Ícone do Google */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </>
                )}
              </button>

              {/* Link para Política e Termos */}
              <p className="text-sm text-white/80 text-center drop-shadow-sm">
                Ao entrar, você concorda com nossa{' '}
                <Link 
                  href="/privacy" 
                  className="text-blue-200 hover:text-blue-100 underline transition-colors font-medium"
                >
                  Política de Privacidade
                </Link>
                {' '}e{' '}
                <Link 
                  href="/terms" 
                  className="text-blue-200 hover:text-blue-100 underline transition-colors font-medium"
                >
                  Termos de Uso
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
