'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function AdminPanel() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [validando, setValidando] = useState(true);

  // Estado del guardián de acceso
  const [accesoBloqueado, setAccesoBloqueado] = useState({ bloqueado: false, motivo: '' });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [idSindicatoActual, setIdSindicatoActual] = useState<number | null>(null);
  const [editNombreSindicato, setEditNombreSindicato] = useState('');
  const [editLogoSindicato, setEditLogoSindicato] = useState('');
  const [linkAsamblea, setLinkAsamblea] = useState('');
  const [guardandoSindicato, setGuardandoSindicato] = useState(false);

  const [tituloNoticia, setTituloNoticia] = useState('');
  const [contenidoNoticia, setContenidoNoticia] = useState('');
  const [loadingNoticia, setLoadingNoticia] = useState(false);

  const [tituloAsamblea, setTituloAsamblea] = useState('');
  const [loadingAsamblea, setLoadingAsamblea] = useState(false);

  // Estados para Historial y Asistencia de Asambleas con Auditoría en Tiempo Real
  const [historialAsambleas, setHistorialAsambleas] = useState<any[]>([]);
  const [asistenciaRegistros, setAsistenciaRegistros] = useState<any[]>([]);
  const [tituloNuevaAsamblea, setTituloNuevaAsamblea] = useState('');

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [encuestasData, setEncuestasData] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [fondoRecaudado, setFondoRecaudado] = useState(0); 
  const [loadingDatos, setLoadingDatos] = useState(true);

  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);
  const [detalleResolucion, setDetalleResolucion] = useState('');
  const [procesandoTicket, setProcesandoTicket] = useState(false);

  const [procesandoPostulacion, setProcesandoPostulacion] = useState<number | null>(null);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<any>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [ticketMenuAbiertoId, setTicketMenuAbiertoId] = useState<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      validarAccesoAdmin();
    }
  }, [isMounted]);

  // 🔥 NUEVO: SUSCRIPCIÓN EN TIEMPO REAL A LA ASISTENCIA
  useEffect(() => {
    if (!idSindicatoActual) return;

    const supabase = createClient();
    
    // Escuchar INSERTS o UPDATES en la tabla asistencia_asambleas
    const channel = supabase
      .channel('realtime-admin-asistencia')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha cualquier cambio (nuevos ingresos, retiros, etc.)
          schema: 'public',
          table: 'asistencia_asambleas',
          filter: `sindicato_id=eq.${idSindicatoActual}`
        },
        async (payload) => {
          console.log('¡Nuevo socio registrado en vivo!', payload);
          // Refrescamos los registros de asistencia en background para traer también sus perfiles (nombres)
          const { data: asistData } = await supabase
            .from('asistencia_asambleas')
            .select('*, profiles(full_name, rut)')
            .eq('sindicato_id', idSindicatoActual);
            
          if (Array.isArray(asistData)) {
            setAsistenciaRegistros(asistData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Limpiamos el canal al desmontar el componente
    };
  }, [idSindicatoActual]);

  const validarAccesoAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
      
      const estadoUsuario = String(profile?.estado || '').trim().toLowerCase();
      if (estadoUsuario === 'suspendido') {
        setAccesoBloqueado({ bloqueado: true, motivo: 'Tu cuenta de administrador ha sido suspendida individualmente.' });
        setValidando(false);
        return;
      }

      if (profile?.sindicato_id) {
        const { data: sindicatoData } = await supabase.from('sindicatos').select('estado').eq('id', profile.sindicato_id).single();
        const estadoSindicato = String(sindicatoData?.estado || '').trim().toLowerCase();
        if (estadoSindicato === 'suspendido') {
          setAccesoBloqueado({ bloqueado: true, motivo: 'El acceso administrativo de esta organización ha sido bloqueado.' });
          setValidando(false);
          return;
        }
      }

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
          const { data: sindicato } = await supabase.from('sindicatos').select('nombre, logo_url, link_asamblea').eq('id', profile.sindicato_id).single();
          if (sindicato) {
            setEditNombreSindicato(sindicato.nombre || '');
            setEditLogoSindicato(sindicato.logo_url || '');
            setLinkAsamblea(sindicato.link_asamblea || '');
          }

          const { data: usersData } = await supabase.from('profiles').select('*').eq('sindicato_id', profile.sindicato_id).order('created_at', { ascending: false });
          if (Array.isArray(usersData)) setUsuarios(usersData);

          const { data: ticketsData } = await supabase.from('tickets_soporte').select('*').eq('sindicato_id', profile.sindicato_id).order('created_at', { ascending: false });
          if (Array.isArray(ticketsData)) setTickets(ticketsData);

          const { data: encData } = await supabase.from('encuestas_clima').select('*').eq('sindicato_id', profile.sindicato_id);
          if (Array.isArray(encData)) setEncuestasData(encData);

          const { data: citasData } = await supabase.from('agenda_legal').select('*').eq('sindicato_id', profile.sindicato_id).order('fecha_reserva', { ascending: false });
          if (Array.isArray(citasData)) setCitas(citasData);

          const { data: postData } = await supabase.from('postulaciones').select('*').eq('sindicato_id', profile.sindicato_id).eq('estado', 'Pendiente').order('created_at', { ascending: false });
          if (Array.isArray(postData)) setPostulaciones(postData);

          const { data: aportesData } = await supabase.from('fondo_aportes').select('monto').eq('estado', 'Aprobado');
          if (aportesData) setFondoRecaudado(aportesData.reduce((sum, a) => sum + Number(a.monto), 0));

          const { data: histData } = await supabase.from('historial_asambleas').select('*').eq('sindicato_id', profile.sindicato_id).order('created_at', { ascending: false });
          if (Array.isArray(histData)) setHistorialAsambleas(histData);

          const { data: asistData } = await supabase.from('asistencia_asambleas').select('*, profiles(full_name, rut)').eq('sindicato_id', profile.sindicato_id);
          if (Array.isArray(asistData)) setAsistenciaRegistros(asistData);
        }
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingDatos(false);
    }
  };

  const guardarCambiosSindicato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSindicatoActual) return;
    setGuardandoSindicato(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sindicatos').update({
        nombre: editNombreSindicato,
        logo_url: editLogoSindicato.trim() !== '' ? editLogoSindicato.trim() : null,
        link_asamblea: linkAsamblea.trim() !== '' ? linkAsamblea.trim() : null
      }).eq('id', idSindicatoActual);

      if (error) throw error;
      alert('✅ Configuración y enlace de asamblea guardados exitosamente.');
    } catch (err: any) {
      alert('❌ Error al actualizar: ' + err.message);
    } finally {
      setGuardandoSindicato(false);
    }
  };

  const handleCrearAsambleaHistorica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNuevaAsamblea.trim()) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await supabase.from('historial_asambleas').insert([{
        titulo: tituloNuevaAsamblea,
        link_reunion: linkAsamblea,
        sindicato_id: idSindicatoActual,
        created_by: user.id,
        creador_nombre: adminProfile?.full_name || 'Administrador'
      }]);

      setTituloNuevaAsamblea('');
      fetchEnterpriseData();
      alert('✅ Asamblea registrada con auditoría de creador correctamente.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const notificarATodos = async (titulo: string, mensaje: string, tipo: string, enlace: string) => {
    const supabase = createClient();
    const { data: perfiles } = await supabase.from('profiles').select('id').eq('sindicato_id', idSindicatoActual);
    if (!perfiles) return;

    const notificaciones = perfiles.map(perfil => ({
      user_id: perfil.id, titulo, mensaje, tipo, enlace, leido: false
    }));

    await supabase.from('notificaciones').insert(notificaciones);
  };

  const handlePublicarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNoticia(true);
    try {
      const supabase = createClient();
      await supabase.from('comunicados').insert([{ titulo: tituloNoticia, contenido: contenidoNoticia, sindicato_id: idSindicatoActual }]);
      await notificarATodos('📢 Nuevo Comunicado', tituloNoticia, 'noticia', '/dashboard');
      setTituloNoticia(''); setContenidoNoticia('');
      fetchEnterpriseData();
      alert('📢 ¡Comunicado publicado y socios notificados!');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingNoticia(false); }
  };

  const handleAbrirAsamblea = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAsamblea(true);
    try {
      const supabase = createClient();
      await supabase.from('encuestas_clima').insert([{ 
        titulo: tituloAsamblea, categoria: 'Asamblea', opcion_a: 'A Favor', opcion_b: 'En Contra', votos_a: 0, votos_b: 0, sindicato_id: idSindicatoActual
      }]);
      await notificarATodos('🗳️ Nueva Votación Abierta', tituloAsamblea, 'asamblea', '/dashboard/encuestas');
      setTituloAsamblea('');
      fetchEnterpriseData();
      alert('🗳️ ¡Votación generada y socios notificados!');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingAsamblea(false); }
  };

  const handleCambiarRol = async (user: any) => {
    const rolActual = String(user.role || '').toLowerCase();
    const nuevoRol = (rolActual === 'admin' || rolActual === 'administrador') ? 'socio' : 'admin';
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ role: nuevoRol }).eq('id', user.id);
      if (!error) {
        setUsuarios(usuarios.map(u => (u.id === user.id) ? { ...u, role: nuevoRol } : u));
        alert(`✅ Rol actualizado a ${nuevoRol.toUpperCase()}`);
      } else alert('❌ Error: ' + error.message);
    } catch (err: any) { console.error(err); }
  };

  const handleEditarUsuario = (user: any) => {
    setUsuarioEnEdicion(user);
    setEditNombre(user.full_name || '');
    setEditRut(user.rut || '');
    setEditEmail(user.email || '');
  };

  const guardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoUsuario(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({
        full_name: editNombre, rut: editRut, email: editEmail
      }).eq('id', usuarioEnEdicion.id);

      if (!error) {
        setUsuarios(usuarios.map(u => (u.id === usuarioEnEdicion.id) ? { ...u, full_name: editNombre, rut: editRut, email: editEmail } : u));
        setUsuarioEnEdicion(null);
        alert('✅ Perfil actualizado exitosamente.');
      } else alert('❌ Error: ' + error.message);
    } catch (err: any) { console.error(err); } finally { setGuardandoUsuario(false); }
  };

  const handleEliminarUsuario = async (user: any) => {
    if (!window.confirm(`⚠️ ¿Deseas eliminar permanentemente a ${user.full_name || user.rut} del padrón?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (!error) {
        setUsuarios(usuarios.filter(u => u.id !== user.id));
        alert('✅ Usuario eliminado.');
      } else alert('❌ Error al eliminar: ' + error.message);
    } catch (err: any) { console.error(err); }
  };

  const abrirModalResolucion = (ticket: any) => {
    setTicketSeleccionado(ticket);
    setDetalleResolucion('');
  };

  const confirmarResolucionTicket = async () => {
    if (!detalleResolucion.trim()) return alert("Debes ingresar un detalle de resolución.");
    setProcesandoTicket(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: 'Resuelto' }).eq('id', ticketSeleccionado.id);

      if (!error) {
        setTickets(tickets.map(t => t.id === ticketSeleccionado.id ? { ...t, estado: 'Resuelto' } : t));
        alert(`✅ Ticket marcado como resuelto.`);
        setTicketSeleccionado(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcesandoTicket(false);
    }
  };

  const procesarPostulanteSupabase = async (postulacion: any) => {
    const supabase = createClient();
    const cleanRut = postulacion.rut.replace(/[^0-9kK]/g, '');
    const ultimosDigitos = cleanRut.length > 4 ? cleanRut.slice(-4) : '1234';
    const passwordTemporal = `Pyc${ultimosDigitos}.2026`;

    const { data: authData, error: authError } = await supabase.auth.signUp({ email: postulacion.email, password: passwordTemporal });
    if (authError) console.warn("Aviso Auth:", authError.message);

    if (authData?.user) {
       await supabase.from('profiles').upsert({ id: authData.user.id, rut: postulacion.rut, full_name: postulacion.full_name, email: postulacion.email, role: 'socio', sindicato_id: idSindicatoActual });
    } else {
       await supabase.from('profiles').upsert({ rut: postulacion.rut, full_name: postulacion.full_name, email: postulacion.email, role: 'socio', sindicato_id: idSindicatoActual }, { onConflict: 'rut' });
    }

    await supabase.from('postulaciones').update({ estado: 'Aprobada' }).eq('id', postulacion.id);
    return passwordTemporal; 
  };

  const handleAprobarPostulacion = async (postulacion: any) => {
    if (!window.confirm(`¿Aprobar al socio ${postulacion.full_name}?`)) return;
    setProcesandoPostulacion(postulacion.id);
    try {
      await procesarPostulanteSupabase(postulacion);
      setPostulaciones(postulaciones.filter(p => p.id !== postulacion.id));
      fetchEnterpriseData(); 
    } catch (err: any) { alert(`❌ Error: ${err.message}`); } finally { setProcesandoPostulacion(null); }
  };

  const handleRechazarPostulacion = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas rechazar y eliminar esta postulación?")) return;
    try {
      const supabase = createClient();
      await supabase.from('postulaciones').update({ estado: 'Rechazada' }).eq('id', id);
      setPostulaciones(postulaciones.filter(p => p.id !== id));
    } catch (err) {}
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

  const safeEncuestas = Array.isArray(encuestasData) ? encuestasData : [];
  const totalVotosEmitidos = safeEncuestas.reduce((sum, item) => sum + (item.votos_a || 0) + (item.votos_b || 0), 0);
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const ticketsPendientes = safeTickets.filter(t => t?.estado === 'Pendiente').length;
  const ticketsRevision = safeTickets.filter(t => t?.estado === 'En Revisión').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24 text-slate-900 relative overflow-hidden selection:bg-blue-500 selection:text-white" 
         onClick={() => { if (menuAbiertoId) setMenuAbiertoId(null); if (ticketMenuAbiertoId) setTicketMenuAbiertoId(null); }}>

      <div className="flex flex-col md:flex-row h-screen">

        {/* SIDEBAR ADMINISTRADOR LOCAL */}
        <aside className="w-full md:w-72 bg-gradient-to-b from-[#070b19] via-[#0f172a] to-[#1e293b] text-white flex flex-col shadow-2xl relative z-20 shrink-0 border-r border-white/5">
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                <span className="text-xl font-black">⚡</span>
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-base tracking-tight leading-tight truncate text-white">{editNombreSindicato || 'Sindicato'}</h1>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">Enterprise Admin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">📊</span> Resumen Operativo
            </button>
            <button onClick={() => setActiveTab('config')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">📹</span> Enlace de Asamblea
            </button>
            <button onClick={() => setActiveTab('historial')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'historial' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">📜</span> Historial Pro
            </button>
            <button onClick={() => setActiveTab('padron')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'padron' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">👥</span> Padrón & Postulantes
            </button>
            <button onClick={() => setActiveTab('soporte')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'soporte' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">🎧</span> Soporte y Citas
            </button>
            <button onClick={() => setActiveTab('comunicaciones')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'comunicaciones' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-base">📢</span> Avisos y Votos
            </button>
          </nav>

          <div className="p-6 border-t border-white/10 space-y-3 bg-black/20">
            <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              ⇦ Portal Socios
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-12">
          <div className="max-w-7xl mx-auto space-y-8 relative z-10">

            {/* TAB 1: DASHBOARD Y MÉTRICAS */}
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Mando Operativo</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Estadísticas en tiempo real de tu organización sindical.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col text-slate-800">
                    <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Socios</span>
                    <span className="text-4xl font-black">{loadingDatos ? '...' : usuarios.length}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col text-slate-800">
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Votos Emitidos</span>
                    <span className="text-4xl font-black">{loadingDatos ? '...' : totalVotosEmitidos}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col text-slate-800">
                    <span className="text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tickets Activos</span>
                    <span className="text-4xl font-black">{loadingDatos ? '...' : (ticketsPendientes + ticketsRevision)}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col text-slate-800">
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Citas Legales</span>
                    <span className="text-4xl font-black">{loadingDatos ? '...' : citas.length}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col text-slate-800">
                    <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Fondo Solidario</span>
                    <span className="text-3xl font-black">${loadingDatos ? '...' : fondoRecaudado.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONFIGURAR ENLACE DE ASAMBLEA */}
            {activeTab === 'config' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl space-y-6">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Asamblea Virtual</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Configura el enlace oficial de Google Meet, Zoom o Teams para los socios.</p>
                </header>

                <form onSubmit={guardarCambiosSindicato} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Enlace de Videollamada (Meet / Zoom / Teams)</label>
                    <input 
                      type="url" 
                      value={linkAsamblea} 
                      onChange={e => setLinkAsamblea(e.target.value)} 
                      placeholder="https://meet.google.com/abc-defg-hij" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                    />
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">Los socios que escaneen el código QR o entren a la sala de asamblea serán redirigidos automáticamente a este enlace.</p>
                  </div>

                  <button type="submit" disabled={guardandoSindicato} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30 transition-all">
                    {guardandoSindicato ? 'Guardando...' : 'Guardar Enlace Oficial'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: HISTORIAL PRO DE ASAMBLEAS Y AUDITORÍA EN TIEMPO REAL */}
            {activeTab === 'historial' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Historial Pro de Asambleas</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Auditoría formal de sesiones, creadores y concurrencia de socios en tiempo real.</p>
                  </div>
                </header>

                {/* Formulario para registrar asamblea */}
                <form onSubmit={handleCrearAsambleaHistorica} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                  <h3 className="text-lg font-black text-slate-800">Registrar Nueva Asamblea en el Historial</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      required 
                      value={tituloNuevaAsamblea} 
                      onChange={e => setTituloNuevaAsamblea(e.target.value)} 
                      placeholder="Ej: Asamblea Ordinaria de Negociación - Octubre 2026" 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30 transition-all shrink-0">
                      Registrar Sesión
                    </button>
                  </div>
                </form>

                {/* Listado de Asambleas con Auditoría Completa en Tiempo Real */}
                <div className="space-y-6">
                  {historialAsambleas.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-xl">
                      <span className="text-4xl block mb-2 opacity-40">📂</span>
                      <p className="text-slate-400 font-bold text-sm">No hay asambleas registradas en el historial aún.</p>
                    </div>
                  ) : (
                    historialAsambleas.map((asam) => {
                      const asistentesEstaAsamblea = asistenciaRegistros.filter(
                        (a) => a.asamblea_titulo?.trim().toLowerCase() === asam.titulo?.trim().toLowerCase()
                      );

                      const fechaCreacion = new Date(asam.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      });
                      const horaCreacion = new Date(asam.created_at).toLocaleTimeString('es-CL', {
                        hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <div key={asam.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 space-y-6">
                          
                          {/* Cabecera de la tarjeta */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-3.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                  📅 {fechaCreacion} a las {horaCreacion} hrs
                                </span>
                              </div>
                              <h3 className="text-2xl font-black text-slate-800 mt-1">{asam.titulo}</h3>
                            </div>
                            <span className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl text-xs font-black shadow-sm flex items-center gap-2">
                              👥 {asistentesEstaAsamblea.length} Socio(s) Concurrente(s)
                            </span>
                          </div>

                          {/* Detalle del Creador (Auditoría) */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0">
                              🛡️
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Creado y autorizado por</p>
                              <p className="text-sm font-black text-slate-800">{asam.creador_nombre || 'Administrador del Sindicato'}</p>
                            </div>
                          </div>

                          {/* Listado de Socios que interactuaron */}
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Socios que ingresaron / interactuaron:</h4>
                            {asistentesEstaAsamblea.length === 0 ? (
                              <p className="text-xs text-slate-400 italic bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-amber-700">
                                ⚠️ Ningún socio ha registrado asistencia todavía para esta sesión específica.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {asistentesEstaAsamblea.map((asist) => {
                                  const horaIngreso = new Date(asist.fecha_asistencia || asist.created_at).toLocaleTimeString('es-CL', {
                                    hour: '2-digit', minute: '2-digit'
                                  });
                                  return (
                                    <div key={asist.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
                                      <div>
                                        <span className="text-xs font-black text-slate-800 block truncate">{asist.profiles?.full_name || 'Socio'}</span>
                                        <span className="text-[11px] text-slate-500 font-bold mt-0.5">{asist.usuario_rut || 'Sin RUT'}</span>
                                      </div>
                                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                        <span className="text-slate-400 font-bold uppercase">Ingreso:</span>
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{horaIngreso} hrs</span>
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

            {/* TAB: PADRÓN Y POSTULANTES */}
            {activeTab === 'padron' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión del Padrón</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Aprueba nuevos ingresos y administra las cuentas exclusivas de tu organización.</p>
                </header>

                <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-rose-50/40 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">📥 Bandeja de Postulaciones</h3>
                      <p className="text-sm text-slate-500 mt-1">{postulaciones.length} solicitudes pendientes.</p>
                    </div>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                          <th className="p-5 pl-8">Postulante</th>
                          <th className="p-5">RUT</th>
                          <th className="p-5">Correo</th>
                          <th className="p-5 pr-8 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {postulaciones.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm font-medium">Bandeja vacía.</td></tr>
                        ) : (
                          postulaciones.map((post) => (
                            <tr key={post.id} className="hover:bg-rose-50/20 transition-colors">
                              <td className="p-5 pl-8 font-extrabold text-slate-800 text-sm">{post.full_name}</td>
                              <td className="p-5 text-sm font-bold text-slate-500">{post.rut}</td>
                              <td className="p-5 text-sm font-medium text-slate-600">{post.email}</td>
                              <td className="p-5 pr-8 text-right flex justify-end gap-2">
                                <button onClick={() => handleRechazarPostulacion(post.id)} className="text-xs font-bold text-slate-400 hover:text-red-600 px-3 py-2 rounded-lg transition-colors">Rechazar</button>
                                <button onClick={() => handleAprobarPostulacion(post)} disabled={procesandoPostulacion === post.id} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all">
                                  {procesandoPostulacion === post.id ? 'Aprobando...' : 'Aprobar'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800">🛡️ Cuentas Activas de la Organización</h3>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                          <th className="p-5 pl-8">Socio</th>
                          <th className="p-5">RUT / Correo</th>
                          <th className="p-5">Rol</th>
                          <th className="p-5 pr-8 text-right">Opciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {usuarios.map((user) => {
                          const isAdminLocal = ['admin', 'administrador'].includes(String(user.role || '').toLowerCase());
                          return (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 pl-8 font-extrabold text-slate-800 text-sm">{user.full_name || 'Sin nombre'}</td>
                              <td className="p-5 text-xs text-slate-500">
                                <span className="block font-bold text-slate-700">{user.rut}</span>
                                {user.email}
                              </td>
                              <td className="p-5">
                                <span className={`px-3.5 py-1.5 text-[9px] font-black uppercase rounded-full border ${isAdminLocal ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {isAdminLocal ? 'Admin' : 'Socio'}
                                </span>
                              </td>
                              <td className="p-5 pr-8 text-right relative">
                                <button onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === user.id ? null : user.id); }} className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                  ⋮
                                </button>
                                {menuAbiertoId === user.id && (
                                  <div className="absolute right-12 top-10 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 text-left animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                    <div className="p-2 space-y-1">
                                      <button onClick={() => { handleEditarUsuario(user); setMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl">✏️ Editar Perfil</button>
                                      <button onClick={() => { handleCambiarRol(user); setMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl">🔄 Cambiar Rol</button>
                                      <button onClick={() => { handleEliminarUsuario(user); setMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl">🗑️ Eliminar</button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* TAB: SOPORTE Y LEGAL */}
            {activeTab === 'soporte' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Soporte y Atención</h2>
                </header>

                <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-amber-50/40">
                    <h3 className="text-xl font-black text-slate-800">🎧 Tickets de Soporte</h3>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                          <th className="p-5 pl-8">Requerimiento</th>
                          <th className="p-5">Solicitante</th>
                          <th className="p-5">Estado</th>
                          <th className="p-5 pr-8 text-right">Opciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-5 pl-8">
                              <p className="font-extrabold text-slate-800 text-sm">{ticket.asunto}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="p-5 text-xs text-slate-500">
                              <span className="block font-bold text-slate-800">{ticket.nombre || 'Anónimo'}</span>
                              {ticket.rut}
                            </td>
                            <td className="p-5">
                              <span className={`px-3.5 py-1.5 text-[9px] font-black uppercase rounded-full border ${ticket.estado === 'Resuelto' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {ticket.estado}
                              </span>
                            </td>
                            <td className="p-5 pr-8 text-right">
                              {ticket.estado !== 'Resuelto' && (
                                <button onClick={() => abrirModalResolucion(ticket)} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all">Resolver ✓</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* TAB: COMUNICACIONES */}
            {activeTab === 'comunicaciones' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Comunicación Oficial</h2>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-800 mb-6">📢 Avisos y Comunicados</h3>
                    <form onSubmit={handlePublicarNoticia} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título</label>
                        <input type="text" required value={tituloNoticia} onChange={e => setTituloNoticia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mensaje</label>
                        <textarea required rows={4} value={contenidoNoticia} onChange={e => setContenidoNoticia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button type="submit" disabled={loadingNoticia} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg">
                        {loadingNoticia ? 'Publicando...' : 'Publicar y Notificar'}
                      </button>
                    </form>
                  </section>

                  <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-800 mb-6">🗳️ Apertura de Votaciones</h3>
                    <form onSubmit={handleAbrirAsamblea} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materia a Votar</label>
                        <input type="text" required value={tituloAsamblea} onChange={e => setTituloAsamblea(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <button type="submit" disabled={loadingAsamblea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg">
                        {loadingAsamblea ? 'Abriendo...' : 'Abrir Votación'}
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL DE RESOLUCIÓN DE TICKETS */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setTicketSeleccionado(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-800">Resolver Ticket</h3>
              <button onClick={() => setTicketSeleccionado(null)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{ticketSeleccionado.asunto}</p>
              <textarea 
                rows={4} 
                value={detalleResolucion} 
                onChange={e => setDetalleResolucion(e.target.value)} 
                placeholder="Escribe el detalle de resolución..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500"
              />
              <button 
                onClick={confirmarResolucionTicket} 
                disabled={procesandoTicket} 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all"
              >
                {procesandoTicket ? 'Procesando...' : 'Marcar como Resuelto ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE PERFIL */}
      {usuarioEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setUsuarioEnEdicion(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-800">Editar Perfil</h3>
              <button onClick={() => setUsuarioEnEdicion(null)} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={guardarEdicionUsuario} className="space-y-4">
              <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="Nombre" />
              <input type="text" value={editRut} onChange={e => setEditRut(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="RUT" />
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="Email" />
              <button type="submit" disabled={guardandoUsuario} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg">{guardandoUsuario ? 'Guardando...' : 'Guardar Perfil'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}