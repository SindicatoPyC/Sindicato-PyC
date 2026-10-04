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

  // Estados de Asistencia y Modal
  const [asambleaActiva, setAsambleaActiva] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [registrando, setRegistrando] = useState(false);
  
  const [mostrarModalAsamblea, setMostrarModalAsamblea] = useState(false);
  const [tituloNuevaAsamblea, setTituloNuevaAsamblea] = useState('');
  const [iniciandoAsamblea, setIniciandoAsamblea] = useState(false);

  useEffect(() => {
    fetchAsistenciaData();
  }, []);

  async function fetchAsistenciaData() {
    setLoading(true);
    const supabase = createClient();
    
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      await supabase.auth.signOut();
      router.push('/');
      return;
    }

    setUser(currentUser);
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    
    if (profileData) {
      setPerfil(profileData);
      const rolUsuario = String(profileData.role || '').toLowerCase();
      const esAdmin = rolUsuario === 'admin' || rolUsuario === 'administrador' || rolUsuario === 'directiva' || rolUsuario === 'superadmin';
      setIsAdmin(esAdmin);

      const { data: asamData } = await supabase
        .from('asambleas_votaciones')
        .select('*')
        .eq('estado', 'Abierta')
        .limit(1);

      const asambleaActual = asamData && asamData.length > 0 ? asamData[0] : null;
      setAsambleaActiva(asambleaActual);

      let query = supabase.from('asistencia_asambleas').select('*').order('fecha_asistencia', { ascending: false });
      
      if (!esAdmin) {
        query = query.eq('usuario_rut', profileData.rut);
      } else if (asambleaActual) {
        query = query.eq('asamblea_titulo', asambleaActual.titulo);
      }

      const { data: asistData } = await query;
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

  const handleIniciarAsamblea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNuevaAsamblea.trim() || !perfil?.sindicato_id) return;
    
    setIniciandoAsamblea(true);
    const supabase = createClient();
    
    try {
      if (asambleaActiva) {
         await supabase.from('asambleas_votaciones').update({ estado: 'Cerrada' }).eq('id', asambleaActiva.id);
      }

      const { data: nuevaAsamblea, error } = await supabase
        .from('asambleas_votaciones')
        .insert([{ 
          titulo: tituloNuevaAsamblea, 
          estado: 'Abierta', 
          sindicato_id: perfil.sindicato_id 
        }])
        .select()
        .single();
        
      if (error) throw error;

      const { data: socios } = await supabase.from('profiles').select('id').eq('sindicato_id', perfil.sindicato_id);
      if (socios && socios.length > 0) {
        const notificaciones = socios.map(s => ({
          user_id: s.id,
          sindicato_id: perfil.sindicato_id,
          titulo: '📢 Asamblea Oficial Iniciada',
          mensaje: `Se ha abierto el registro para: ${tituloNuevaAsamblea}. Ingresa para escanear el QR o unirte a la videollamada.`,
          tipo: 'asamblea',
          leido: false
        }));
        await supabase.from('notificaciones').insert(notificaciones);
      }

      setMostrarModalAsamblea(false);
      setTituloNuevaAsamblea('');
      fetchAsistenciaData();
      alert('✅ Asamblea iniciada exitosamente.');
      
    } catch (err: any) {
      alert(`❌ Error al iniciar asamblea: ${err.message}`);
    } finally {
      setIniciandoAsamblea(false);
    }
  };

  const handleCerrarAsamblea = async () => {
    if (!asambleaActiva) return;
    
    const confirm = window.confirm("¿Seguro que deseas dar por finalizada la asamblea actual? El QR dejará de funcionar.");
    if (!confirm) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('asambleas_votaciones')
      .update({ estado: 'Cerrada' })
      .eq('id', asambleaActiva.id);

    if (error) {
      alert(`❌ Error al cerrar asamblea: ${error.message}`);
    } else {
      fetchAsistenciaData();
      alert('✅ Asamblea finalizada con éxito.');
    }
  };

  const handleCheckInQR = async () => {
    if (!asambleaActiva || !perfil) return;
    setRegistrando(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('asistencia_asambleas')
      .select('*')
      .eq('asamblea_titulo', asambleaActiva.titulo)
      .eq('user_id', user.id)
      .maybeSingle();

    let errorObj = null;

    if (existing) {
      const { error } = await supabase.from('asistencia_asambleas').update({
        estado: 'Presente',
        fecha_asistencia: new Date().toISOString(),
        hora_salida: null
      }).eq('id', existing.id);
      errorObj = error;
    } else {
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
        alert('⚠️ Tu asistencia ya fue registrada exitosamente.');
      } else {
        alert(`❌ Error Supabase: ${errorObj.message}`);
      }
    } else {
      fetchAsistenciaData(); 
    }
  };

  const handleCheckOut = async () => {
    if (!asambleaActiva || !perfil) return;
    
    const confirmar = window.confirm("¿Estás seguro de que deseas marcar tu salida?");
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
    } else {
      fetchAsistenciaData(); 
    }
  };

  // DOMINIO DE PRODUCCIÓN OFICIAL Y RUTA LIMPIA
  const DOMINIO_OFICIAL = 'https://sindicato-py-c.vercel.app';
  
  const qrCheckInUrl = asambleaActiva && asambleaActiva.id
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${DOMINIO_OFICIAL}/asistencia/${asambleaActiva.id}`)}&color=0f172a&bgcolor=ffffff&margin=1`
    : 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SinAsambleaActiva&color=94a3b8&bgcolor=ffffff';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-blue-50/30 font-sans text-slate-900 pb-24 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo UI/UX */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/10 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full blur-[80px] pointer-events-none -ml-20 mb-10"></div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8 relative z-10">
        
        {/* Cabecera Principal */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-200/60 p-8 md:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           <div className="relative z-10 flex-1">
             <span className="bg-blue-500/10 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-xl mb-4 inline-block border border-blue-500/10">
               {isAdmin ? 'Panel Directivo Global' : 'Portal del Socio'}
             </span>
             <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
               Control de Asistencia y Quórum
             </h2>
             <p className="text-slate-500 max-w-2xl text-sm font-medium leading-relaxed">
               {isAdmin 
                 ? 'Gestión en tiempo real del quórum oficial, auditoría de asistencia y transmisión segura.' 
                 : 'Valida tu presencia escaneando el código QR oficial de la asamblea para habilitar tu acceso.'}
             </p>
           </div>
           
           <div className="w-full lg:w-auto shrink-0 relative z-10">
             <div className={`px-6 py-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${asambleaActiva ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 shadow-sm' : 'bg-slate-100/80 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-3xl animate-pulse">
                    {asambleaActiva ? '🟢' : '⏳'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70 mb-0.5">Estado de la Sesión</p>
                    <p className="text-base font-black tracking-tight">
                      {asambleaActiva ? 'Asamblea en Curso' : 'Sin Sesión Activa'}
                    </p>
                  </div>
                </div>
                
                {isAdmin && !asambleaActiva && (
                  <button 
                    onClick={() => setMostrarModalAsamblea(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5"
                  >
                    + Iniciar Asamblea
                  </button>
                )}

                {isAdmin && asambleaActiva && (
                  <button 
                    onClick={handleCerrarAsamblea}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-rose-500/25 text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5"
                  >
                    Cerrar Sesión Oficial
                  </button>
                )}
             </div>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tarjeta de Código QR o Check-in */}
          <motion.section initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-200/60 p-8 flex flex-col items-center text-center relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
              📷 {isAdmin ? 'Código QR Oficial' : 'Registro Digital'}
            </h3>
            
            {!asambleaActiva ? (
              <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-[2rem] p-10 w-full flex flex-col items-center justify-center min-h-[340px]">
                <span className="text-5xl mb-4 block opacity-40">🕰️</span>
                <p className="text-slate-700 font-black text-lg mb-2">Sala de Espera</p>
                <p className="text-sm text-slate-400 font-medium px-4">
                  {isAdmin 
                    ? 'Inicia una asamblea para habilitar dinámicamente el código QR de acceso.' 
                    : 'La directiva habilitará el código QR al dar inicio oficial a la asamblea.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 text-center w-full">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded text-blue-600 mb-1 block">Sesión Habilitada</span>
                  <h4 className="font-black text-slate-900 text-base leading-tight">{asambleaActiva.titulo}</h4>
                </div>

                <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.06)] w-fit mx-auto relative group">
                  <img src={qrCheckInUrl} alt="QR de Asistencia" className="w-56 h-56 rounded-2xl transition-transform group-hover:scale-105 duration-500" />
                  
                  <AnimatePresence>
                    {socioYaMarco && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-emerald-400 shadow-xl">
                         <span className="text-5xl mb-2">✅</span>
                         <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Presente</span>
                      </motion.div>
                    )}
                    {socioRetirado && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-slate-300 shadow-xl">
                         <span className="text-5xl mb-2">👋</span>
                         <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Salida Registrada</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isAdmin && (
                  <div className="w-full pt-2">
                    <p className="text-xs text-slate-500 font-medium mb-6 px-4">
                      {socioYaMarco 
                        ? 'Tu asistencia está confirmada. Si necesitas retirarte, utiliza el botón inferior.' 
                        : socioRetirado 
                        ? 'Has marcado tu salida de la sesión.'
                        : 'Escanea el código con tu celular o marca tu asistencia directamente aquí.'}
                    </p>
                    
                    {socioYaMarco ? (
                      <button 
                        onClick={handleCheckOut}
                        disabled={registrando}
                        className="w-full font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white shadow-sm"
                      >
                        {registrando ? 'Procesando...' : '👋 Marcar Salida Oficial'}
                      </button>
                    ) : (
                      <button 
                        onClick={handleCheckInQR}
                        disabled={registrando}
                        className="w-full font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
                      >
                        {registrando ? 'Verificando...' : socioRetirado ? '🔄 Reingresar a Sesión' : '✓ Registrar mi Asistencia'}
                      </button>
                    )}
                  </div>
                )}
                
                {isAdmin && (
                  <div className="w-full pt-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] text-center border-t border-slate-100 pt-5">
                      Proyecta este código en la pantalla
                    </p>
                    <button 
                       onClick={() => router.push('/asamblea')}
                       className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-900/20 text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 transform hover:-translate-y-0.5"
                    >
                      <span>🎥</span> Entrar a la Sala Virtual (Jitsi)
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.section>

          {/* Tarjeta de Quórum en Vivo / Historial Global */}
          <motion.section initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_35px_rgba(0,0,0,0.03)] border border-slate-200/60 p-8 flex flex-col overflow-hidden h-full min-h-[550px]">
            
            {isAdmin ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 text-lg">📊</span> 
                    Quórum en Vivo
                  </h3>
                  {asambleaActiva && (
                    <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md flex items-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presentes:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-400 leading-none">{presentesQuorum}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {asistenciasAsambleaActual.length} reg.</span>
                      </div>
                    </div>
                  )}
                </div>

                {!asambleaActiva ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-12 text-center">
                    <span className="text-6xl mb-6 block">📈</span>
                    <p className="text-slate-600 font-bold text-base">Inicia una asamblea para monitorear el quórum global.</p>
                  </div>
                ) : asistenciasAsambleaActual.length === 0 ? (
                  <div className="flex-1 bg-slate-50/80 border border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-4 block opacity-40">🪑</span>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Esperando registros de los socios...</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <table className="w-full text-left min-w-[450px]">
                        <thead className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                            <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Socio / Afiliado</th>
                            <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Hora de Ingreso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {asistenciasAsambleaActual.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 border border-blue-100">
                                    {(item.profiles?.full_name || 'U').charAt(0)}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 text-sm block group-hover:text-blue-600 transition-colors">
                                      {item.profiles?.full_name || 'Usuario Sindicato'}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-400">{item.usuario_rut}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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
                  <span className="p-2.5 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100 text-lg">📋</span> 
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Historial de Mis Asistencias</h3>
                </div>

                {asistencias.length === 0 ? (
                  <div className="flex-1 bg-slate-50/80 border border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-4 block opacity-40">📂</span>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Aún no cuentas con registros de asistencia.</p>
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
                          className="p-5 border border-slate-100 bg-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border mb-2 inline-block ${item.estado === 'Retirado' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              {item.estado === 'Retirado' ? 'Sesión Finalizada' : 'Asistencia Válida'}
                            </span>
                            <h4 className="font-black text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                              {item.asamblea_titulo}
                            </h4>
                          </div>
                          
                          <div className="shrink-0 text-left sm:text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full sm:w-auto">
                            <div className="flex justify-between sm:justify-end items-center gap-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso:</span>
                              <span className="text-xs font-black text-slate-700">
                                {new Date(item.fecha_asistencia).toLocaleString('es-CL', { 
                                  day: '2-digit', month: '2-digit', year: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            
                            {item.estado === 'Retirado' && item.hora_salida && (
                              <div className="flex justify-between sm:justify-end items-center gap-4 mt-2 pt-2 border-t border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salida:</span>
                                <span className="text-xs font-black text-rose-500">
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

      {/* Modal para Iniciar Asamblea */}
      {mostrarModalAsamblea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Iniciar Sesión Oficial</h3>
              <button onClick={() => setMostrarModalAsamblea(false)} className="text-slate-400 hover:text-slate-700 font-black text-lg">✕</button>
            </div>
            <form onSubmit={handleIniciarAsamblea} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Título de la Asamblea
                </label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  placeholder="Ej: Asamblea Ordinaria Octubre"
                  value={tituloNuevaAsamblea} 
                  onChange={e => setTituloNuevaAsamblea(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>
              <button 
                type="submit" 
                disabled={iniciandoAsamblea} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs"
              >
                {iniciandoAsamblea ? 'Creando registro...' : 'Abrir Asamblea y Generar QR'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}