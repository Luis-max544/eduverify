import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const COLORS = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  error:   { icon: XCircle,      bar: 'bg-red-500',     text: 'text-red-500',     bg: 'bg-red-500/5' },
  info:    { icon: Info,         bar: 'bg-blue-500',    text: 'text-blue-500',    bg: 'bg-blue-500/5' },
};

function ToastItem({ toast, onClose, darkMode }) {
  const { icon: Icon, text, bar } = COLORS[toast.type] || COLORS.info;
  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-3.5 pr-4 rounded-2xl border shadow-2xl animate-fade-in transition-all ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className={`w-1 self-stretch rounded-full shrink-0 ${bar}`} />
      <Icon size={18} className={`${text} shrink-0 mt-0.5`} />
      <p className="text-xs font-medium flex-1 leading-relaxed">{toast.message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ darkMode, children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const notify = useCallback({
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
  }, [push]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} darkMode={darkMode} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { success: () => {}, error: () => {}, info: () => {} };
}
