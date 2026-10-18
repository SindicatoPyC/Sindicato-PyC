'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function AdminPanel() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [validando, setValidando] = useState(true);

  const [accesoBloqueado, setAccesoBloqueado] = useState({ bloqueado: false, motivo: '' });

  const [activeTab, setActiveTab] = useState('historial'); // Por defecto en Historial para testear
  const [idSindicatoActual, setIdSindicatoActual] = useState<number | null>(null);
  const [editNombreSindicato, setEditNombreSindicato] = useState('');

  // Historial Pro y Asistencia
  const [historialAsambleas, setHistorialAsambleas] = useState<any[]>([]);
  const [asistenciaRegistros, setAsistenciaRegistros] = useState<any[]>([]);
  const [tituloNuevaAsamblea, setTituloNuevaAsamblea] = useState('');

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) validarAccesoAdmin();
  }, [isMounted]);

  // SUSCRIPCIÓN EN TIEMPO REAL ULTRA-RÁPIDA
  useEffect(() => {
    if (!idSindicatoActual) return;
    const supabase = createClient();
    
    // Función para refrescar las asistencias
    const refrescarAsistencias = async () => {
      const { data } = await supabase
        .from('asistencia_asambleas')
        .select('*')
        .eq('sindicato_id', idSindicatoActual)
        .order('hora_entrada', { ascending: false });

      if (Array.isArray(data)) {
        setAsistenciaRegistros(data);
      }
    };

    const channel = supabase
      .channel('realtime-historial-asistencia')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'asistencia_asambleas',
          filter: `sindicato_id=eq.${idSindicatoActual}`
        },
        () => {
          refrescarAsistencias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idSindicatoActual]);

  const validarAccesoAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
      
      const rolUsuario = String(profile?.role || '').trim().toLowerCase();
      if (['superadmin', 'admin', 'administrador', 'directiva'].includes(rolUsuario)) {
        setValidando(false);
        fetchEnterpriseData(); 
      } else {
        router.push('/dashboard'); 
      }
    } else {
      router.push('/');
    }
  };

  const fetchEnterpriseData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('sindicato_id').eq('id', user.id).single();
        if (profile?.sindicato_id) {
          setIdSindicatoActual(profile.sindicato_id);
          const { data: sindicato } = await supabase.from('sindicatos').select('nombre').eq('id', profile.sindicato_id).single();
          if (sindicato) setEditNombreSindicato(sindicato.nombre || '');

          const { data: usersData } = await supabase.from('profiles').select('*').eq('sindicato_id', profile.sindicato_id);
          if (Array.isArray(usersData)) setUsuarios(usersData);

          const { data: postData } = await supabase.from('postulaciones').select('*').eq('sindicato_id', profile.sindicato_id).eq('estado', 'Pendiente');
          if (Array.isArray(postData)) setPostulaciones(postData);

          // Cargar Asambleas creadas
          const { data: histData } = await supabase
            .from('historial_asambleas')
            .select('*')
            .eq('sindicato_id', profile.sindicato_id)
            .order('created_at', { ascending: false });
          if (Array.isArray(histData)) setHistorialAsambleas(histData);

          // Cargar Asistencias escaneadas
          const { data: asistData } = await supabase
            .from('asistencia_asambleas')
            .select('*')
            .eq('sindicato_id', profile.sindicato_id)
            .order('hora_entrada', { ascending: false });
          if (Array.isArray(asistData)) setAsistenciaRegistros(asistData);
        }
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleCrearAsambleaHistorica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNuevaAsamblea.trim()) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

      await supabase.from('historial_asambleas').insert([{
        titulo: tituloNuevaAsamblea.trim(),
        sindicato_id: idSindicatoActual,
        created_by: user.id,
        creador_nombre: adminProfile?.full_name || 'Administrador'
      }]);

      setTituloNuevaAsamblea('');
      fetchEnterpriseData();
      alert('✅ Sesión creada y lista para escanear en tiempo real.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEliminarAsamblea = async (id: number, titulo: string) => {
    if (!window.confirm(`⚠️ ¿Deseas eliminar la asamblea "${titulo}" y limpiar sus registros?`)) return;
    try {
      const supabase = createClient();
      await supabase.from('historial_asambleas').delete().eq('id', id);
      await supabase.from('asistencia_asambleas').delete().eq('asamblea_titulo', titulo).eq('sindicato_id', idSindicatoActual);

      setHistorialAsambleas(historialAsambleas.filter(a => a.id !== id));
      setAsistenciaRegistros(asistenciaRegistros.filter(a => a.asamblea_titulo !== titulo));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "sb-sindicato-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
  };

  if (!isMounted || validando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 md:pb-0 text-slate-900 relative">
      <div className="flex flex-col md:flex-row h-screen">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:flex w-72 bg-gradient-to-b from-[#070b19] via-[#0f172a] to-[#1e293b] text-white flex-col shadow-2xl shrink-0 border-r border-white/5">
          <div className="p-8 border-b border-white/10 flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-xl font-black">⚡</span>
            </div>
            <div>
              <h1 className="font-black text-base truncate text-white">{editNombreSindicato || 'Sindicato'}</h1>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Enterprise Admin</p>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            <button onClick={() => setActiveTab('historial')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'historial' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">📜</span> Historial Pro
            </button>
            <button onClick={() => setActiveTab('padron')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'padron' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">👥</span> Padrón & Socios
            </button>
          </nav>

          <div className="p-6 border-t border-white/10 space-y-3 bg-black/20">
            <Link href="/dashboard" className="w-full flex justify-center py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">⇦ Portal Socios</Link>
            <button onClick={handleLogout} className="w-full py-3 bg-rose-500/20 text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</button>
          </div>
        </aside>

        {/* BOTTOM NAV MOBILE */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#070b19] border-t border-white/10 z-50 px-6 py-3 flex justify-around items-center">
          <button onClick={() => setActiveTab('historial')} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === 'historial' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
            <span className="text-lg">📜</span>
            <span className="text-[9px] font-bold mt-1">Historial</span>
          </button>
          <button onClick={() => setActiveTab('padron')} className={`flex flex-col items-center p-2 rounded-xl ${activeTab === 'padron' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
            <span className="text-lg">👥</span>
            <span className="text-[9px] font-bold mt-1">Padrón</span>
          </button>
          <Link href="/dashboard/asistencia" className="flex flex-col items-center p-2 rounded-xl text-emerald-400">
            <span className="text-lg">📷</span>
            <span className="text-[9px] font-bold mt-1">Escáner</span>
          </Link>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* TAB: HISTORIAL PRO */}
            {activeTab === 'historial' && (
              <div className="space-y-6">
                <header>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Historial Pro de Asambleas</h2>
                  <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Auditoría en vivo de socios escaneados.</p>
                </header>

                {/* Formulario Crear Asamblea */}
                <form onSubmit={handleCrearAsambleaHistorica} className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-4">
                  <h3 className="text-sm md:text-base font-black text-slate-800">Nueva Sesión de Asamblea</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      required 
                      value={tituloNuevaAsamblea} 
                      onChange={e => setTituloNuevaAsamblea(e.target.value)} 
                      placeholder="Ej: test3..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" 
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest shadow-md">
                      Registrar Sesión
                    </button>
                  </div>
                </form>

                {/* Listado de Asambleas y Asistencias */}
                <div className="space-y-6">
                  {historialAsambleas.length === 0 ? (
                    <div className="bg-white p-8 rounded-[2rem] text-center border border-slate-100">
                      <span className="text-4xl block mb-2 opacity-40">📂</span>
                      <p className="text-slate-400 font-bold text-sm">No hay asambleas registradas.</p>
                    </div>
                  ) : (
                    historialAsambleas.map((asam) => {
                      // 🚨 Comparación case-insensitive y sin espacios en blanco
                      const asistentesEstaAsamblea = asistenciaRegistros.filter(
                        (a) => a.asamblea_titulo?.trim().toLowerCase() === asam.titulo?.trim().toLowerCase()
                      );

                      const fechaCreacion = new Date(asam.created_at).toLocaleDateString('es-CL');

                      return (
                        <div key={asam.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 md:p-8 shadow-md space-y-5">
                          
                          {/* Cabecera de la Asamblea */}
                          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
                                📅 {fechaCreacion}
                              </span>
                              <h3 className="text-xl font-black text-slate-800 mt-2">{asam.titulo}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5">
                                👥 {asistentesEstaAsamblea.length} Asistente(s)
                              </span>
                              <button onClick={() => handleEliminarAsamblea(asam.id, asam.titulo)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-100">
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Listado de Asistentes */}
                          <div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Socios Registrados:</h4>
                            
                            {asistentesEstaAsamblea.length === 0 ? (
                              <p className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                ⚠️ Ningún socio ha registrado asistencia para esta sesión todavía.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {asistentesEstaAsamblea.map((asist) => {
                                  const horaIngreso = asist.hora_entrada ? new Date(asist.hora_entrada).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                  const horaSalida = asist.hora_salida ? new Date(asist.hora_salida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : null;

                                  return (
                                    <div key={asist.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-3 shadow-sm">
                                      <div>
                                        <div className="flex justify-between items-start">
                                          <span className="text-sm font-black text-slate-800 block truncate">{asist.usuario_nombre || 'Socio'}</span>
                                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                                            {asist.usuario_rol || 'SOCIO'}
                                          </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-500">{asist.usuario_rut}</p>
                                        <p className="text-[10px] text-slate-400">{asist.usuario_email || 'Sin correo'}</p>
                                      </div>

                                      {/* Auditoría de Quién Escaneó */}
                                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                                        <span className="text-slate-400">Escaneado por:</span>
                                        <span className="font-bold text-slate-800">{asist.operador_nombre || 'Presidente'}</span>
                                      </div>

                                      {/* Tiempos de Entrada / Salida */}
                                      <div className="pt-2 border-t border-slate-200 flex flex-col gap-1 text-[11px]">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400 uppercase font-bold text-[9px]">Entrada:</span>
                                          <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{horaIngreso} hrs</span>
                                        </div>
                                        {horaSalida && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-slate-400 uppercase font-bold text-[9px]">Salida:</span>
                                            <span className="font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{horaSalida} hrs</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: PADRÓN */}
            {activeTab === 'padron' && (
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md">
                <h3 className="text-lg font-black text-slate-800 mb-4">Padrón de Socios ({usuarios.length})</h3>
                <div className="divide-y divide-slate-100">
                  {usuarios.map(u => (
                    <div key={u.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.rut} • {u.email}</p>
                      </div>
                      <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}