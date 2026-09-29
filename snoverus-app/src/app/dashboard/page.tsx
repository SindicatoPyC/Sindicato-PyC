'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';
import Carrusel from '../../components/Carrusel';

export default function Dashboard() {
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
          const { data: profile } = await supabase.from('profiles').select('sindicato_id, role').eq('id', user.id).single();
          if (profile?.role) setUserRol(profile.role);

          if (profile?.sindicato_id) {
            setSindicatoId(profile.sindicato_id);
            const { data: sindicatoData } = await supabase.from('sindicatos').select('configuracion, nombre').eq('id', profile.sindicato_id).single();
            
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
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen font-sans text-slate-100 pb-28 relative w-full transition-colors duration-700" style={{ backgroundColor: config.tema.color_primario }}>
      
      {esAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/20 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-2 text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
            Modo Directiva (Editor Carrusel 3.0)
          </span>
          <div className="h-4 w-px bg-white/20"></div>
          <button 
            onClick={() => setModoEdicion(!modoEdicion)} 
            className={`px-4 py-2 rounded-full transition-all shadow-md ${modoEdicion ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
          >
            {modoEdicion ? '✕ Cerrar Editor' : '✏️ Editar Carrusel y Home'}
          </button>
          {modoEdicion && (
            <>
              <button onClick={restaurarPredeterminados} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                🔄 Fábrica
              </button>
              <button onClick={guardarConfiguracionEnVivo} disabled={guardandoCambios} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all">
                {guardandoCambios ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      )}

      {esAdmin && modoEdicion && (
        <div className="bg-slate-900/95 border-b border-white/10 p-6 sticky top-0 z-40 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-white/10 pb-4">
              <div>
                <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Plantillas de Ideas (Presets)</label>
                <div className="flex gap-2">
                  <button onClick={() => aplicarPlantillaPreset('moderno')} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">Moderno</button>
                  <button onClick={() => aplicarPlantillaPreset('corporativo')} className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all">Corporativo</button>
                  <button onClick={() => aplicarPlantillaPreset('solidario')} className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all">Solidario</button>
                </div>
              </div>
              <div>
                <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Colores Corporativos</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.tema.color_primario} onChange={e => setConfig({...config, tema: {...config.tema, color_primario: e.target.value}})} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0" />
                  <input type="color" value={config.tema.color_secundario} onChange={e => setConfig({...config, tema: {...config.tema, color_secundario: e.target.value}})} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0" />
                  <span className="text-slate-400 font-mono">Fondo y Acentos</span>
                </div>
              </div>
              <div>
                <label className="block font-black text-slate-400 uppercase tracking-widest mb-2">Título Hero Izquierdo</label>
                <input type="text" value={config.hero.titulo} onChange={e => setConfig({...config, hero: {...config.hero, titulo: e.target.value}})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-indigo-400 uppercase tracking-widest text-[11px]">Gestor de Diapositivas del Carrusel ({config.carrusel_slides.length} slides)</span>
                <div className="flex gap-2">
                  <button onClick={agregarNuevoSlide} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">+ Añadir Slide</button>
                  <button onClick={eliminarSlideActual} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg">Borrar Slide Actual</button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {config.carrusel_slides.map((s, idx) => (
                  <button key={s.id} onClick={() => setSlideActual(idx)} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${slideActual === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    Slide {idx + 1}: {s.titulo.substring(0, 18)}...
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div>
                  <label className="block font-black text-slate-400 uppercase mb-1">Badge Superior</label>
                  <input type="text" value={slideActualObj.badge} onChange={e => actualizarSlideActiva('badge', e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold" />
                </div>
                <div>
                  <label className="block font-black text-slate-400 uppercase mb-1">Título de la Diapositiva</label>
                  <input type="text" value={slideActualObj.titulo} onChange={e => actualizarSlideActiva('titulo', e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold" />
                </div>
                <div>
                  <label className="block font-black text-slate-400 uppercase mb-1">Texto Descriptivo</label>
                  <input type="text" value={slideActualObj.texto} onChange={e => actualizarSlideActiva('texto', e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-medium" />
                </div>
                <div>
                  <label className="block font-black text-slate-400 uppercase mb-1">Icono / Emoji 3D</label>
                  <input type="text" value={slideActualObj.icono} onChange={e => actualizarSlideActiva('icono', e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center text-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/3" style={{ backgroundColor: config.tema.color_secundario }}></div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 space-y-12 relative z-10">
        
        {/* HERO Y CARRUSEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <section className="lg:col-span-5 rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md bg-white/5">
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/20 shadow-sm" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>
                {sindicatoNombre || 'MI ORGANIZACIÓN'}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-md">
                {config.hero.titulo}
              </h1>
              <p className="text-sm font-medium text-white/70 leading-relaxed">
                {config.hero.subtitulo}
              </p>
            </div>
          </section>

          <section className="lg:col-span-7 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md bg-white/5 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10 my-auto">
              <div className="md:col-span-8 space-y-4">
                <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-sm" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.25), color: config.tema.color_secundario }}>
                  {slideActualObj.badge}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {slideActualObj.titulo}
                </h2>
                <p className="text-sm font-medium text-white/80 leading-relaxed">
                  {slideActualObj.texto}
                </p>
              </div>

              <div className="md:col-span-4 flex justify-center items-center">
                <div className="w-28 h-28 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-5xl shadow-2xl animate-bounce-slow">
                  {slideActualObj.icono}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10 relative z-10">
              <div className="flex gap-2">
                {config.carrusel_slides.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSlideActual(idx)} 
                    className={`h-2 rounded-full transition-all duration-300 ${slideActual === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSlideActual((slideActual - 1 + config.carrusel_slides.length) % config.carrusel_slides.length)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors">‹</button>
                <button onClick={() => setSlideActual((slideActual + 1) % config.carrusel_slides.length)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors">›</button>
              </div>
            </div>
          </section>
        </div>

        {config.modulos.pulso_economico && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>🏦</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Valor UF Hoy</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? '...' : indicadores.uf ? `$${indicadores.uf.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>📊</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Valor UTM</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? '...' : indicadores.utm ? `$${indicadores.utm.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
              <div className="group relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-lg flex items-center gap-5">
                <div className="p-4 rounded-2xl text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2), color: config.tema.color_secundario }}>💵</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Dólar Observado</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{indicadores.cargando ? '...' : indicadores.dolar ? `$${indicadores.dolar.toLocaleString('es-CL')}` : 'No disp.'}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {config.modulos.participacion_activa && (
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6 pl-2">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span style={{ color: config.tema.color_secundario }}>⚡</span> Participación Activa
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* === ASAMBLEA VIRTUAL JITSI (REINCORPORADA) === */}
                  <div className="relative bg-white/5 rounded-[2rem] p-8 sm:p-10 shadow-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-colors backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" style={{ backgroundColor: config.tema.color_secundario }}></div>
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                      <div className="max-w-lg">
                        <div className="flex items-center gap-3 mb-4">
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
                        <Link href="/asamblea" className="inline-flex items-center justify-center gap-3 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 w-full sm:w-auto shadow-lg" style={{ backgroundColor: config.tema.color_secundario }}>
                          <span>Ingresar a la Sala</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 sm:p-10 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                      <div className="p-3 rounded-2xl font-bold text-2xl shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2) }}>🗳️</div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Sistema de Votación</h3>
                        <p className="text-xs text-white/50 font-medium mt-1 uppercase tracking-widest">Blockchain interna cifrada</p>
                      </div>
                    </div>

                    {asambleas.length === 0 ? (
                      <div className="bg-black/20 border border-white/5 rounded-2xl p-10 text-center">
                        <span className="text-4xl mb-3 opacity-50 block">🧘</span>
                        <p className="text-white font-bold">Todo tranquilo.</p>
                        <p className="text-white/50 text-sm mt-1">No hay votaciones activas en este momento.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {asambleas.map((asamblea) => (
                          <div key={asamblea.id} className="bg-black/20 p-6 rounded-2xl border border-white/5">
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[9px] font-black uppercase rounded-lg mb-3 inline-block tracking-widest border border-red-500/20 animate-pulse">Votación Abierta</span>
                            <h4 className="text-lg font-black text-white leading-tight mb-2">{asamblea.titulo}</h4>
                            <p className="text-xs text-white/60 font-medium mb-6">Tu voto es anónimo, único y no puede ser modificado una vez emitido.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <button onClick={() => handleVotar(asamblea.id, 'A favor')} className="group flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-300 text-sm font-bold py-3.5 px-4 rounded-xl transition-all duration-300">
                                <span className="group-hover:scale-125 transition-transform">👍</span> A Favor
                              </button>
                              <button onClick={() => handleVotar(asamblea.id, 'En contra')} className="group flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-rose-400 hover:bg-rose-500/20 text-rose-300 text-sm font-bold py-3.5 px-4 rounded-xl transition-all duration-300">
                                <span className="group-hover:scale-125 transition-transform">👎</span> En Contra
                              </button>
                              <button onClick={() => handleVotar(asamblea.id, 'Abstención')} className="group flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-slate-400 hover:bg-slate-700 text-slate-300 text-sm font-bold py-3.5 px-4 rounded-xl transition-all duration-300">
                                <span className="group-hover:scale-125 transition-transform">✋</span> Abstenerse
                              </button>
                            </div>
                            
                            {votoEstado && (
                              <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-3">
                                <span className="bg-emerald-500/30 p-1.5 rounded-full">✅</span> 
                                Voto Registrado: <span className="uppercase text-emerald-200 bg-emerald-950 px-3 py-1 rounded-full">{votoEstado}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* MÓDULO 3: ACTUALIDAD */}
          {config.modulos.actualidad && (
            <div className="lg:col-span-1">
              <section className="sticky top-10">
                <div className="flex items-center gap-3 mb-6 pl-2">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span style={{ color: config.tema.color_secundario }}>🔔</span> Actualidad
                  </h2>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-xl overflow-hidden min-h-[500px]">
                  <div className="p-6 border-b border-white/10 bg-black/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner" style={{ backgroundColor: hexToRGB(config.tema.color_secundario, 0.2) }}>📰</div>
                    <h4 className="text-lg font-black text-white">Muro de Noticias</h4>
                  </div>
                  
                  <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {comunicados.length === 0 ? (
                      <div className="text-center py-16 flex flex-col items-center">
                        <span className="text-4xl mb-3 opacity-30">📭</span>
                        <p className="text-white/50 font-bold text-sm">Sin comunicados recientes.</p>
                      </div>
                    ) : (
                      comunicados.map((noticia) => (
                        <article key={noticia.id} className="bg-black/20 hover:bg-black/40 p-5 rounded-2xl border border-white/5 transition-colors group">
                          <span className="text-[9px] font-black uppercase tracking-widest mb-2 inline-block px-2 py-1 rounded bg-white/10" style={{ color: config.tema.color_secundario }}>
                            {new Date(noticia.fecha_creacion).toLocaleDateString('es-CL')}
                          </span>
                          <h4 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">{noticia.titulo}</h4>
                          <p className="text-xs text-white/60 font-medium leading-relaxed line-clamp-4">{noticia.contenido}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}