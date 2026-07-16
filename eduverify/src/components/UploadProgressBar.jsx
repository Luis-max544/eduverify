import React from 'react';
import { Upload, CheckCircle, XCircle, X } from 'lucide-react';

export default function UploadProgressBar({ uploads, onDismiss }) {
  if (!uploads || uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {uploads.map((u) => (
        <div
          key={u.id}
          className="bg-gray-900 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3"
        >
          <div className="shrink-0">
            {u.status === 'done' && <CheckCircle size={16} className="text-green-400" />}
            {u.status === 'error' && <XCircle size={16} className="text-red-400" />}
            {u.status === 'uploading' && <Upload size={16} className="text-cyan-400 animate-bounce" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{u.titulo}</p>
            {u.status === 'uploading' && (
              <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${u.progreso}%` }}
                />
              </div>
            )}
            {u.status === 'uploading' && (
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{u.progreso}%</p>
            )}
            {u.status === 'done' && <p className="text-[10px] text-green-400 mt-0.5">Completado</p>}
            {u.status === 'error' && <p className="text-[10px] text-red-400 mt-0.5">Error al subir</p>}
          </div>
          {u.status !== 'uploading' && (
            <button onClick={() => onDismiss(u.id)} className="text-gray-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
