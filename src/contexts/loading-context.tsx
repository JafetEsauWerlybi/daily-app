import React, { createContext, useContext, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface LoadingContextType {
  isLoading: boolean;
  show: () => void;
  hide: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const show = () => {
    setIsLoading(true);
  };
  const hide = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, show, hide }}>
      {children}
      <LoadingScreen visible={isLoading} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading debe usarse dentro de LoadingProvider');
  }
  return context;
}
