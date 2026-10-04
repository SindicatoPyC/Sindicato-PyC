'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- Iconos en línea (opcional, para mejor rendimiento) ---
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
const CurrencyDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const BuildingLibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>;

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

  // Estado del guardián de acceso
  const [accesoBloqueado, setAccesoBloqueado] = useState({ bloqueado: false, motivo: '' });

  const [config, setConfig] = useState({
    tema: { color_primario: '#0f172a', color_secundario: '#3b82f6', estilo_carrusel: 'moderno' },
    hero: { titulo: 'Bienvenido al Futuro.', subtitulo: 'Tu espacio interactivo para una mayor participación.', mostrar_icono: true },
    carrusel_slides: [
      { id: 1, badge: 'NOVEDADES', titulo: 'Conoce Tu Nuevo Portal', texto: 'Navega fácilmente y descubre todas las herramientas disponibles para ti.', icono: '🚀' },
      { id: 2, badge: 'SERVICIOS', titulo: 'Asesoría 24/7', texto: 'Consulta nuestro asistente legal para resolver tus dudas rápidamente.', icono: '🤖' },
      { id: 3, badge: 'BENEFICIOS', titulo: 'Nuevos Convenios', texto: 'Aprovecha los descuentos exclusivos en salud y educación.', icono: '🎁' }
    ],
    modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
  });

  const [indicadores, setIndicadores] = useState<any>({ uf: null, utm: null, dolar: null, cargando: true });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
          
          if (profile?.estado?.toLowerCase() === 'suspendido') {
            setAccesoBloqueado({ bloqueado: true, motivo: 'Cuenta suspendida temporalmente.' });
            setLoading(false);
            return;
          }

          if (profile?.role) setUserRol(profile.role);

          if (profile?.sindicato_id) {
            setSindicatoId(profile.sindicato_id);
            const { data: sindicatoData } = await supabase.from('sindicatos').select('configuracion, nombre, estado').eq('id', profile.sindicato_id).single();
            
            if (sindicatoData?.estado?.toLowerCase() === 'suspendido') {
              setAccesoBloqueado({ bloqueado: true, motivo: 'Organización suspendida.' });
              setLoading(false);
              return;
            }

            if (sindicatoData) {
              setSindicatoNombre(sindicatoData.nombre || '');
              if (sindicatoData.configuracion) {
                setConfig(prev => ({
                  ...prev,
                  ...sindicatoData.configuracion
                }));
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
        console.error("Error fetching data:", err);
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
    if (modoEdicion || config.carrusel_slides.length === 0) return;
    const intervalo = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % config.carrusel_slides.length);
    }, 8000); // Aumentado el tiempo para leer mejor
    return () => clearInterval(intervalo);
  }, [config.carrusel_slides, modoEdicion]);

  const guardarConfiguracionEnVivo = async () => {
    if (!sindicatoId) return;
    setGuardandoCambios(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sindicatos').update({ configuracion: config }).eq('id', sindicatoId);
      if (error) throw error;
      alert('Configuración guardada exitosamente.');
      setModoEdicion(false);
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardandoCambios(false);
    }
  };

  const aplicarPlantillaPreset = (tipo: string) => {
    if (tipo === 'moderno') {
      setConfig({
        tema: { color_primario: '#0f172a', color_secundario: '#3b82f6', estilo_carrusel: 'moderno' },
        hero: { titulo: 'Bienvenido al Futuro.', subtitulo: 'Tu espacio interactivo para una mayor participación.', mostrar_icono: true },
        carrusel_slides: [
           { id: 1, badge: 'NOVEDADES', titulo: 'Conoce Tu Nuevo Portal', texto: 'Navega fácilmente y descubre todas las herramientas disponibles para ti.', icono: '🚀' }
        ],
        modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
      });
    }
    // Añade lógica para otras plantillas si es necesario
  };

  const actualizarSlideActiva = (campo: string, valor: string) => {
    const nuevosSlides = [...config.carrusel_slides];
    nuevosSlides[slideActual] = { ...nuevosSlides[slideActual], [campo]: valor };
    setConfig({ ...config, carrusel_slides: nuevosSlides });
  };

  const agregarNuevoSlide = () => {
    const nuevo = { id: Date.now(), badge: 'NUEVO', titulo: 'Título...', texto: 'Descripción...', icono: '✨' };
    setConfig({ ...config, carrusel_slides: [...config.carrusel_slides, nuevo] });
    setSlideActual(config.carrusel_slides.length);
  };

  const eliminarSlideActual = () => {
    if (config.carrusel_slides.length <= 1) return alert("Debe haber al menos una diapositiva.");
    const nuevosSlides = config.carrusel_slides.filter((_, idx) => idx !== slideActual);
    setConfig({ ...config, carrusel_slides: nuevosSlides });
    setSlideActual(0);
  };

  const handleVotar = async (asambleaId: string, opcion: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('rut').eq('id', user.id).single();
    if (!profile?.rut) return;

    const { error } = await supabase.from('votos_registrados').insert([{ asamblea_id: asambleaId, usuario_rut: profile.rut, opcion_elegida: opcion }]);
    if (error) {
      if (error.code === '23505') alert('Ya has votado en esta asamblea.');
      else alert('Error: ' + error.message);
    } else {
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
        <h1 className="text-3xl font-bold mb-4 text-red-500">Acceso Restringido</h1>
        <p className="text-slate-400 mb-8">{accesoBloqueado.motivo}</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold">Volver al Inicio</button>
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
      return `rgba(59, 130, 246, ${alpha})`;
    }
  };

  const esAdmin = ['superadmin', 'admin', 'administrador', 'directiva'].includes(userRol.toLowerCase());
  const slideActualObj = config.carrusel_slides[slideActual] || config.carrusel_slides[0];

  return (
    <div className="min-h-screen font-sans text-slate-100 pb-28 relative w-full overflow-x-hidden" style={{ backgroundColor: config.tema.color_primario }}>
      
      {/* --- Luces Ambientales (Más sutiles y amplias) --- */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-15 pointer-events-none -translate-y-1/3 translate-x-1/3" style={{ backgroundColor: config.tema.color_secundario }}></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] rounded-full blur-[200px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/4" style={{ backgroundColor: config.tema.color_secundario }}></div>

      {/* --- Menú de Edición Admin --- */}
      {esAdmin && (
        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 text-xs font-semibold">
           <span className="flex items-center gap-2 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Modo Edición
          </span>
          <div className="h-4 w-px bg-white/20"></div>
          <button onClick={() => setModoEdicion(!modoEdicion)} className={`px-4 py-2 rounded-full transition-colors ${modoEdicion ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}>
            {modoEdicion ? 'Cerrar Editor' : 'Editar Diseño'}
          </button>
          {modoEdicion && (
            <button onClick={guardarConfiguracionEnVivo} disabled={guardandoCambios} className="px-5 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-full transition-colors">
              {guardandoCambios ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </motion.div>
      )}

      {/* --- Panel de Edición Desplegable --- */}
      <AnimatePresence>
        {esAdmin && modoEdicion && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="bg-slate-900/95 border-b border-white/10 p-6 sticky top-0 z-40 backdrop-blur-3xl shadow-2xl">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                 <div>
                    <label className="block text-slate-400 mb-2">Tema y Color</label>
                    <div className="flex gap-4">
                       <input type="color" value={config.tema.color_primario} onChange={e => setConfig({...config, tema: {...config.tema, color_primario: e.target.value}})} className="w-8 h-8 rounded cursor-pointer" />
                       <input type="color" value={config.tema.color_secundario} onChange={e => setConfig({...config, tema: {...config.tema, color_secundario: e.target.value}})} className="w-8 h-8 rounded cursor-pointer" />
                    </div>
                 </div>
                 <div className="lg:col-span-3 space-y-4">
                    <label className="block text-slate-400 mb-2">Editor de Carrusel ({config.carrusel_slides.length} slides)</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                       {config.carrusel_slides.map((s, idx) => (
                         <button key={s.id} onClick={() => setSlideActual(idx)} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${slideActual === idx ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                           {s.titulo.substring(0, 12)}...
                         </button>
                       ))}
                       <button onClick={agregarNuevoSlide} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">+</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="text" value={slideActualObj.badge} onChange={e => actualizarSlideActiva('badge', e.target.value)} placeholder="Etiqueta" className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
                        <input type="text" value={slideActualObj.titulo} onChange={e => actualizarSlideActiva('titulo', e.target.value)} placeholder="Título" className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
                        <input type="text" value={slideActualObj.texto} onChange={e => actualizarSlideActiva('texto', e.target.value)} placeholder="Descripción" className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
                        <input type="text" value={slideActualObj.icono} onChange={e => actualizarSlideActiva('icono', e.target.value)} placeholder="Icono" className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-center" />
                    </div>
                    <button onClick={eliminarSlideActual} className="text-red-400 hover:text-red-300 text-xs">Eliminar Slide Actual</button>
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 space-y-16 relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
           <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} className="inline-block">
             <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.1), color: config.tema.color_secundario }}>
               {sindicatoNombre || 'Portal de Socios'}
             </span>
           </motion.div>
           <motion.h1 initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
             {config.hero.titulo}
           </motion.h1>
           <motion.p initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.2}} className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
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
                <div key={i} className="group relative bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 shadow-2xl overflow-hidden flex items-center justify-between">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{ind.title}</p>
                    {indicadores.cargando ? (
                      <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-lg"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-white tracking-tighter">${ind.value?.toLocaleString('es-CL')}</p>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl border border-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.1), color: config.tema.color_secundario }}>
                     {ind.icon}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- COLUMNA IZQUIERDA: CARRUSEL Y PARTICIPACIÓN --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* --- CARRUSEL DESTACADO --- */}
            <motion.section initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.4}} className="relative rounded-[2.5rem] p-10 md:p-14 overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-2xl group min-h-[400px] flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0"></div>
              
              {/* Imagen/Fondo del Carrusel (Simulado con gradiente) */}
              <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out" style={{ background: `radial-gradient(circle at 80% 20%, ${hexToRGB(config.tema.color_secundario, 0.3)}, transparent 60%)`}}></div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={slideActual}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-10"
                >
                   <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/20 backdrop-blur-md bg-black/30 text-white">
                      {slideActualObj.badge}
                   </span>
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="max-w-xl">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">{slideActualObj.titulo}</h2>
                        <p className="text-lg text-slate-300 font-medium">{slideActualObj.texto}</p>
                      </div>
                      <div className="text-7xl drop-shadow-2xl md:ml-auto filter saturate-150 transform transition-transform group-hover:scale-110 duration-700">
                        {slideActualObj.icono}
                      </div>
                   </div>
                </motion.div>
              </AnimatePresence>

              {/* Controles del Carrusel */}
              <div className="relative z-10 mt-10 flex items-center justify-between border-t border-white/10 pt-6">
                <div className="flex gap-2">
                  {config.carrusel_slides.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSlideActual(idx)} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${slideActual === idx ? 'w-10 bg-white' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.section>

            {/* --- MÓDULOS DE PARTICIPACIÓN --- */}
            {config.modulos.participacion_activa && (
               <div className="space-y-6">
                  {/* Asamblea */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shadow-xl relative overflow-hidden group">
                     <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                           <div className="flex items-center gap-2 mb-3">
                              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">En Vivo</span>
                           </div>
                           <h3 className="text-2xl font-bold text-white mb-2">Sala de Asamblea Oficial</h3>
                           <p className="text-slate-400 text-sm max-w-md">Participa en la toma de decisiones. Tu micrófono estará silenciado al ingresar.</p>
                        </div>
                        <Link href="/asamblea" className="shrink-0 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                           Entrar a la Sala →
                        </Link>
                     </div>
                  </div>

                  {/* Votaciones */}
                  {asambleas.length > 0 && (
                     <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">🗳️</div>
                           <h3 className="text-xl font-bold text-white">Votaciones Activas</h3>
                        </div>
                        <div className="space-y-6">
                           {asambleas.map((asamblea) => (
                              <div key={asamblea.id} className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl">
                                 <h4 className="text-lg font-bold text-white mb-2">{asamblea.titulo}</h4>
                                 <p className="text-sm text-slate-400 mb-6">Elige una opción. Tu voto es secreto y definitivo.</p>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button onClick={() => handleVotar(asamblea.id, 'A favor')} className="py-3 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 border border-white/5 rounded-xl font-semibold transition-all">👍 A Favor</button>
                                    <button onClick={() => handleVotar(asamblea.id, 'En contra')} className="py-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-white/5 rounded-xl font-semibold transition-all">👎 En Contra</button>
                                    <button onClick={() => handleVotar(asamblea.id, 'Abstención')} className="py-3 bg-white/5 hover:bg-slate-700/50 border border-white/5 rounded-xl font-semibold transition-all">✋ Abstenerse</button>
                                 </div>
                                 {votoEstado && (
                                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg text-center">
                                       Voto registrado: {votoEstado}
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

          {/* --- COLUMNA DERECHA: ACTUALIDAD --- */}
          {config.modulos.actualidad && (
            <div className="lg:col-span-4">
              <motion.section initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.5}} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl overflow-hidden sticky top-8">
                 <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                       <span className="text-2xl" style={{color: config.tema.color_secundario}}>📰</span> 
                       Muro de Noticias
                    </h3>
                 </div>
                 <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {comunicados.length === 0 ? (
                       <p className="text-slate-500 text-center py-10 font-medium">No hay noticias recientes.</p>
                    ) : (
                       comunicados.map((noticia) => (
                          <article key={noticia.id} className="p-5 bg-black/20 hover:bg-black/40 border border-white/5 rounded-2xl transition-colors group cursor-pointer">
                             <span className="text-[10px] font-bold text-slate-400 mb-2 block">{new Date(noticia.fecha_creacion).toLocaleDateString('es-CL')}</span>
                             <h4 className="text-base font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{noticia.titulo}</h4>
                             <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{noticia.contenido}</p>
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