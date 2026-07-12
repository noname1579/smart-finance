'use client';

import { createContext, useContext, useState, ReactNode, useRef } from 'react';
import Toast from './Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const queueRef = useRef<ToastItem[]>([]);
  const isShowingRef = useRef(false);

  const showNextToast = () => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      setCurrentToast(null);
      return;
    }

    const next = queueRef.current.shift();
    if (next) {
      setCurrentToast(next);
      isShowingRef.current = true;
    }
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    const newToast: ToastItem = {
      id: Date.now(),
      message,
      type,
    };

    queueRef.current.push(newToast);

    if (!isShowingRef.current) {
      showNextToast();
    }
  };

  const handleToastClose = () => {
    setCurrentToast(null);
    isShowingRef.current = false;
    setTimeout(showNextToast, 200); // Небольшая задержка перед следующим
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {currentToast && (
        <Toast
          key={currentToast.id}
          message={currentToast.message}
          type={currentToast.type}
          onClose={handleToastClose}
        />
      )}
    </ToastContext.Provider>
  );
}