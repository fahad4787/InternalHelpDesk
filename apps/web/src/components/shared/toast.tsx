'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

let pushToast: ((message: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'info') {
  pushToast?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    pushToast = (message, type = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-xl border px-4 py-3 text-sm shadow-lg',
            toast.type === 'success' && 'border-positive-muted bg-positive-light text-positive',
            toast.type === 'error' && 'border-red-200 bg-red-50 text-red-800',
            toast.type === 'info' && 'border-border-warm bg-white text-ink',
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
