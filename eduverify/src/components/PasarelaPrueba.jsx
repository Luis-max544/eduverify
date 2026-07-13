import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Gem, FileText, CreditCard } from 'lucide-react';
import { premium } from '../api';
import { useToast } from './Toast';

export default function PasarelaPrueba({ usuario, setUsuario, setVista, darkMode }) {
  const esPremium = usuario?.premium === true;
  const [fechaPago, setFechaPago] = useState(null);
  const notify = useToast();

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
      notify.success("¡Membresía Premium Universitaria activada con éxito!");
      setVista('catalogo');
    } catch (err) {
      notify.error(`Error al activar la membresía: ${err.message}`);
    }
  };

  const cancelarMembresia = async () => {
    if (!window.confirm('¿Cancelar tu membresía Premium? Perderás el acceso a todo el contenido exclusivo.')) return;
    try {
      await premium.cancel();
      setUsuario({ ...usuario, premium: false });
      notify.success('Membresía cancelada correctamente.');
      setVista('catalogo');
    } catch (err) {
      notify.error(`Error al cancelar la membresía: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in pb-20 select-none">
      <button onClick={() => setVista('catalogo')} className="mb-4 text-xs font-bold text-gray-400 uppercase inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Regresar</button>
      {esPremium ? (
        <div className={darkMode ? "p-6 md:p-8 rounded-3xl border space-y-6 bg-gray-900 border-white/5 text-white" : "p-6 md:p-8 rounded-3xl border space-y-6 bg-white border-gray-200 shadow-xl"}>
          <div className="text-center">
            <Crown size={36} className="mx-auto mb-2 text-amber-500" />
            <h2 className="text-lg font-black uppercase tracking-tight">Tu Membresía Universitaria</h2>
            <p className="text-[11px] text-gray-400">Estado de cuenta verificado</p>
          </div>
          <div className={darkMode ? "p-4 rounded-2xl border bg-gray-950/60 border-white/5" : "p-4 rounded-2xl border bg-[var(--clr-base)] border-[var(--clr-border-subtle)]"}>
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">Fecha de caducidad</span>
            <span className="text-sm font-black text-cyan-500 font-mono mt-0.5 block">{fechaCaducidad}</span>
          </div>
          <button type="button" onClick={() => notify.info("Generando recibo oficial PDF...")} className={darkMode ? "w-full py-2.5 rounded-xl text-xs font-bold bg-gray-950 border border-white/10 text-white inline-flex items-center justify-center gap-1.5" : "w-full py-2.5 rounded-xl text-xs font-bold bg-white border border-gray-300 text-gray-700 inline-flex items-center justify-center gap-1.5"}><FileText size={14} /> Recibo PDF</button>
          <button type="button" onClick={cancelarMembresia} className="w-full py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider">Cancelar Membresía</button>
        </div>
      ) : (
        <div className={darkMode ? "p-6 md:p-8 rounded-3xl border text-center space-y-5 bg-gray-900 border-white/5 text-white" : "p-6 md:p-8 rounded-3xl border text-center space-y-5 bg-white border-gray-200 shadow-xl"}>
          <Gem size={36} className="mx-auto mb-2 text-cyan-500" />
          <h2 className="text-lg font-black uppercase tracking-tight">Liberar Acceso Completo</h2>
          <div className="py-4 border-y dark:border-white/5">
            <span className="text-3xl font-black font-mono text-cyan-500">$149.00</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">/ Mes</span>
          </div>
          <button onClick={activarMembresia} className="w-full bg-cyan-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md inline-flex items-center justify-center gap-1.5"><CreditCard size={14} /> Activar Membresía de Prueba</button>
        </div>
      )}
    </div>
  );
}
