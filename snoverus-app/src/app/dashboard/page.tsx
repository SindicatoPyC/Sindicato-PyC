'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
const CurrencyDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const BuildingLibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>;

// Configuración por defecto ultra robusta (Fallback seguro para JSONB vacío)
const DEFAULT_CONFIG = {
  tema: { color_primario: '#090d16', color_secundario: '#2563eb', estilo_carrusel: 'moderno' },
  hero: { titulo: 'Tu Portal Sindical al Futuro.', subtitulo: 'Espacio interactivo para potenciar la participación y gestión gremial.', mostrar_icono: true },
  carrusel_slides: [
    { id: 1, badge: 'OFICIAL', titulo: 'Negociación Colectiva', texto: 'Revisa los avances del petitorio y las mesas de diálogo vigentes.', icono: '🤝' },
    { id: 2, badge: 'BENEFICIOS', titulo: 'Red de Convenios 2026', texto: 'Descubre descuentos exclusivos en salud, educación y comercio.', icono: '🎁' },
    { id: 3, badge: 'TRANSPARENCIA', titulo: 'Libro de Actas y Acuerdos', texto: 'Accede a los acuerdos firmados por el directorio en tiempo real.', icono: '📁' }
  ],
  modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
};

export default function Dashboard() {
  const router = useRouter();
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [asambleas, setAsambleas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votoEstado, setVotoEstado] = useState<string>('');
  
  const [userRol, setUserRol] = useState<string>('socio');
  const [sindicatoId, setSindicatoId] = useState<number | null>(null);
  const [sindicatoNombre, setSindicatoNombre] = useState<string>('');

  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const [slideActual, setSlideActual] = useState(0);

  const [accesoBloqueado, setAccesoBloqueado] = useState({ bloqueado: false, motivo: '' });

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const [indicadores, setIndicadores] = useState<any>({ uf: null, utm: null, dolar: null, cargando: true });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const user = session.user;
          const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
          
          if (profile?.estado?.toLowerCase() === 'suspendido') {
            setAccesoBloqueado({ bloqueado: true, motivo: 'Tu cuenta se encuentra suspendida temporalmente.' });
            setLoading(false);
            return;
          }

          if (profile?.role) setUserRol(profile.role);

          if (profile?.sindicato_id) {
            setSindicatoId(profile.sindicato_id);
            const { data: sindicatoData } = await supabase.from('sindicatos').select('configuracion, nombre, estado').eq('id', profile.sindicato_id).single();
            
            if (sindicatoData?.estado?.toLowerCase() === 'suspendido') {
              setAccesoBloqueado({ bloqueado: true, motivo: 'El acceso de tu organización ha sido suspendido.' });
              setLoading(false);
              return;
            }

            if (sindicatoData) {
              setSindicatoNombre(sindicatoData.nombre || '');
              
              // Deep merge seguro para inyectar JSONB sobre valores por defecto
              if (sindicatoData.configuracion) {
                const dbConfig = sindicatoData.configuracion;
                setConfig({
                  tema: { ...DEFAULT_CONFIG.tema, ...(dbConfig.tema || {}) },
                  hero: { ...DEFAULT_CONFIG.hero, ...(dbConfig.hero || {}) },
                  carrusel_slides: dbConfig.carrusel_slides && dbConfig.carrusel_slides.length > 0 ? dbConfig.carrusel_slides : DEFAULT_CONFIG.carrusel_slides,
                  modulos: { ...DEFAULT_CONFIG.modulos, ...(dbConfig.modulos || {}) }
                });
              }
            }

            const [comData, asamData] = await Promise.all([
              supabase.from('comunicados').select('*').eq('sindicato_id', profile.sindicato_id).order('fecha_creacion', { ascending: false }).limit(5),
              supabase.from('asambleas_votaciones').select('*').eq('sindicato_id', profile.sindicato_id).eq('estado', 'Abierta')
            ]);
            
            if (comData.data) setComunicados(comData.data);
            if (asamData.data) setAsambleas(asamData.data);
          }
        } else {
           router.push('/');
           return;
        }
      } catch (err) {
        console.error("Error al sincronizar sesión:", err);
      } finally {
        setLoading(false);
      }

      try {
        const res = await fetch('https://mindicador.cl/api');
        const data = await res.json();
        setIndicadores({ uf: data.uf?.valor || 37900, utm: data.utm?.valor || 66000, dolar: data.dolar?.valor || 950, cargando: false });
      } catch (error) {
        setIndicadores({ uf: 37900, utm: 66000, dolar: 950, cargando: false });
      }
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    if (modoEdicion || config.carrusel_slides.length <= 1) return;
    const intervalo = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % config.carrusel_slides.length);
    }, 7000);
    return () => clearInterval(intervalo);
  }, [config.carrusel_slides, modoEdicion]);

  const guardarConfiguracionEnVivo = async () => {
    if (!sindicatoId) return;
    setGuardandoCambios(true);
    try {
      const supabase = createClient();
      // Guardado directo de la estructura JSONB completa sin alterar otras columnas
      const { error } = await supabase.from('sindicatos').update({ configuracion: config }).eq('id', sindicatoId);
      if (error) throw error;
      alert('✨ ¡Diseño estructural actualizado con éxito en los servidores!');
      setModoEdicion(false);
    } catch (err: any) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setGuardandoCambios(false);
    }
  };

  const aplicarPlantillaPreset = (tipo: string) => {
    if (tipo === 'corporativo') {
      setConfig({
        ...config,
        tema: { color_primario: '#0b0f19', color_secundario: '#0ea5e9', estilo_carrusel: 'corporativo' },
        hero: { titulo: 'Excelencia y Solidez Institucional.', subtitulo: 'Comprometidos con el desarrollo y estabilidad de nuestros socios.', mostrar_icono: true }
      });
    } else if (tipo === 'solidario') {
      setConfig({
        ...config,
        tema: { color_primario: '#120c14', color_secundario: '#f43f5e', estilo_carrusel: 'solidario' },
        hero: { titulo: 'Unidos Somos Más Fuertes.', subtitulo: 'Fondo solidario, contención y apoyo mutuo ante cualquier emergencia.', mostrar_icono: true }
      });
    } else {
      setConfig({
        ...config,
        tema: { color_primario: '#090d16', color_secundario: '#2563eb', estilo_carrusel: 'moderno' },
        hero: { titulo: 'Tu Portal Sindical al Futuro.', subtitulo: 'Espacio interactivo para potenciar la participación y gestión gremial.', mostrar_icono: true }
      });
    }
  };

  const actualizarSlideActiva = (campo: string, valor: string) => {
    const nuevosSlides = [...config.carrusel_slides];
    nuevosSlides[slideActual] = { ...nuevosSlides[slideActual], [campo]: valor };
    setConfig({ ...config, carrusel_slides: nuevosSlides });
  };

  const agregarNuevoSlide = () => {
    const nuevo = { id: Date.now(), badge: 'NUEVO', titulo: 'Nueva Diapositiva', texto: 'Describe aquí el contenido importante.', icono: '⭐' };
    setConfig({ ...config, carrusel_slides: [...config.carrusel_slides, nuevo] });
    setSlideActual(config.carrusel_slides.length);
  };

  const eliminarSlideActual = () => {
    if (config.carrusel_slides.length <= 1) return alert("El portal requiere al menos una diapositiva.");
    const nuevosSlides = config.carrusel_slides.filter((_, idx) => idx !== slideActual);
    setConfig({ ...config, carrusel_slides: nuevosSlides });
    setSlideActual(Math.max(0, slideActual - 1));
  };

  const actualizarHero = (campo: string, valor: string | boolean) => {
    setConfig({ ...config, hero: { ...config.hero, [campo]: valor } });
  };

  const toggleModulo = (modulo: keyof typeof config.modulos) => {
    setConfig({ ...config, modulos: { ...config.modulos, [modulo]: !config.modulos[modulo] } });
  };

  const handleVotar = async (asambleaId: string, opcion: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('rut').eq('id', user.id).single();
    if (!profile?.rut) return;

    const { error } = await supabase.from('votos_registrados').insert([{ asamblea_id: asambleaId, usuario_rut: profile.rut, opcion_elegida: opcion }]);
    if (error) {
      if (error.code === '23505') alert('⚠️ Ya has emitido tu voto en esta asamblea.');
      else alert('Error: ' + error.message);
    } else {
      alert(`✅ ¡Voto registrado con éxito: "${opcion}"!`);
      setVotoEstado(opcion);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "sb-sindicato-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accesoBloqueado.bloqueado) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center text-4xl mb-6 border border-rose-500/20">⛔</div>
        <h1 className="text-3xl font-black mb-3">Acceso Restringido</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">{accesoBloqueado.motivo}</p>
        <button onClick={handleLogout} className="px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Volver al Inicio</button>
      </div>
    );
  }

  const hexToRGB = (hex: string, alpha: number) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
      return `rgba(37, 99, 235, ${alpha})`;
    }
  };

  const esAdmin = ['superadmin', 'admin', 'administrador', 'directiva'].includes(userRol.toLowerCase());
  
  // Seguridad de renderizado para evitar crashes si el JSON fue corrompido externamente
  const slideActualObj = config.carrusel_slides[slideActual] || { badge: 'ERROR', titulo: 'Slide Invalida', texto: 'Por favor, añade un nuevo slide.', icono: '⚠️️' };

  return (
    <div className="min-h-screen font-sans text-slate-100 pb-32 relative w-full overflow-x-hidden selection:bg-blue-600 selection:text-white transition-colors duration-700" style={{ backgroundColor: config.tema.color_primario }}>
      
      {/* Luces Ambientales Dinámicas */}
      <div className="absolute top-0 right-0 w-[900px] h-[900px] rounded-full blur-[180px] opacity-15 pointer-events-none -translate-y-1/3 translate-x-1/3 transition-colors duration-1000" style={{ backgroundColor: config.tema.color_secundario }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full blur-[180px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/4 transition-colors duration-1000" style={{ backgroundColor: config.tema.color_secundario }}></div>

      {/* --- BARRA FLOTANTE DE EDICIÓN (ADMIN / DIRECTIVA) --- */}
      {esAdmin && (
        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 text-xs font-black tracking-wider uppercase">
           <span className="flex items-center gap-2 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
            Modo Directiva Activo
          </span>
          <div className="h-4 w-px bg-white/20"></div>
          <button onClick={() => setModoEdicion(!modoEdicion)} className={`px-5 py-2 rounded-full transition-all shadow-md ${modoEdicion ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
            {modoEdicion ? '✕ Cerrar Editor' : '✏️ Personalizar Portal'}
          </button>
          {modoEdicion && (
            <button onClick={guardarConfiguracionEnVivo} disabled={guardandoCambios} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-md flex items-center gap-2">
              {guardandoCambios ? 'Guardando...' : '💾 Confirmar Cambios DB'}
            </button>
          )}
        </motion.div>
      )}

      {/* --- PANEL DESPLEGABLE DE PERSONALIZACIÓN UI/UX AVANZADO --- */}
      <AnimatePresence>
        {esAdmin && modoEdicion && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="bg-slate-900/95 border-b border-white/10 p-6 sm:p-8 sticky top-0 z-40 backdrop-blur-3xl shadow-2xl">
              <div className="max-w-7xl mx-auto space-y-6">
                 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Estudio de Diseño UI/UX Institucional</h3>
                      <p className="text-slate-400 text-xs font-medium">Modifica colores, hero, estructura del carrusel y módulos en tiempo real.</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => aplicarPlantillaPreset('moderno')} className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-600/50 transition-colors">Tema Moderno</button>
                       <button onClick={() => aplicarPlantillaPreset('corporativo')} className="px-3 py-1.5 bg-sky-600/30 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold hover:bg-sky-600/50 transition-colors">Tema Corporativo</button>
                       <button onClick={() => aplicarPlantillaPreset('solidario')} className="px-3 py-1.5 bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-600/50 transition-colors">Tema Solidario</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs items-stretch">
                    
                    {/* Panel de Colores y Módulos */}
                    <div className="lg:col-span-3 space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                       <div>
                         <label className="block font-black text-slate-400 uppercase tracking-widest mb-3">Estética & Módulos</label>
                         <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                              <span className="block text-[10px] text-slate-400 mb-1">Fondo App</span>
                              <div className="flex items-center gap-2">
                                <input title="Fondo Principal" type="color" value={config.tema.color_primario} onChange={e => setConfig({...config, tema: {...config.tema, color_primario: e.target.value}})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20" />
                                <span className="text-[10px] text-slate-500 font-mono uppercase">{config.tema.color_primario}</span>
                              </div>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400 mb-1">Color Acento</span>
                              <div className="flex items-center gap-2">
                                <input title="Acento" type="color" value={config.tema.color_secundario} onChange={e => setConfig({...config, tema: {...config.tema, color_secundario: e.target.value}})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20" />
                                <span className="text-[10px] text-slate-500 font-mono uppercase">{config.tema.color_secundario}</span>
                              </div>
                            </div>
                         </div>
                       </div>
                       
                       <div className="space-y-2 border-t border-white/10 pt-4">
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                            <input type="checkbox" checked={config.modulos.pulso_economico} onChange={() => toggleModulo('pulso_economico')} className="accent-blue-500 rounded h-3.5 w-3.5" />
                            Mostrar Pulso Económico
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                            <input type="checkbox" checked={config.modulos.actualidad} onChange={() => toggleModulo('actualidad')} className="accent-blue-500 rounded h-3.5 w-3.5" />
                            Mostrar Muro de Noticias
                          </label>
                       </div>
                    </div>

                    {/* Editor de Textos Hero y Carrusel */}
                    <div className="lg:col-span-9 space-y-5 bg-white/5 p-5 rounded-2xl border border-white/5">
                       
                       {/* Editor Hero */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-5 border-b border-white/10">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Título de Bienvenida (Hero)</label>
                            <input type="text" value={config.hero.titulo} onChange={e => actualizarHero('titulo', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtítulo Institucional</label>
                            <input type="text" value={config.hero.subtitulo} onChange={e => actualizarHero('subtitulo', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-300 font-medium outline-none focus:border-blue-500" />
                          </div>
                       </div>

                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Gestor de Diapositivas Carrusel ({config.carrusel_slides.length})</span>
                          <div className="flex gap-2">
                             <button onClick={agregarNuevoSlide} className="px-3 py-1.5 bg-blue-600/80 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">+ Añadir Slide</button>
                             <button onClick={eliminarSlideActual} className="px-3 py-1.5 bg-rose-600/50 text-rose-100 font-bold rounded-xl hover:bg-rose-600 transition-colors border border-rose-500/30">Borrar Actual</button>
                          </div>
                       </div>
                       
                       <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                          {config.carrusel_slides.map((s, idx) => (
                            <button key={s.id} onClick={() => setSlideActual(idx)} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${slideActual === idx ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 border border-white/5 text-slate-400 hover:bg-slate-700'}`}>
                              Slide {idx + 1}: {s.titulo.substring(0, 15) || 'Sin Título'}...
                            </button>
                          ))}
                       </div>

                       {config.carrusel_slides.length > 0 && (
                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Etiqueta (Badge)</label>
                                <input type="text" value={slideActualObj.badge} onChange={e => actualizarSlideActiva('badge', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500" placeholder="Ej: OFICIAL" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Título Diapositiva</label>
                                <input type="text" value={slideActualObj.titulo} onChange={e => actualizarSlideActiva('titulo', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Texto Descriptivo</label>
                                <input type="text" value={slideActualObj.texto} onChange={e => actualizarSlideActiva('texto', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-blue-500" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">Emoji / Icono</label>
                                <input type="text" value={slideActualObj.icono} onChange={e => actualizarSlideActiva('icono', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center text-lg outline-none focus:border-blue-500" />
                             </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 space-y-12 relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-4">
           <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} className="inline-block">
             <span className="px-5 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase border border-white/15 shadow-sm" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.15), color: config.tema.color_secundario }}>
               {sindicatoNombre || 'Portal Oficial de Socios'}
             </span>
           </motion.div>
           <motion.h1 initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-2xl leading-tight">
             {config.hero.titulo}
           </motion.h1>
           <motion.p initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.2}} className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
             {config.hero.subtitulo}
           </motion.p>
        </section>

        {/* --- INDICADORES ECONÓMICOS --- */}
        {config.modulos.pulso_economico && (
          <motion.section initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Valor UF Hoy', value: indicadores.uf, icon: <BuildingLibraryIcon /> },
                { title: 'Valor UTM', value: indicadores.utm, icon: <ChartBarIcon /> },
                { title: 'Dólar Observado', value: indicadores.dolar, icon: <CurrencyDollarIcon /> }
              ].map((ind, i) => (
                <div key={i} className="group relative bg-white/[0.03] backdrop-blur-2xl p-7 rounded-[2.5rem] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 shadow-2xl overflow-hidden flex items-center justify-between">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/15 transition-colors"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{ind.title}</p>
                    {indicadores.cargando ? (
                      <div className="h-8 w-28 bg-white/10 animate-pulse rounded-xl mt-1"></div>
                    ) : (
                      <p className="text-3xl font-black text-white tracking-tight">${ind.value?.toLocaleString('es-CL')}</p>
                    )}
                  </div>
                  <div className="relative z-10 p-4 rounded-2xl border border-white/10 shadow-inner transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.15), color: config.tema.color_secundario }}>
                     {ind.icon}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- COLUMNA IZQUIERDA: CARRUSEL Y PARTICIPACIÓN --- */}
          <div className={`${config.modulos.actualidad ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
            
            {/* --- CARRUSEL DINÁMICO UI/UX PREMIUM --- */}
            {config.carrusel_slides.length > 0 && (
              <motion.section initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.4}} className="relative rounded-[2.5rem] p-8 sm:p-12 overflow-hidden border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] bg-white/[0.03] backdrop-blur-2xl group min-h-[380px] flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0"></div>
                <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out" style={{ background: `radial-gradient(circle at 85% 15%, ${hexToRGB(config.tema.color_secundario, 0.35)}, transparent 65%)`}}></div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={slideActual}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative z-10 my-auto"
                  >
                     <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/20 backdrop-blur-md bg-black/40 text-white shadow-sm">
                        {slideActualObj.badge}
                     </span>
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl space-y-3">
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">{slideActualObj.titulo}</h2>
                          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">{slideActualObj.texto}</p>
                        </div>
                        <div className="text-6xl sm:text-7xl drop-shadow-2xl md:ml-auto filter saturate-150 transform transition-transform group-hover:scale-110 duration-700 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl flex items-center justify-center">
                          {slideActualObj.icono}
                        </div>
                     </div>
                  </motion.div>
                </AnimatePresence>

                {config.carrusel_slides.length > 1 && (
                  <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-2">
                      {config.carrusel_slides.map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setSlideActual(idx)} 
                          className={`h-2 rounded-full transition-all duration-500 ${slideActual === idx ? 'w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'w-2.5 bg-white/20 hover:bg-white/50'}`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* --- MÓDULOS DE PARTICIPACIÓN --- */}
            {config.modulos.participacion_activa && (
               <div className="space-y-6">
                  {/* Sala de Asamblea Jitsi */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                     <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2.5">
                              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>
                              <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">Transmisión Cifrada</span>
                           </div>
                           <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sala de Asamblea Virtual</h3>
                           <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">Conéctate en tiempo real desde cualquier dispositivo móvil o computador con cifrado de extremo a extremo.</p>
                        </div>
                        <a 
                          href="https://meet.jit.si/SindicatoPYC-AsambleaOficial" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="shrink-0 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 text-center flex items-center gap-3"
                        >
                           <span>Entrar a la Sala</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                     </div>
                  </div>

                  {/* Votaciones Activas */}
                  {asambleas.length > 0 && (
                     <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
                        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                           <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 text-xl">🗳️</div>
                           <div>
                              <h3 className="text-xl font-black text-white tracking-tight">Sistema de Votación Global</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Blockchain interna protegida</p>
                           </div>
                        </div>
                        <div className="space-y-6">
                           {asambleas.map((asamblea) => (
                              <div key={asamblea.id} className="p-8 bg-black/30 border border-white/5 rounded-3xl relative overflow-hidden">
                                 <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-xl mb-4 inline-block tracking-widest border border-emerald-500/20">Votación Abierta</span>
                                 <h4 className="text-xl font-black text-white mb-2 leading-tight">{asamblea.titulo}</h4>
                                 <p className="text-xs text-slate-400 font-medium mb-6">Tu voto es anónimo, único y auditado por el sistema gremial.</p>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button onClick={() => handleVotar(asamblea.id, 'A favor')} className="py-4 px-4 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">👍 A Favor</button>
                                    <button onClick={() => handleVotar(asamblea.id, 'En contra')} className="py-4 px-4 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">👎 En Contra</button>
                                    <button onClick={() => handleVotar(asamblea.id, 'Abstención')} className="py-4 px-4 bg-white/5 hover:bg-slate-700/50 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">✋ Abstenerse</button>
                                 </div>
                                 {votoEstado && (
                                    <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-2xl text-center flex items-center justify-center gap-2">
                                       <span>✅</span> Voto registrado correctamente: <span className="uppercase text-white underline">{votoEstado}</span>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            )}
          </div>

          {/* --- COLUMNA DERECHA: ACTUALIDAD / MURO DE NOTICIAS --- */}
          {config.modulos.actualidad && (
            <div className="lg:col-span-4">
              <motion.section initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.5}} className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl overflow-hidden sticky top-8">
                 <div className="p-8 border-b border-white/10 bg-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/10" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>📰</div>
                    <div>
                       <h3 className="text-lg font-black text-white tracking-tight">Muro de Noticias</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Comunicados oficiales</p>
                    </div>
                 </div>
                 <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {comunicados.length === 0 ? (
                       <div className="text-center py-16">
                          <span className="text-4xl opacity-30 block mb-3">📭</span>
                          <p className="text-slate-400 font-bold text-sm">Sin comunicados recientes.</p>
                       </div>
                    ) : (
                       comunicados.map((noticia) => (
                          <article key={noticia.id} className="p-6 bg-black/30 hover:bg-black/50 border border-white/5 rounded-3xl transition-all duration-300 group cursor-pointer shadow-md">
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 inline-block px-2.5 py-1 rounded-lg bg-white/5 text-blue-400 border border-white/5">
                                {new Date(noticia.fecha_creacion).toLocaleDateString('es-CL')}
                             </span>
                             <h4 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">{noticia.titulo}</h4>
                             <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-4">{noticia.contenido}</p>
                          </article>
                       ))
                    )}
                 </div>
              </motion.section>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}