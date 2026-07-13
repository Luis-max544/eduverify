import { createContext, useMemo, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_LIMIT = 3;
const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 200;

const COLORS = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', text: 'text-emerald-500' },
  error:   { icon: XCircle,      bar: 'bg-[var(--clr-danger)]', text: 'text-[var(--clr-danger)]' },
  info:    { icon: Info,         bar: 'bg-[var(--clr-accent)]', text: 'text-[var(--clr-accent)]' },
};

function ToastItem({ toast, onClose }) {
  const { icon: Icon, text, bar } = COLORS[toast.type] || COLORS.info;
  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-3.5 pr-4 rounded-xl border shadow-xl transition-all bg-[var(--clr-surface)] border-[var(--clr-border)] text-[var(--clr-text-primary)] ${toast.exiting ? 'toast-exiting' : 'animate-slide-in-right'}`}>
      <div className={`w-0.5 self-stretch rounded-full shrink-0 ${bar}`} />
      <Icon size={16} className={`${text} shrink-0 mt-0.5`} />
      <p className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-[var(--clr-text-muted)] hover:text-[var(--clr-text-primary)] shrink-0 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    // Trigger exit animation, then remove
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      const next = [...prev, { id, type, message, exiting: false }];
      // Evict oldest if over limit
      return next.length > TOAST_LIMIT ? next.slice(next.length - TOAST_LIMIT) : next;
    });
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  // useMemo (not useCallback) — memoizes an object, not a function
  const notify = useMemo(() => ({
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
  }), [push]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed top-[72px] right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { success: () => {}, error: () => {}, info: () => {} };
}
