import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigation } from './NavigationContext';
import { useSocial } from './SocialContext';
import * as api from '../api';

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }) {
  const { usuario } = useAuth();
  const { setVista, setPremiumVideo } = useNavigation();
  const { setHistorial } = useSocial();

  const [videoSeleccionado, setVideoSeleccionado] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [cursoOrigen, setCursoOrigen] = useState('mis-cursos');
  const [canalSeleccionado, setCanalSeleccionado] = useState(null);
  const [profesorSubVista, setProfesorSubVista] = useState('canal');

  // Reset player state on logout
  useEffect(() => {
    if (!usuario) {
      setVideoSeleccionado(null);
      setCanalSeleccionado(null);
      setCursoSeleccionado(null);
      setCursoActivo(null);
    }
  }, [usuario]);

  const seleccionarYRegistrarVideo = (video) => {
    if (video?.es_premium && !usuario?.premium && usuario?.id !== video?.autor_id) {
      setPremiumVideo(video);
      return;
    }
    setCursoActivo(null);
    setVideoSeleccionado(video);
    setVista('reproductor');
    setHistorial(prev => [video, ...prev.filter(v => v.id !== video.id)]);
    api.videos.view(video.id).catch(() => {});
    api.history.add(video.id).catch(() => {});
  };

  const abrirCurso = (cursoId, origen = 'mis-cursos') => {
    if (!cursoId) return;
    setCursoOrigen(origen);
    setCursoSeleccionado(cursoId);
    setVista('curso');
  };

  const abrirCursoPublico = (curso) => {
    if (curso.es_premium && !usuario?.premium && usuario?.id !== curso.autor?.id) {
      setPremiumVideo(curso);
      return;
    }
    abrirCurso(curso.id, 'catalogo');
  };

  const abrirLeccionDeCurso = (video, cursoId) => {
    if (video?.es_premium && !usuario?.premium && usuario?.id !== video?.autor_id) {
      setPremiumVideo(video);
      return;
    }
    setCursoActivo(cursoId);
    setVideoSeleccionado(video);
    setVista('reproductor');
    setHistorial(prev => [video, ...prev.filter(v => v.id !== video.id)]);
    api.videos.view(video.id).catch(() => {});
    api.history.add(video.id).catch(() => {});
  };

  const abrirCanalProfesor = (autorId) => {
    if (!autorId) return;
    setCanalSeleccionado({ id: autorId });
    setVista('canal');
  };

  const abrirPanelProfesor = (sub = 'canal') => {
    setProfesorSubVista(sub);
    setVista('profesor');
  };

  return (
    <PlayerContext.Provider value={{
      videoSeleccionado, setVideoSeleccionado,
      cursoSeleccionado,
      cursoActivo,
      cursoOrigen,
      canalSeleccionado,
      profesorSubVista, setProfesorSubVista,
      seleccionarYRegistrarVideo,
      abrirCurso,
      abrirCursoPublico,
      abrirLeccionDeCurso,
      abrirCanalProfesor,
      abrirPanelProfesor,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
