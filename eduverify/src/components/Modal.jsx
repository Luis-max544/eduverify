import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, icon: Icon, maxWidth = 'max-w-md', darkMode, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} p-6 rounded-[2rem] border shadow-2xl ${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
      >
        {(title || Icon) && (
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              {Icon && <Icon size={20} className="text-blue-500 shrink-0" />}
              {title && <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">{title}</h3>}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 font-bold shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
