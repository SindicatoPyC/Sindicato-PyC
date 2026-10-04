'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [asambleas, setAsambleas] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
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
    tema: { color_primario: '#020617', color_secundario: '#3b82f6', estilo_carrusel: 'moderno' },
    hero: { titulo: 'Tu Portal al Futuro.', subtitulo: 'Un espacio interactivo diseñado para potenciar tu participación.', mostrar_icono: true },
    carrusel_slides: [
      { id: 1, badge: 'BIENVENIDO', titulo: 'Tu Portal al Futuro.', texto: 'Un espacio interactivo diseñado para potenciar tu participación y gestión sindical.', icono: '🚀' },
      { id: 2, badge: 'INTELIGENCIA ARTIFICIAL', titulo: 'Asistencia Legal 24/7.', texto: 'Nuestra nueva IA resuelve tus dudas laborales al instante basadas en normativas.', icono: '🤖' },
      { id: 3, badge: 'BENEFICIOS', titulo: 'Red de Convenios.', texto: 'Descubre descuentos exclusivos en salud, educación y comercio para socios.', icono: '🎁' }
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
          // 1. Validar estado individual del Usuario
          const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
          
          if (profile?.estado?.toLowerCase() === 'suspendido') {
            setAccesoBloqueado({ bloqueado: true, motivo: 'Tu cuenta ha sido suspendida individualmente. Contacta a tu directiva.' });
            setLoading(false);
            return;
          }

          if (profile?.role) setUserRol(profile.role);

          if (profile?.sindicato_id) {
            setSindicatoId(profile.sindicato_id);
            // 2. Validar estado global del Sindicato
            const { data: sindicatoData } = await supabase.from('sindicatos').select('configuracion, nombre, estado').eq('id', profile.sindicato_id).single();
            
            if (sindicatoData?.estado?.toLowerCase() === 'suspendido') {
              setAccesoBloqueado({ bloqueado: true, motivo: 'El acceso de tu organización ha sido suspendido por la administración global.' });
              setLoading(false);
              return;
            }

            if (sindicatoData) {
              setSindicatoNombre(sindicatoData.nombre || '');
              if (sindicatoData.configuracion) {
                setConfig(prev => ({
                  tema: { ...prev.tema, ...sindicatoData.configuracion.tema },
                  hero: { ...prev.hero, ...sindicatoData.configuracion.hero },
                  carrusel_slides: sindicatoData.configuracion.carrusel_slides || prev.carrusel_slides,
                  modulos: { ...prev.modulos, ...sindicatoData.configuracion.modulos }
                }));
              }
            }

            const { data: comData } = await supabase.from('comunicados').select('*').eq('sindicato_id', profile.sindicato_id).order('fecha_creacion', { ascending: false }).limit(5);
            if (comData) setComunicados(comData);

            const { data: asamData } = await supabase.from('asambleas_votaciones').select('*').eq('sindicato_id', profile.sindicato_id).eq('estado', 'Abierta');
            if (asamData) setAsambleas(asamData);

            const { data: docData } = await supabase.from('libro_actas').select('*').eq('sindicato_id', profile.sindicato_id).order('id', { ascending: false }).limit(4);
            if (docData) setDocumentos(docData);
          }
        } else {
           // Si no hay usuario y trataron de llegar aquí saltando el login
           router.push('/');
           return;
        }
      } catch (err) {
        console.error("Error al conectar con Supabase:", err);
      } finally {
        setLoading(false);
      }

      try {
        const res = await fetch('https://mindicador.cl/api');
        const data = await res.json();
        setIndicadores({ uf: data.uf?.valor || 38000, utm: data.utm?.valor || 66000, dolar: data.dolar?.valor || 950, cargando: false });
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
    }, 6000);
    return () => clearInterval(intervalo);
  }, [config.carrusel_slides, modoEdicion]);

  const guardarConfiguracionEnVivo = async () => {
    if (!sindicatoId) return;
    setGuardandoCambios(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sindicatos').update({ configuracion: config }).eq('id', sindicatoId);
      if (error) throw error;
      alert('✅ ¡Carrusel y diseño actualizados con éxito en el servidor!');
      setModoEdicion(false);
    } catch (err: any) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setGuardandoCambios(false);
    }
  };

  const restaurarPredeterminados = () => {
    if (!window.confirm("⚠️ ¿Restablecer diseño y carrusel original de fábrica?")) return;
    setConfig({
      tema: { color_primario: '#020617', color_secundario: '#3b82f6', estilo_carrusel: 'moderno' },
      hero: { titulo: 'Tu Portal al Futuro.', subtitulo: 'Un espacio interactivo diseñado para potenciar tu participación.', mostrar_icono: true },
      carrusel_slides: [
        { id: 1, badge: 'BIENVENIDO', titulo: 'Tu Portal al Futuro.', texto: 'Un espacio interactivo diseñado para potenciar tu participación y gestión sindical.', icono: '🚀' },
        { id: 2, badge: 'INTELIGENCIA ARTIFICIAL', titulo: 'Asistencia Legal 24/7.', texto: 'Nuestra nueva IA resuelve tus dudas laborales al instante basadas en normativas.', icono: '🤖' },
        { id: 3, badge: 'BENEFICIOS', titulo: 'Red de Convenios.', texto: 'Descubre descuentos exclusivos en salud, educación y comercio para socios.', icono: '🎁' }
      ],
      modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
    });
  };

  const aplicarPlantillaPreset = (tipo: string) => {
    if (tipo === 'corporativo') {
      setConfig({
        tema: { color_primario: '#0f172a', color_secundario: '#0ea5e9', estilo_carrusel: 'corporativo' },
        hero: { titulo: 'Excelencia Sindical.', subtitulo: 'Comprometidos con el desarrollo y la estabilidad de nuestros trabajadores.', mostrar_icono: true },
        carrusel_slides: [
          { id: 1, badge: 'OFICIAL', titulo: 'Negociación Colectiva 2026', texto: 'Revisa los avances del petitorio y las mesas de diálogo activas.', icono: '📋' },
          { id: 2, badge: 'TRANSPARENCIA', titulo: 'Libro de Actas al Día', texto: 'Accede a los acuerdos firmados por el directorio en tiempo real.', icono: '📁' }
        ],
        modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
      });
    } else if (tipo === 'solidario') {
      setConfig({
        tema: { color_primario: '#18181b', color_secundario: '#f43f5e', estilo_carrusel: 'solidario' },
        hero: { titulo: 'Unidos Somos Más.', subtitulo: 'Fondo solidario y apoyo mutuo ante cualquier emergencia familiar o médica.', mostrar_icono: true },
        carrusel_slides: [
          { id: 1, badge: 'APOYO MUTUO', titulo: 'Fondo Solidario Activo', texto: 'Conoce las metas de recaudación y solicita auxilio en caso de siniestros.', icono: '❤️' },
          { id: 2, badge: 'BENEFIS', titulo: 'Bonos y Ayuda Social', texto: 'Infórmate sobre los requisitos para los bonos de escolaridad y nacimiento.', icono: '🤝' }
        ],
        modulos: { pulso_economico: true, asistente_legal: true, participacion_activa: true, actualidad: true }
      });
    } else {
      restaurarPredeterminados();
    }
  };

  const actualizarSlideActiva = (campo: string, valor: string) => {
    const nuevosSlides = [...config.carrusel_slides];
    nuevosSlides[slideActual] = { ...nuevosSlides[slideActual], [campo]: valor };
    setConfig({ ...config, carrusel_slides: nuevosSlides });
  };

  const agregarNuevoSlide = () => {
    const nuevo = { id: Date.now(), badge: 'NUEVO', titulo: 'Título de la Diapositiva', texto: 'Descripción detallada del contenido institucional.', icono: '⭐' };
    setConfig({ ...config, carrusel_slides: [...config.carrusel_slides, nuevo] });
    setSlideActual(config.carrusel_slides.length);
  };

  const eliminarSlideActual = () => {
    if (config.carrusel_slides.length <= 1) return alert("Debe haber al menos una diapositiva en el carrusel.");
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
      if (error.code === '23505') alert('⚠️ Ya has emitido tu voto en esta asamblea.');
      else alert('Error: ' + error.message);
    } else {
      alert(`✅ ¡Voto registrado: "${opcion}"!`);
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

  // PANTALLA DE BLOQUEO
  if (accesoBloqueado.bloqueado) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 w-full h-2 bg-rose-600"></div>
        <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-5xl mb-6 border border-rose-500/20">⛔</div>
        <h1 className="text-3xl font-black mb-3 tracking-tight">Acceso Restringido</h1>
        <p className="text-slate-400 mb-10 text-center max-w-md font-medium leading-relaxed">{accesoBloqueado.motivo}</p>
        <button onClick={handleLogout} className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-black transition-colors uppercase tracking-widest text-xs">
          Volver al Inicio
        </button>
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
    <div className="min-h-screen font-sans text-slate-100 pb-28 relative w-full transition-colors duration-700 overflow-hidden" style={{ backgroundColor: config.tema.color_primario }}>
      
      {esAdmin && (
        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/20 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 text-xs font-bold">
          <span className="hidden sm:flex items-center gap-2 text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
            Modo Directiva (Editor Carrusel 3.0)
          </span>
          <div className="hidden sm:block h-4 w-px bg-white/20"></div>
          <button 
            onClick={() => setModoEdicion(!modoEdicion)} 
            className={`px-4 py-2 rounded-full transition-all shadow-md ${modoEdicion ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
          >
            {modoEdicion ? '✕ Cerrar Editor' : '✏️️ Editar Home'}
          </button>
          {modoEdicion && (
            <>
              <button onClick={restaurarPredeterminados} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors hidden md:block">
                🔄 Fábrica
              </button>
              <button onClick={guardarConfiguracionEnVivo} disabled={guardandoCambios} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all">
                {guardandoCambios ? 'Guardando...' : '💾 Guardar'}
              </button>
            </>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {esAdmin && modoEdicion && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="bg-slate-900/95 border-b border-white/10 p-6 sticky top-0 z-40 backdrop-blur-2xl shadow-2xl">
            <div className="max-w-7xl mx-auto space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-white/10 pb-4">
                <div>
                  <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Plantillas Rápidas</label>
                  <div className="flex gap-2">
                    <button onClick={() => aplicarPlantillaPreset('moderno')} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">Moderno</button>
                    <button onClick={() => aplicarPlantillaPreset('corporativo')} className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all">Corporativo</button>
                    <button onClick={() => aplicarPlantillaPreset('solidario')} className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all">Solidario</button>
                  </div>
                </div>
                <div>
                  <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Colores del Portal</label>
                  <div className="flex items-center gap-3">
                    <input title="Color de Fondo Principal" type="color" value={config.tema.color_primario} onChange={e => setConfig({...config, tema: {...config.tema, color_primario: e.target.value}})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                    <input title="Color Secundario (Botones y Detalles)" type="color" value={config.tema.color_secundario} onChange={e => setConfig({...config, tema: {...config.tema, color_secundario: e.target.value}})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                    <span className="text-slate-400 font-mono">Fondo y Acentos</span>
                  </div>
                </div>
                <div>
                  <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Título de Bienvenida</label>
                  <input type="text" value={config.hero.titulo} onChange={e => setConfig({...config, hero: {...config.hero, titulo: e.target.value}})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-indigo-400 uppercase tracking-widest text-[11px]">Gestor de Diapositivas ({config.carrusel_slides.length})</span>
                  <div className="flex gap-2">
                    <button onClick={agregarNuevoSlide} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors">+ Añadir Slide</button>
                    <button onClick={eliminarSlideActual} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors">Borrar Actual</button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {config.carrusel_slides.map((s, idx) => (
                    <button key={s.id} onClick={() => setSlideActual(idx)} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${slideActual === idx ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      Slide {idx + 1}: {s.titulo.substring(0, 15)}...
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-5 rounded-2xl border border-white/5">
                  <div>
                    <label className="block font-black text-slate-400 uppercase mb-1.5">Etiqueta Superior</label>
                    <input type="text" value={slideActualObj.badge} onChange={e => actualizarSlideActiva('badge', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-black text-slate-400 uppercase mb-1.5">Título Principal</label>
                    <input type="text" value={slideActualObj.titulo} onChange={e => actualizarSlideActiva('titulo', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-black text-slate-400 uppercase mb-1.5">Descripción</label>
                    <input type="text" value={slideActualObj.texto} onChange={e => actualizarSlideActiva('texto', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-black text-slate-400 uppercase mb-1.5">Icono (Emoji)</label>
                    <input type="text" value={slideActualObj.icono} onChange={e => actualizarSlideActiva('icono', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-center text-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/3 transition-colors duration-1000" style={{ backgroundColor: config.tema.color_secundario }}></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/4 transition-colors duration-1000" style={{ backgroundColor: config.tema.color_secundario }}></div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 space-y-12 relative z-10">
        
        {/* HERO Y CARRUSEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.section initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} className="lg:col-span-5 rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-2xl bg-white/5">
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/20 shadow-sm" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>
                {sindicatoNombre || 'MI ORGANIZACIÓN'}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-md">
                {config.hero.titulo}
              </h1>
              <p className="text-sm sm:text-base font-medium text-white/70 leading-relaxed max-w-sm">
                {config.hero.subtitulo}
              </p>
            </div>
          </motion.section>

          <motion.section initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} className="lg:col-span-7 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-2xl bg-white/5 flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none transition-opacity duration-500 group-hover:opacity-20"></div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={slideActual}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10 my-auto"
              >
                <div className="md:col-span-8 space-y-4">
                  <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-sm" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.25), color: config.tema.color_secundario }}>
                    {slideActualObj.badge}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    {slideActualObj.titulo}
                  </h2>
                  <p className="text-sm font-medium text-white/80 leading-relaxed max-w-md">
                    {slideActualObj.texto}
                  </p>
                </div>

                <div className="md:col-span-4 flex justify-center items-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-6xl shadow-2xl animate-bounce-slow" style={{boxShadow: `0 20px 40px ${hexToRGB(config.tema.color_secundario, 0.3)}`}}>
                    {slideActualObj.icono}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10 relative z-10">
              <div className="flex gap-2">
                {config.carrusel_slides.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSlideActual(idx)} 
                    className={`h-2 rounded-full transition-all duration-300 ${slideActual === idx ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSlideActual((slideActual - 1 + config.carrusel_slides.length) % config.carrusel_slides.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors backdrop-blur-sm border border-white/10">‹</button>
                <button onClick={() => setSlideActual((slideActual + 1) % config.carrusel_slides.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors backdrop-blur-sm border border-white/10">›</button>
              </div>
            </div>
          </motion.section>
        </div>

        {config.modulos.pulso_economico && (
          <motion.section initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5 cursor-default">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>🏦</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Valor UF Hoy</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? <span className="animate-pulse opacity-50">Calculando...</span> : indicadores.uf ? `$${indicadores.uf.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5 cursor-default">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>📊</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Valor UTM</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? <span className="animate-pulse opacity-50">Calculando...</span> : indicadores.utm ? `$${indicadores.utm.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5 cursor-default">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>💵</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Dólar Observado</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? <span className="animate-pulse opacity-50">Calculando...</span> : indicadores.dolar ? `$${indicadores.dolar.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {config.modulos.participacion_activa && (
            <div className="lg:col-span-2 space-y-8">
              <motion.section initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}}>
                <div className="flex items-center gap-3 mb-6 pl-2">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span style={{ color: config.tema.color_secundario }}>⚡</span> Participación Activa
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* === ASAMBLEA VIRTUAL JITSI === */}
                  <div className="relative bg-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" style={{ backgroundColor: config.tema.color_secundario }}></div>
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                      <div className="max-w-lg">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                          </span>
                          <span className="text-rose-400 text-[10px] font-black tracking-widest uppercase">Transmisión Oficial</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Sala de Asamblea</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-8">
                          Únete a la discusión en tiempo real. Tu micrófono estará silenciado al ingresar para mantener el orden. Acceso exclusivo y cifrado.
                        </p>
                        <Link href="/asamblea" className="inline-flex items-center justify-center gap-3 text-white font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 w-full sm:w-auto shadow-lg hover:-translate-y-1" style={{ backgroundColor: config.tema.color_secundario, boxShadow: `0 10px 25px ${hexToRGB(config.tema.color_secundario, 0.4)}` }}>
                          <span>Ingresar a la Sala</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                      <div className="p-3.5 rounded-2xl font-bold text-2xl shadow-inner border border-white/5" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2) }}>🗳️</div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Sistema de Votación</h3>
                        <p className="text-[10px] text-white/50 font-black mt-1.5 uppercase tracking-[0.2em]">Blockchain interna cifrada</p>
                      </div>
                    </div>

                    {asambleas.length === 0 ? (
                      <div className="bg-black/20 border border-white/5 rounded-3xl p-12 text-center">
                        <span className="text-5xl mb-4 opacity-30 block drop-shadow-md">🧘</span>
                        <p className="text-white font-black text-lg">Todo tranquilo.</p>
                        <p className="text-white/50 text-sm mt-2 font-medium">No hay votaciones activas en este momento.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {asambleas.map((asamblea) => (
                          <div key={asamblea.id} className="bg-black/20 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
                            <span className="px-3.5 py-1.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-xl mb-4 inline-block tracking-widest border border-red-500/20 shadow-sm relative z-10">Votación Abierta</span>
                            <h4 className="text-xl font-black text-white leading-tight mb-3 relative z-10">{asamblea.titulo}</h4>
                            <p className="text-xs text-white/60 font-medium mb-8 relative z-10">Tu voto es anónimo, único y no puede ser modificado una vez emitido.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                              <button onClick={() => handleVotar(asamblea.id, 'A favor')} className="group/btn flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 text-sm font-bold py-4 px-4 rounded-2xl transition-all duration-300">
                                <span className="group-hover/btn:scale-125 transition-transform drop-shadow-sm">👍</span> A Favor
                              </button>
                              <button onClick={() => handleVotar(asamblea.id, 'En contra')} className="group/btn flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400 text-sm font-bold py-4 px-4 rounded-2xl transition-all duration-300">
                                <span className="group-hover/btn:scale-125 transition-transform drop-shadow-sm">👎</span> En Contra
                              </button>
                              <button onClick={() => handleVotar(asamblea.id, 'Abstención')} className="group/btn flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-slate-400/50 hover:bg-slate-700/50 text-slate-300 text-sm font-bold py-4 px-4 rounded-2xl transition-all duration-300">
                                <span className="group-hover/btn:scale-125 transition-transform drop-shadow-sm">✋</span> Abstenerse
                              </button>
                            </div>
                            
                            {votoEstado && (
                              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-3 relative z-10 backdrop-blur-sm">
                                <span className="bg-emerald-500/20 p-2 rounded-xl text-sm">✅</span> 
                                <span>Voto Registrado: <span className="uppercase text-white bg-emerald-600/50 px-3 py-1 rounded-full ml-1 border border-emerald-500/30">{votoEstado}</span></span>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </div>
          )}

          {/* MÓDULO 3: ACTUALIDAD */}
          {config.modulos.actualidad && (
            <div className="lg:col-span-1">
              <motion.section initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.4}} className="sticky top-10">
                <div className="flex items-center gap-3 mb-6 pl-2">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span style={{ color: config.tema.color_secundario }}>🔔</span> Actualidad
                  </h2>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[500px]">
                  <div className="p-6 border-b border-white/10 bg-black/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/5" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2) }}>📰</div>
                    <h4 className="text-lg font-black text-white tracking-tight">Muro de Noticias</h4>
                  </div>
                  
                  <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {comunicados.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center">
                        <span className="text-5xl mb-4 opacity-30 drop-shadow-md">📭</span>
                        <p className="text-white/50 font-bold text-sm">Sin comunicados recientes.</p>
                      </div>
                    ) : (
                      comunicados.map((noticia) => (
                        <article key={noticia.id} className="bg-black/20 hover:bg-black/40 p-6 rounded-3xl border border-white/5 transition-all duration-300 group hover:border-white/10 hover:shadow-lg">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 inline-block px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5" style={{ color: config.tema.color_secundario }}>
                            {new Date(noticia.fecha_creacion).toLocaleDateString('es-CL')}
                          </span>
                          <h4 className="text-sm font-bold text-white mb-2.5 leading-snug group-hover:text-blue-300 transition-colors">{noticia.titulo}</h4>
                          <p className="text-xs text-white/60 font-medium leading-relaxed line-clamp-4">{noticia.contenido}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}