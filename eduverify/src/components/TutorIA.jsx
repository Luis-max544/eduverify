import React, { useState, useEffect, useRef } from 'react';
import { Bot, AlertTriangle } from 'lucide-react';
import { ai as aiApi } from '../api';

export default function TutorIA({ video, darkMode }) {
  // Historial local del chat; se resetea al cambiar de video
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    setMensajes([]);
    setTexto('');
    setEscribiendo(false);
  }, [video?.id]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, escribiendo]);

  const enviar = async (e) => {
    e.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta || escribiendo || !video?.id) return;

    const historial = [...mensajes, { role: 'user', content: pregunta }];
    setMensajes(historial);
    setTexto('');
    setEscribiendo(true);
    try {
      // El API acepta máximo 20 mensajes: se envía la cola más reciente
      const recientes = historial.slice(-19);
      const desdeUser = recientes.findIndex(m => m.role === 'user');
      const { reply } = await aiApi.chat(video.id, recientes.slice(desdeUser));
      setMensajes(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMensajes(prev => [...prev, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className={`rounded-2xl border flex flex-col ${darkMode ? 'bg-gray-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
          <Bot size={14} /> Tutor IA
        </h4>
        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Pregunta lo que quieras sobre esta clase.</p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80 min-h-[10rem] p-4 space-y-3">
        {mensajes.length === 0 && !escribiendo && (
          <p className="text-[11px] text-gray-400 italic font-medium text-center pt-10">
            Ej: "Explícame el tema principal de esta clase con un ejemplo".
          </p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-cyan-600 text-white rounded-br-md'
                : m.error
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-md'
                  : darkMode ? 'bg-white/5 text-gray-200 rounded-bl-md' : 'bg-[var(--clr-surface-elevated)] text-gray-800 rounded-bl-md'
            }`}>
              {m.error && <AlertTriangle size={12} className="inline mr-1.5 -mt-0.5" />}
              {m.content}
            </div>
          </div>
        ))}
        {escribiendo && (
          <div className="flex justify-start">
            <div className={`px-3.5 py-2.5 rounded-2xl rounded-bl-md text-xs font-bold animate-pulse ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-[var(--clr-surface-elevated)] text-gray-500'}`}>
              El tutor está escribiendo...
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="flex gap-2 p-3 border-t border-gray-100 dark:border-white/5">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta..."
          maxLength={4000}
          className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none border bg-transparent focus:border-cyan-500 ${darkMode ? 'border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
        />
        <button
          type="submit"
          disabled={!texto.trim() || escribiendo}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wide shadow-sm"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
