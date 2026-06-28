import React from 'react';

export default function PasarelaPrueba({ usuario, setUsuario, setVista, darkMode }) {
  const esPremium = usuario?.premium === true;

  const activarMembresiaSimulada = () => {
    const usuarioPremium = { ...usuario, premium: true, fechaPago: Date.now() };
    localStorage.setItem('usuario_eduverify', JSON.stringify(usuarioPremium));
    setUsuario(usuarioPremium);
    alert("💎 ¡Membresía Premium Universitaria activada con éxito!");
    setVista('catalogo');
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
            <span className="text-sm font-black text-blue-500 font-mono mt-0.5 block">23 de julio de 2026</span>
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
          <button onClick={activarMembresiaSimulada} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md">💳 Activar Membresía de Prueba</button>
        </div>
      )}
    </div>
  );
}
