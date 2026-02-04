'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  userId: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/api'];

  const isPublicRoute = (path: string) => {
    return publicRoutes.some(route => path.startsWith(route));
  };

  // Verifica autenticação ao montar e quando a rota muda
  const checkAuth = useCallback(async () => {
    try {
      // Pequeno delay para garantir que os cookies estejam disponíveis após redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Importante para enviar cookies
        cache: 'no-store', // Não usar cache
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Auth check result:', data);
        if (data.success && data.user) {
          console.log('✅ Usuário autenticado:', data.user);
          setUser(data.user);
        } else {
          console.log('❌ Usuário não autenticado');
          setUser(null);
        }
      } else {
        console.log('❌ Resposta não OK:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicia o fluxo de login OAuth
  const login = () => {
    window.location.href = '/api/auth/login';
  };

  // Faz logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpa o estado local e redireciona
      setUser(null);
      router.push('/login');
    }
  };

  // Verifica autenticação ao montar o componente
  useEffect(() => {
    checkAuth();
  }, []);

  // Re-verifica autenticação quando a rota muda (útil após redirect de login)
  useEffect(() => {
    // Se não está carregando e não há usuário, mas não é rota pública, verifica novamente
    // Isso é útil após um redirect de login, quando os cookies podem ainda não estar disponíveis
    if (!isLoading && !user && !isPublicRoute(pathname)) {
      // Aguarda um pouco mais e verifica novamente (pode ser que os cookies ainda não estejam disponíveis)
      const timeoutId = setTimeout(() => {
        console.log('🔄 Re-verificando autenticação após mudança de rota...');
        checkAuth();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, isLoading, user, checkAuth]);

  // Protege rotas privadas
  useEffect(() => {
    // Não redireciona enquanto está carregando
    if (isLoading) {
      return;
    }

    // Não redireciona se for rota pública
    if (isPublicRoute(pathname)) {
      return;
    }

    // Se não há usuário autenticado, aguarda um pouco antes de redirecionar
    // Isso dá tempo para o re-check acima encontrar o usuário após redirect de login
    if (!user) {
      const timeoutId = setTimeout(() => {
        console.log('🔒 Rota protegida, redirecionando para login:', pathname);
        const returnUrl = pathname;
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      }, 1500); // Aguarda 1.5 segundos para dar tempo dos cookies estarem disponíveis e do checkAuth executar
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, user, pathname, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
