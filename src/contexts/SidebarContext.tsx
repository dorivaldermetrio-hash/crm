'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // No mobile, sempre inicia fechado (mas visível na forma reduzida w-20)
      // No desktop, mantém o estado atual
      if (mobile) {
        setIsOpen(false);
      } else {
        // Ao voltar para desktop, pode reabrir se estava fechado
        setIsOpen(true);
      }
    };

    // Verifica na montagem inicial
    const initialMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setIsMobile(initialMobile);
    if (initialMobile) {
      setIsOpen(false);
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

