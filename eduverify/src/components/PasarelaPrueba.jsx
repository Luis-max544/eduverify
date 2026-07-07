import React, { useState, useEffect } from 'react';
import { premium } from '../api';

export default function PasarelaPrueba({ usuario, setUsuario, setVista, darkMode }) {
  const esPremium = usuario?.premium === true;
  const [fechaPago, setFechaPago] = useState(null);

  useEffect(() => {
    if (esPremium) {
      premium.status().then(d => setFechaPago(d.fecha_pago)).catch(() => {});
    }
  }, [esPremium]);

  const fechaCaducidad = fechaPago
    ? new Date(new Date(fechaPago).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const activarMembresia = async () => {
    try {
      await premium.activate();
      setUsuario({ ...usuario, premium: true });
      alert("💎 ¡Membresía Premium Universitaria activada con éxito!");
      setVista('catalogo');
    } catch (err) {
      alert(`Error al activar la membresía: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in pb-20 select-none">
      <button onClick={() => setVista('catalogo')} className="mb-4 text-xs font-bold text-gray-400 uppercase block">← Regresar</button>
      {esPremium ? (
        <div className={darkMode ? "p-6 md:p-8 rounded-3xl border space-y-6 bg-gray-900 border-white/5 text-white" : "p-6 md:p-8 rounded-3xl border space-y-6 bg-white border-gray-200 shadow-xl"}>
          <div className="text-center">
            <span className="text-4xl block mb-2">👑</span>
            <h2 className="text-lg font-black uppercase tracking-tight">Tu Membresía Universitaria</h2>
            <p className="text-[11px] text-gray-400">Estado de cuenta verificado</p>
          </div>
          <div className={darkMode ? "p-4 rounded-2xl border bg-gray-950/60 border-white/5" : "p-4 rounded-2xl border bg-gray-50 border-gray-100"}>
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Fecha de caducidad</span>
            <span className="text-sm font-black text-blue-500 font-mono mt-0.5 block">{fechaCaducidad}</span>
          </div>
          <button type="button" onClick={() => alert("Generando recibo oficial PDF...")} className={darkMode ? "w-full py-2.5 rounded-xl text-xs font-bold bg-gray-950 border border-white/10 text-white" : "w-full py-2.5 rounded-xl text-xs font-bold bg-white border border-gray-300 text-gray-700"}>📄 Recibo PDF</button>
        </div>
      ) : (
        <div className={darkMode ? "p-6 md:p-8 rounded-3xl border text-center space-y-5 bg-gray-900 border-white/5 text-white" : "p-6 md:p-8 rounded-3xl border text-center space-y-5 bg-white border-gray-200 shadow-xl"}>
          <span className="text-4xl block mb-2">💎</span>
          <h2 className="text-lg font-black uppercase tracking-tight">Liberar Acceso Completo</h2>
          <div className="py-4 border-y dark:border-white/5">
            <span className="text-3xl font-black font-mono text-blue-500">$149.00</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">/ Mes</span>
          </div>
          <button onClick={activarMembresia} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md">💳 Activar Membresía de Prueba</button>
        </div>
      )}
    </div>
  );
}
