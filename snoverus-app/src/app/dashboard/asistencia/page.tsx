'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AsistenciaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de Asistencia
  const [asambleaActiva, setAsambleaActiva] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    fetchAsistenciaData();
  }, []);

  async function fetchAsistenciaData() {
    setLoading(true);
    const supabase = createClient();
    
    // 🛡️ Escudo de Sesión: Obtenemos el usuario y atrapamos errores de token corrupto
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      // Si la sesión es inválida o el token caducó (Error 400), limpiamos y redirigimos
      await supabase.auth.signOut();
      router.push('/');
      return;
    }

    setUser(currentUser);
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    
    if (profileData) {
      setPerfil(profileData);
      const rolUsuario = String(profileData.role || '').toLowerCase();
      const esAdmin = rolUsuario === 'admin' || rolUsuario === 'administrador' || rolUsuario === 'directiva';
      setIsAdmin(esAdmin);

      // 1. Buscar si hay una asamblea activa (Abierta)
      const { data: asamData } = await supabase
        .from('asambleas_votaciones')
        .select('*')
        .eq('estado', 'Abierta')
        .limit(1);

      const asambleaActual = asamData && asamData.length > 0 ? asamData[0] : null;
      setAsambleaActiva(asambleaActual);

      // 2. Traer el historial de asistencias
      let query = supabase.from('asistencia_asambleas').select('*').order('fecha_asistencia', { ascending: false });
      
      if (!esAdmin) {
        query = query.eq('usuario_rut', profileData.rut);
      } else if (asambleaActual) {
        query = query.eq('asamblea_titulo', asambleaActual.titulo);
      }

      const { data: asistData } = await query;

      // 3. Traer perfiles y unirlos manualmente en el Frontend
      const { data: perfilesData } = await supabase.from('profiles').select('rut, full_name');

      if (asistData) {
        const asistenciasCompletas = asistData.map((asist) => {
          const perfilAsociado = perfilesData?.find(p => p.rut === asist.usuario_rut);
          return {
            ...asist,
            profiles: { full_name: perfilAsociado ? perfilAsociado.full_name : 'Usuario Sindicato' }
          };
        });
        setAsistencias(asistenciasCompletas);
      }
    }
    setLoading(false);
  }

  // FUNCIÓN PARA REGISTRAR ENTRADA O REINGRESO
  const handleCheckInQR = async () => {
    if (!asambleaActiva || !perfil) return;
    setRegistrando(true);
    const supabase = createClient();

    // Verificamos si ya existe el registro en la BD
    const { data: existing } = await supabase
      .from('asistencia_asambleas')
      .select('*')
      .eq('asamblea_titulo', asambleaActiva.titulo)
      .eq('user_id', user.id)
      .maybeSingle();

    let errorObj = null;

    if (existing) {
      // Reingreso: Actualizamos el registro existente a "Presente"
      const { error } = await supabase.from('asistencia_asambleas').update({
        estado: 'Presente',
        fecha_asistencia: new Date().toISOString(),
        hora_salida: null
      }).eq('id', existing.id);
      errorObj = error;
    } else {
      // Primera Entrada: Insertamos un registro nuevo
      const { error } = await supabase.from('asistencia_asambleas').insert([{ 
        asamblea_titulo: asambleaActiva.titulo, 
        usuario_rut: perfil.rut,
        user_id: user.id,
        estado: 'Presente'
      }]);
      errorObj = error;
    }

    setRegistrando(false);

    if (errorObj) {
      if (errorObj.code === '23505') {
        alert('⚠️ Tu asistencia ya fue registrada exitosamente para esta asamblea.');
      } else {
        alert(`❌ Error Supabase: ${errorObj.message}`);
        console.error(errorObj);
      }
    } else {
      alert('✅ ¡Asistencia registrada exitosamente!');
      fetchAsistenciaData(); 
    }
  };

  // FUNCIÓN PARA MARCAR SALIDA (ACTUALIZA ESTADO EN LUGAR DE BORRAR)
  const handleCheckOut = async () => {
    if (!asambleaActiva || !perfil) return;
    
    const confirmar = window.confirm("¿Estás seguro de que deseas marcar tu salida? Tu registro quedará en el historial del administrador.");
    if (!confirmar) return;

    setRegistrando(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('asistencia_asambleas')
      .update({ 
        estado: 'Retirado',
        hora_salida: new Date().toISOString()
      })
      .eq('asamblea_titulo', asambleaActiva.titulo)
      .eq('user_id', user.id);

    setRegistrando(false);

    if (error) {
      alert(`❌ Error al marcar salida: ${error.message}`);
      console.error(error);
    } else {
      alert('👋 Salida registrada. Puedes volver a marcar tu ingreso cuando lo desees.');
      fetchAsistenciaData(); 
    }
  };

  const qrCheckInUrl = asambleaActiva 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=CheckIn_Asamblea_${asambleaActiva.id}_${encodeURIComponent(asambleaActiva.titulo)}&color=1e293b&bgcolor=f8fafc`
    : 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SinAsambleaActiva&color=94a3b8';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const asistenciasAsambleaActual = isAdmin && asambleaActiva 
    ? asistencias.filter(a => a.asamblea_titulo === asambleaActiva.titulo) 
    : [];

  const presentesQuorum = asistenciasAsambleaActual.filter(a => a.estado === 'Presente' || !a.estado).length;

  const miRegistroActual = !isAdmin && asambleaActiva 
    ? asistencias.find(a => a.asamblea_titulo === asambleaActiva.titulo)
    : null;

  const socioYaMarco = miRegistroActual && (miRegistroActual.estado === 'Presente' || !miRegistroActual.estado);
  const socioRetirado = miRegistroActual && miRegistroActual.estado === 'Retirado';

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-24 relative overflow-hidden selection:bg-indigo-100">
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none -ml-20 mb-20"></div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10 space-y-8 relative z-10">
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-10 relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
           <div className="relative z-10 flex-1">
             <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full mb-4 inline-block shadow-sm">
               {isAdmin ? 'Panel de Control Directivo' : 'Participación Sindical'}
             </span>
             <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-2">
               Control de Asistencia
             </h2>
             <p className="text-slate-500 max-w-xl text-sm font-medium leading-relaxed">
               {isAdmin 
                 ? 'Monitorea el quórum en tiempo real y audita la asistencia de los socios durante las asambleas oficiales.' 
                 : 'Valida tu presencia en las asambleas escaneando el código QR habilitado por la directiva para cumplir con el quórum legal.'}
             </p>
           </div>
           
           <div className="w-full lg:w-auto shrink-0 relative z-10">
             <div className={`px-6 py-4 rounded-2xl border flex items-center gap-4 shadow-sm ${asambleaActiva ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <div className="text-3xl filter drop-shadow-sm">
                  {asambleaActiva ? '🟢' : '⏳'}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">Estado de Sesión</p>
                  <p className="text-lg font-black tracking-tight">
                    {asambleaActiva ? 'Asamblea en Curso' : 'Sin Sesión Activa'}
                  </p>
                </div>
             </div>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <motion.section initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100/80 p-8 flex flex-col items-center text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
              📷 {isAdmin ? 'QR de la Sesión' : 'Check-in Digital'}
            </h3>
            
            {!asambleaActiva ? (
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 w-full flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-5xl mb-4 block opacity-40">🕰️</span>
                <p className="text-slate-600 font-black text-lg mb-2">Sala de Espera</p>
                <p className="text-xs text-slate-400 font-medium px-4">
                  {isAdmin 
                    ? 'Abre una asamblea desde tu Panel de Control para habilitar el QR de asistencia.' 
                    : 'La directiva habilitará el código QR y el botón de registro al dar inicio a la sesión.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 text-center w-full shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded text-indigo-500 mb-2 block">Sesión Habilitada</span>
                  <h4 className="font-black text-slate-800 text-lg leading-tight">{asambleaActiva.titulo}</h4>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 w-fit mx-auto relative group">
                  <img src={qrCheckInUrl} alt="QR de Asistencia" className="w-48 h-48 rounded-xl transition-transform group-hover:scale-105 duration-500" />
                  {socioYaMarco && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center">
                       <span className="text-4xl mb-2">✅</span>
                       <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Presente</span>
                    </div>
                  )}
                  {socioRetirado && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center">
                       <span className="text-4xl mb-2">👋</span>
                       <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Salida Marcada</span>
                    </div>
                  )}
                </div>

                {!isAdmin && (
                  <div className="w-full pt-4">
                    <p className="text-xs text-slate-500 font-medium mb-4">
                      {socioYaMarco 
                        ? 'Estás registrado en la asamblea. Si debes retirarte, por favor marca tu salida para el registro.' 
                        : socioRetirado 
                        ? 'Has marcado tu salida. Puedes volver a registrar tu ingreso si regresaste.'
                        : 'Escanea este código con tu cámara o usa el botón directo para marcar tu presencia.'}
                    </p>
                    
                    {socioYaMarco ? (
                      <button 
                        onClick={handleCheckOut}
                        disabled={registrando}
                        className="w-full font-black py-4 rounded-xl shadow-md transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white"
                      >
                        {registrando ? 'Procesando...' : '👋 Marcar Salida'}
                      </button>
                    ) : (
                      <button 
                        onClick={handleCheckInQR}
                        disabled={registrando}
                        className="w-full font-black py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:-translate-y-1"
                      >
                        {registrando ? 'Verificando...' : socioRetirado ? '🔄 Reingresar a la Asamblea' : '✓ Registrar mi Asistencia'}
                      </button>
                    )}
                  </div>
                )}
                
                {isAdmin && (
                  <div className="w-full pt-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center border-t border-slate-100 pt-4">
                      Muestra este QR a los socios
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100/80 p-8 flex flex-col overflow-hidden h-full min-h-[500px]">
            
            {isAdmin ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 shadow-sm text-lg">📊</span> 
                    Quórum en Vivo
                  </h3>
                  {asambleaActiva && (
                    <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Presentes:</span>
                      <span className="text-xl font-black text-emerald-400">{presentesQuorum}</span>
                      <span className="text-[10px] text-slate-500">/ {asistenciasAsambleaActual.length} Reg.</span>
                    </div>
                  )}
                </div>

                {!asambleaActiva ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-12 text-center">
                    <span className="text-5xl mb-4 block">📈</span>
                    <p className="text-slate-500 font-bold">Inicia una asamblea para monitorear el quórum.</p>
                  </div>
                ) : asistenciasAsambleaActual.length === 0 ? (
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-3 block opacity-30">🪑</span>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Esperando a los primeros socios...</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                      <table className="w-full text-left min-w-[400px]">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Socio / RUT</th>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Hora de Ingreso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {asistenciasAsambleaActual.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <span className="font-bold text-slate-800 text-sm block">
                                  {item.profiles?.full_name || 'Usuario Sindicato'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{item.usuario_rut}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {new Date(item.fecha_asistencia).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <span className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shadow-sm text-lg">📋</span> 
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mis Asistencias</h3>
                </div>

                {asistencias.length === 0 ? (
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-3 block opacity-30">📂</span>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aún no tienes registros de asistencia.</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                    <AnimatePresence>
                      {asistencias.map((item) => (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-5 border border-slate-100 bg-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                        >
                          <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border mb-2 inline-block ${item.estado === 'Retirado' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {item.estado === 'Retirado' ? 'Finalizada / Salida' : 'Asistencia Válida'}
                            </span>
                            <h4 className={`font-black text-base leading-tight transition-colors ${item.estado === 'Retirado' ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                              {item.asamblea_titulo}
                            </h4>
                          </div>
                          
                          <div className="shrink-0 text-left sm:text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full sm:w-auto">
                            <div className="flex justify-between sm:justify-end items-center gap-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso:</span>
                              <span className="text-xs font-bold text-slate-700">
                                {new Date(item.fecha_asistencia).toLocaleString('es-CL', { 
                                  day: '2-digit', month: '2-digit', year: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            
                            {item.estado === 'Retirado' && item.hora_salida && (
                              <div className="flex justify-between sm:justify-end items-center gap-4 mt-2 border-t border-slate-200 pt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida:</span>
                                <span className="text-xs font-bold text-red-500">
                                  {new Date(item.hora_salida).toLocaleString('es-CL', { 
                                    day: '2-digit', month: '2-digit', year: 'numeric', 
                                    hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}

          </motion.section>
        </div>
      </main>
    </div>
  );
}