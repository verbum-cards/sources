import React, { createContext, useCallback, useRef, useState } from 'react';

import { Toast } from '../components/Toast';

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3000;

// Общая нижняя нотификация (useToast()) — один экземпляр на всё приложение,
// монтируется в App.tsx рядом с остальными провайдерами. Новый show()
// перекрывает ещё не скрывшийся тост — очередь не нужна, это короткие
// одноразовые подтверждения, а не журнал сообщений.
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(options);
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, options.durationMs ?? DEFAULT_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={toast.onAction} />
      ) : null}
    </ToastContext.Provider>
  );
};
