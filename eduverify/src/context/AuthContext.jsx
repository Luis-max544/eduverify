import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [cargando, setCargando] = useState(() => Boolean(api.getToken()));
  const [paramsReset, setParamsReset] = useState(null);

  // One-time migration: clear old localStorage keys
  useEffect(() => {
    ['usuario_eduverify', 'eduverify_videos_globales', 'eduverify_suscripciones', 'eduverify_notificaciones']
      .forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage)
      .filter(k =>
        k.startsWith('eduverify_foto_') || k.startsWith('eduverify_banner_') ||
        k.startsWith('eduverify_listas_') || k.startsWith('eduverify_playlists_creadas_') ||
        k.startsWith('eduverify_foros_video_')
      )
      .forEach(k => localStorage.removeItem(k));
  }, []);

  // Rehydrate session from stored token
  useEffect(() => {
    if (!api.getToken()) return;
    api.users.me()
      .then(user => {
        setUsuario(user);
        setDarkMode(Boolean(user.dark_mode));
      })
      .catch(() => api.clearToken())
      .finally(() => setCargando(false));
  }, []);

  // Sync data-theme attribute for CSS token overrides
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Parse password-reset URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'reset' && params.get('id') && params.get('token')) {
      setParamsReset({ id: params.get('id'), token: params.get('token') });
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force logout so <Login> mounts and shows the reset form
      api.clearToken();
      setUsuario(null);
      setCargando(false);
    }
  }, []);

  // Force logout on 401 from any API call
  useEffect(() => {
    const onLogout = () => {
      api.clearToken();
      setUsuario(null);
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const cambiarDarkMode = (valor) => {
    setDarkMode(valor);
    if (usuario) api.users.updateDarkMode(valor).catch(() => {});
  };

  const cerrarSesion = () => {
    api.clearToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{
      usuario, setUsuario,
      darkMode, cambiarDarkMode,
      cargando,
      cerrarSesion,
      paramsReset, setParamsReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
