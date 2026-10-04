import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'info';
interface ToastItem { id: number; message: string; kind: ToastKind }

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const id = useRef(0);

  const dismiss = useCallback((tid: number) => setToasts((t) => t.filter((x) => x.id !== tid)), []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const tid = ++id.current;
      setToasts((t) => [...t.slice(-2), { id: tid, message, kind }]);
      window.setTimeout(() => dismiss(tid), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            {t.kind === 'success' ? <CircleCheck size={16} aria-hidden /> : <Info size={16} aria-hidden />}
            <span>{t.message}</span>
            <button className="icon-btn icon-btn--sm toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export const COMING_SOON = 'Coming soon in this concept.';
