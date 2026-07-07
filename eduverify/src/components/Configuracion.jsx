import React, { useState } from 'react';
import { auth, users as usersApi } from '../api';

export default function Configuracion({ usuario, setUsuario, setVista, darkMode }) {
  // Estados principales del formulario
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email] = useState(usuario?.email || '');
  const [foto, setFoto] = useState(usuario?.avatar_url || null);

  // Estados para la recuperación de contraseña por correo
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [statusMensaje, setStatusMensaje] = useState({ tipo: '', texto: '' });

  // 📷 SUBIDA DE FOTO REAL (multipart al API, devuelve la URL pública)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("⚠️ La imagen es demasiado pesada. Elige una menor a 2MB.");
      return;
    }
    try {
      const { avatar_url } = await usersApi.uploadAvatar(file);
      setFoto(avatar_url);
      setUsuario({ ...usuario, avatar_url });
    } catch (err) {
      alert(`Error al subir la foto: ${err.message}`);
    }
  };

  // 🔒 ENVIAR CORREO DE CAMBIO DE CONTRASEÑA
  const handleEnviarCorreoPassword = async () => {
    setEnviandoEmail(true);
    setStatusMensaje({ tipo: '', texto: '' });
    try {
      await auth.cambiarPassword(usuario?.email);
      setStatusMensaje({
        tipo: 'success',
        texto: `📬 ¡Enlace enviado! Revisa la bandeja de entrada de: ${usuario?.email}`
      });
    } catch (error) {
      setStatusMensaje({
        tipo: 'error',
        texto: `⚠️ No se pudo enviar el correo: ${error.message}`
      });
    } finally {
      setEnviandoEmail(false);
    }
  };

  // 💾 GUARDAR CAMBIOS DE PERFIL EN EL API
  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("⚠️ El nombre no puede quedar vacío.");

    try {
      const actualizado = await usersApi.updateNombre(nombre.trim());
      setUsuario(actualizado);
      alert("✔ Perfil actualizado correctamente.");
      setVista('catalogo');
    } catch (err) {
      alert(`Error al actualizar el perfil: ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-16 animate-fade-in select-none font-sans">
      
      {/* Botón Volver Fiel a image_9235f5.png */}
      <button 
        onClick={() => setVista('catalogo')}
        className="mb-4 text-left block text-[11px] font-black tracking-widest text-gray-400 hover:text-blue-500 transition-colors uppercase"
      >
        ← Volver
      </button>

      <div className="space-y-5">
        
        {/* ========================================================================= */}
        {/* CARD 1: IDENTIDAD VISUAL (Reflejo exacto de tu diseño previo)            */}
        {/* ========================================================================= */}
        <div className={`p-6 rounded-3xl border text-center shadow-sm ${darkMode ? 'bg-gray-900 border-white/5' : 'bg-white border-gray-200'}`}>
          <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">
            Identidad Visual
          </span>

          {/* Contenedor del Avatar Inteligente */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2 border-blue-600/20 bg-blue-600 text-white font-black text-2xl shadow-inner`}>
              {foto ? (
                <img src={foto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{nombre ? nombre.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            
            {/* Overlay Azul de Cámara para subir fotos de verdad */}
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer border-2 border-white dark:border-gray-900">
              <span className="text-xs">📷</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          </div>

          <h3 className={`text-sm font-black uppercase tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {nombre || 'Usuario EduVerify'}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {usuario?.rol === 'profesor' || usuario?.rol === 'creador' ? 'Profesor' : 'Estudiante'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: FORMULARIO DE DETALLES Y ACCIONES                                 */}
        {/* ========================================================================= */}
        <div className={`p-6 md:p-8 rounded-3xl border shadow-sm ${darkMode ? 'bg-gray-900 border-white/5' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleGuardarConfiguracion} className="space-y-5 text-left">
            
            {/* Input Nombre */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-1">
                Nombre Completo
              </label>
              <input 
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Profe Luis"
                className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition focus:border-blue-500 ${darkMode ? 'bg-gray-950 border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
              />
            </div>

            {/* Input Correo (Deshabilitado de edición por reglas de base de datos) */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-1">
                Correo Electrónico
              </label>
              <input 
                type="email"
                disabled
                value={email}
                className={`w-full p-3.5 rounded-xl border text-xs font-mono outline-none opacity-60 cursor-not-allowed ${darkMode ? 'bg-gray-950 border-white/5 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
              />
            </div>

            {/* MÓDULO INTERACTIVO DE SEGURIDAD (Restablecer Contraseña) */}
            <div className="pt-2">
              <button
                type="button"
                disabled={enviandoEmail}
                onClick={handleEnviarCorreoPassword}
                className={`text-[11px] font-bold px-4 py-2 rounded-xl transition-all border ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {enviandoEmail ? '⏳ Solicitando token...' : '🔒 Cambiar Contraseña'}
              </button>

              {/* Alertas dinámicas flotantes */}
              {statusMensaje.texto && (
                <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-medium leading-relaxed animate-fade-in">
                  {statusMensaje.texto}
                </div>
              )}
            </div>

            {/* Botón Guardar Principal de image_9235f5.png */}
            <div className="pt-3">
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest shadow-md shadow-blue-500/10 transition-colors"
              >
                Guardar Configuración
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}