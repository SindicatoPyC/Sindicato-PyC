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
  
  const [userRol, setUserRol] = useState<string>('');

  const [indicadores, setIndicadores] = useState<any>({
    uf: null,
    utm: null,
    dolar: null,
    cargando: true
  });

  useEffect(() => {
    async function fetchData() {
      const cookies = document.cookie.split(';');
      const rolCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-rol='));
      if (rolCookie) {
        setUserRol(rolCookie.split('=')[1]);
      }

      try {
        const supabase = createClient();
        
        const { data: comData } = await supabase.from('comunicados').select('*').order('fecha_creacion', { ascending: false });
        if (comData) setComunicados(comData);

        const { data: asamData } = await supabase.from('asambleas_votaciones').select('*').eq('estado', 'Abierta');
        if (asamData) setAsambleas(asamData);

        const { data: docData } = await supabase.from('libro_actas').select('*').order('id', { ascending: false });
        if (docData) setDocumentos(docData);
      } catch (err) {
        console.error("Error al conectar con Supabase:", err);
      } finally {
        setLoading(false);
      }

      try {
        const res = await fetch('https://mindicador.cl/api');
        if (res.ok) {
          const data = await res.json();
          setIndicadores({
            uf: data.uf.valor,
            utm: data.utm.valor,
            dolar: data.dolar.valor,
            cargando: false
          });
        }
      } catch (error) {
        console.error("Error al cargar indicadores:", error);
        setIndicadores(prev => ({ ...prev, cargando: false }));
      }
    }
    fetchData();
  }, []);

  const handleVotar = async (asambleaId: string, opcion: string) => {
    const supabase = createClient();
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
    const rutUsuario = sessionCookie ? sessionCookie.split('=')[1] : '11111111-1';

    const { error } = await supabase.from('votos_registrados').insert([{ asamblea_id: asambleaId, usuario_rut: rutUsuario, opcion_elegida: opcion }]);

    if (error) {
      if (error.code === '23505') { 
        alert('⚠️ Ya has emitido tu voto en esta asamblea. El sistema impide votos duplicados.');
      } else {
        alert('Error al registrar el voto: ' + error.message);
      }
    } else {
      alert(`✅ ¡Voto registrado con éxito: "${opcion}"!`);
      setVotoEstado(opcion);
    }
  };

  return (
    <div className="bg-slate-950 font-sans text-slate-100 pb-20 relative w-full">

      {/* Contenedor principal con pt-6 para acoplarse perfectamente al Navbar */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-16 relative z-10">
        
        {/* HERO: Carrusel Principal */}
        <section className="rounded-3xl shadow-2xl shadow-black/30 border border-slate-700/50 overflow-hidden">
          <Carrusel />
        </section>

        {/* SECCIÓN 1: Indicadores Económicos */}
        <section>
          <div className="flex items-center gap-3 mb-6 pl-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-blue-400 drop-shadow-md">📈</span> Pulso Económico
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group relative bg-slate-800/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 hover:border-blue-500/60 hover:bg-slate-800 transition-all duration-300 overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-5">
                <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-300 text-2xl border border-blue-500/30 group-hover:scale-110 transition-transform">🏦</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor UF Hoy</p>
                  <p className="text-3xl font-black text-white tracking-tighter">
                    {indicadores.cargando ? '...' : indicadores.uf ? `$${indicadores.uf.toLocaleString('es-CL')}` : 'No disp.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative bg-slate-800/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800 transition-all duration-300 overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-5">
                <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-300 text-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform">📊</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor UTM</p>
                  <p className="text-3xl font-black text-white tracking-tighter">
                    {indicadores.cargando ? '...' : indicadores.utm ? `$${indicadores.utm.toLocaleString('es-CL')}` : 'No disp.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative bg-slate-800/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 hover:border-amber-500/60 hover:bg-slate-800 transition-all duration-300 overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-5">
                <div className="bg-amber-500/20 p-4 rounded-2xl text-amber-300 text-2xl border border-amber-500/30 group-hover:scale-110 transition-transform">💵</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dólar Observado</p>
                  <p className="text-3xl font-black text-white tracking-tighter">
                    {indicadores.cargando ? '...' : indicadores.dolar ? `$${indicadores.dolar.toLocaleString('es-CL')}` : 'No disp.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL: 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-12">
            
            {/* SECCIÓN 2: Participación */}
            <section>
              <div className="flex items-center gap-3 mb-6 pl-2">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <span className="text-indigo-400 drop-shadow-md">⚡</span> Participación Activa
                </h2>
              </div>
              
              <div className="space-y-6">
                
                {/* Asamblea Virtual */}
                <div className="relative bg-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-700 overflow-hidden group hover:border-indigo-500 transition-colors">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-colors duration-700"></div>
                  
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
                      <p className="text-slate-300 text-sm leading-relaxed mb-8">
                        Únete a la discusión en tiempo real. Tu micrófono estará silenciado al ingresar para mantener el orden. Acceso exclusivo y cifrado.
                      </p>
                      <Link href="/asamblea" className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 w-full sm:w-auto shadow-lg shadow-indigo-900/30">
                        <span>Ingresar a la Sala</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Votación */}
                <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 sm:p-10 shadow-lg">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-6">
                    <div className="bg-violet-500/20 p-3 rounded-2xl text-violet-300 font-bold text-2xl border border-violet-500/30">🗳️</div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Sistema de Votación</h3>
                      <p className="text-sm text-slate-300 font-medium mt-1">Blockchain interna cifrada</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="animate-pulse space-y-4"><div className="h-4 bg-slate-700 rounded w-3/4"></div><div className="h-12 bg-slate-700 rounded-2xl w-full"></div></div>
                  ) : asambleas.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-10 text-center">
                      <span className="text-4xl mb-3 opacity-50 block">🧘</span>
                      <p className="text-slate-200 font-bold text-lg">Todo tranquilo.</p>
                      <p className="text-slate-400 text-sm">No hay votaciones activas en este momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {asambleas.map((asamblea) => (
                        <div key={asamblea.id} className="relative">
                          <h4 className="text-xl font-black text-white leading-tight mb-2">{asamblea.titulo}</h4>
                          <p className="text-sm text-slate-300 font-medium mb-6">Tu voto es anónimo, único y no puede ser modificado una vez emitido.</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button onClick={() => handleVotar(asamblea.id, 'A favor')} className="group flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-300 font-bold py-3 px-4 rounded-xl transition-all duration-300">
                              <span className="group-hover:scale-125 transition-transform">👍</span> A Favor
                            </button>
                            <button onClick={() => handleVotar(asamblea.id, 'En contra')} className="group flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-600 hover:border-rose-400 hover:bg-rose-500/20 text-rose-300 font-bold py-3 px-4 rounded-xl transition-all duration-300">
                              <span className="group-hover:scale-125 transition-transform">👎</span> En Contra
                            </button>
                            <button onClick={() => handleVotar(asamblea.id, 'Abstención')} className="group flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-600 hover:border-slate-400 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl transition-all duration-300">
                              <span className="group-hover:scale-125 transition-transform">✋</span> Abstenerse
                            </button>
                          </div>
                          
                          {votoEstado && (
                            <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300 font-bold flex items-center gap-3">
                              <span className="bg-emerald-500/30 p-1 rounded-full">✅</span> 
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

          {/* COLUMNA DERECHA: Muro de Noticias */}
          <div className="lg:col-span-1">
            <section className="sticky top-28">
              <div className="flex items-center gap-3 mb-6 pl-2">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <span className="text-emerald-400 drop-shadow-md">🔔</span> Actualidad
                </h2>
              </div>

              <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-slate-700 overflow-hidden shadow-lg">
                <div className="bg-slate-800 p-6 flex items-center justify-between border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <span className="bg-slate-900 p-2 rounded-lg border border-slate-600">📰</span> Muro de Noticias
                  </h3>
                </div>
                
                <div className="p-6 space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar relative">
                  <div className="absolute left-8 top-10 bottom-10 w-px bg-slate-700 hidden sm:block"></div>
                  
                  {loading ? (
                    <div className="animate-pulse space-y-6">
                      <div className="h-20 bg-slate-700 rounded-2xl w-full"></div>
                      <div className="h-24 bg-slate-700 rounded-2xl w-full"></div>
                    </div>
                  ) : comunicados.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                      <span className="text-4xl mb-3 opacity-30">📭</span>
                      <p className="text-slate-400 font-bold text-sm">No hay noticias hoy.</p>
                    </div>
                  ) : (
                    comunicados.map((noticia) => (
                      <article key={noticia.id} className="relative group pl-0 sm:pl-8">
                        <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-emerald-400 hidden sm:block group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(52,211,153,0.6)]"></div>
                        
                        <div className="bg-slate-900/50 group-hover:bg-slate-900 p-5 rounded-2xl border border-slate-700 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              {new Date(noticia.fecha_creacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 mb-2 group-hover:text-emerald-300 transition-colors leading-snug">{noticia.titulo}</h4>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed line-clamp-3">{noticia.contenido}</p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  ); 
}