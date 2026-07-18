import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NavigationContext = createContext(null);
export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }) {
  const { usuario, cargando } = useAuth();
  const [vista, setVista] = useState('login');
  const [sidebarAmpliado, setSidebarAmpliado] = useState(true);
  const [premiumVideo, setPremiumVideo] = useState(null);

  // After rehydration: navigate to catalog if user exists
  useEffect(() => {
    if (!cargando && usuario && vista === 'login') {
      setVista('catalogo');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, usuario]);

  // On logout: reset navigation state
  useEffect(() => {
    if (!usuario) {
      setVista('login');
      setPremiumVideo(null);
    }
  }, [usuario]);

  return (
    <NavigationContext.Provider value={{
      vista, setVista,
      sidebarAmpliado, setSidebarAmpliado,
      premiumVideo, setPremiumVideo,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}
