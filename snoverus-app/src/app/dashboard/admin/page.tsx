'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import emailjs from '@emailjs/browser';

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
  const [guardandoSindicato, setGuardandoSindicato] = useState(false);

  const [tituloNoticia, setTituloNoticia] = useState('');
  const [contenidoNoticia, setContenidoNoticia] = useState('');
  const [loadingNoticia, setLoadingNoticia] = useState(false);

  const [tituloAsamblea, setTituloAsamblea] = useState('');
  const [loadingAsamblea, setLoadingAsamblea] = useState(false);

  const [actaTitulo, setActaTitulo] = useState('');
  const [actaTipo, setActaTipo] = useState('Ordinaria');
  const [actaFecha, setActaFecha] = useState('');
  const [actaResumen, setActaResumen] = useState('');
  const [actaArchivo, setActaArchivo] = useState<File | null>(null);
  const [loadingActa, setLoadingActa] = useState(false);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [encuestasData, setEncuestasData] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [fondoRecaudado, setFondoRecaudado] = useState(0); 
  const [metaFondo, setMetaFondo] = useState(1000000); 
  const [negociacionesArchivadas, setNegociacionesArchivadas] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);
  const [detalleResolucion, setDetalleResolucion] = useState('');
  const [procesandoTicket, setProcesandoTicket] = useState(false);

  const [procesandoPostulacion, setProcesandoPostulacion] = useState<number | null>(null);
  const [procesandoTodas, setProcesandoTodas] = useState(false);

  const [ticketEnEdicion, setTicketEnEdicion] = useState<any>(null);
  const [editTicketAsunto, setEditTicketAsunto] = useState('');
  const [editTicketDescripcion, setEditTicketDescripcion] = useState('');
  const [guardandoTicket, setGuardandoTicket] = useState(false);

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

  const validarAccesoAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Validar estado individual del Usuario Admin
      const { data: profile } = await supabase.from('profiles').select('sindicato_id, role, estado').eq('id', user.id).single();
      
      if (profile?.estado?.toLowerCase() === 'suspendido') {
        setAccesoBloqueado({ bloqueado: true, motivo: 'Tu cuenta de administrador ha sido suspendida individualmente por Superadmin.' });
        setValidando(false);
        return;
      }

      if (profile?.sindicato_id) {
        // 2. Validar estado global de su Sindicato
        const { data: sindicatoData } = await supabase.from('sindicatos').select('estado').eq('id', profile.sindicato_id).single();
        if (sindicatoData?.estado?.toLowerCase() === 'suspendido') {
          setAccesoBloqueado({ bloqueado: true, motivo: 'El acceso administrativo de esta organización ha sido bloqueado globalmente.' });
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
          const { data: sindicato } = await supabase.from('sindicatos').select('nombre, logo_url').eq('id', profile.sindicato_id).single();
          if (sindicato) {
            setEditNombreSindicato(sindicato.nombre || '');
            setEditLogoSindicato(sindicato.logo_url || '');
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

          const { data: metaData } = await supabase.from('fondo_meta').select('monto_meta').eq('id', 1).single();
          if (metaData) setMetaFondo(metaData.monto_meta);

          const { data: negData } = await supabase.from('negociacion_info').select(`*, hitos_negociacion (*)`).eq('estado', 'Archivada').order('id', { ascending: false });
          if (Array.isArray(negData)) setNegociacionesArchivadas(negData);
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
        logo_url: editLogoSindicato.trim() !== '' ? editLogoSindicato.trim() : null
      }).eq('id', idSindicatoActual);

      if (error) throw error;
      alert('✅ Cambios guardados. Se reflejarán instantáneamente.');
    } catch (err: any) {
      alert('❌ Error al actualizar el sindicato: ' + err.message);
    } finally {
      setGuardandoSindicato(false);
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

  const handleSubirActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actaArchivo) return alert("⚠️ Selecciona un archivo PDF.");
    setLoadingActa(true);
    try {
      const supabase = createClient();
      const fileExt = actaArchivo.name.split('.').pop();
      const fileName = `${Date.now()}_acta.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('actas').upload(fileName, actaArchivo);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('actas').getPublicUrl(fileName);
      await supabase.from('libro_actas').insert([{ titulo: actaTitulo, tipo_asamblea: actaTipo, fecha_reunion: actaFecha || new Date().toISOString().split('T')[0], resumen_acuerdos: actaResumen, url_acta_pdf: publicUrl, sindicato_id: idSindicatoActual }]);
      await notificarATodos('📜 Nueva Acta Publicada', `Se ha subido el documento: ${actaTitulo}`, 'acta', '/dashboard/actas');
      setActaTitulo(''); setActaTipo('Ordinaria'); setActaFecha(''); setActaResumen(''); setActaArchivo(null);
      fetchEnterpriseData();
      alert('📜 ¡Acta subida y socios notificados!');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingActa(false); }
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

  const handleActualizarCita = async (id: number, nuevoEstado: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('agenda_legal').update({ estado: nuevoEstado }).eq('id', id);
      if (!error) setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    } catch (err: any) {}
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

    const templateParams = {
      to_email: postulacion.email,
      rutUsuario: postulacion.full_name,
      tipo: 'Aprobación de Membresía',
      asunto: '¡Bienvenido a la Organización!',
      mensaje: `Hola ${postulacion.full_name},\n\nTu postulación ha sido aprobada por la directiva.\n\nRUT: ${postulacion.rut}\nContraseña: ${passwordTemporal}\n\nTe recomendamos cambiar tu contraseña en tu primer ingreso.`
    };

    try { await emailjs.send('service_thw7gfn', 'template_93ch74j', templateParams, 'GG3tS19diXKenuD_-'); } catch (emailErr) {}

    if (postulacion.telefono) {
      try {
        const textoMensaje = `*POSTULACIÓN APROBADA*\n\n¡Hola ${postulacion.full_name}! Tu solicitud ha sido aceptada.\n\nTus credenciales:\n*RUT:* ${postulacion.rut}\n*Clave Temporal:* ${passwordTemporal}`;
        await fetch('http://localhost:3001/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefono: postulacion.telefono, mensaje: textoMensaje }) });
      } catch (wspErr) {}
    }
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

  const handleAprobarTodas = async () => {
    if (!window.confirm(`¿Aprobar masivamente a los ${postulaciones.length} postulantes pendientes?`)) return;
    setProcesandoTodas(true);
    let aprobados = 0, errores = 0;
    for (const post of postulaciones) {
      try { await procesarPostulanteSupabase(post); aprobados++; } catch (err) { errores++; }
    }
    alert(`Proceso masivo finalizado.\n✅ Aprobados: ${aprobados}\n❌ Errores: ${errores}`);
    setProcesandoTodas(false);
    fetchEnterpriseData();
  };

  const handleRechazarPostulacion = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas rechazar y eliminar esta postulación?")) return;
    try {
      const supabase = createClient();
      await supabase.from('postulaciones').update({ estado: 'Rechazada' }).eq('id', id);
      setPostulaciones(postulaciones.filter(p => p.id !== id));
    } catch (err) {}
  };

  const abrirModalResolucion = (ticket: any) => {
    setTicketSeleccionado(ticket);
    setDetalleResolucion('');
  };

  const handleEditarTicket = (ticket: any) => {
    setTicketEnEdicion(ticket);
    setEditTicketAsunto(ticket.asunto || '');
    setEditTicketDescripcion(ticket.descripcion || '');
  };

  const guardarEdicionTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoTicket(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({
        asunto: editTicketAsunto, descripcion: editTicketDescripcion
      }).eq('id', ticketEnEdicion.id);

      if (!error) {
        setTickets(tickets.map(t => (t.id === ticketEnEdicion.id) ? { ...t, asunto: editTicketAsunto, descripcion: editTicketDescripcion } : t));
        setTicketEnEdicion(null);
      } else alert('❌ Error: ' + error.message);
    } catch (err: any) { alert('❌ Excepción: ' + err.message); } finally { setGuardandoTicket(false); }
  };

  const handleEliminarTicket = async (id: string | number) => {
    if (!window.confirm("⚠️ ¿Deseas ELIMINAR este ticket permanentemente?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').delete().eq('id', id);
      if (!error) setTickets(tickets.filter(t => t.id !== id));
    } catch (err: any) { console.error(err); }
  };

  const handleActualizarEstadoTicket = async (id: string | number, nuevoEstado: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: nuevoEstado }).eq('id', id);
      if (!error) setTickets(tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    } catch (err: any) {}
  };

  const confirmarResolucionTicket = async () => {
    if (!detalleResolucion.trim()) return alert("Debes ingresar un detalle de resolución.");
    const usuarioAsociado = usuarios.find(u => u.id === ticketSeleccionado.user_id || u.rut === ticketSeleccionado.rut);
    let correoDestino = ticketSeleccionado.email || usuarioAsociado?.email;
    const nombreDestino = usuarioAsociado?.full_name || ticketSeleccionado.nombre || 'Socio Anónimo';

    if (!correoDestino || correoDestino === 'No especificado') {
      const correoManual = window.prompt("⚠️ Ingresa el correo del socio manualmente para notificarle:");
      if (!correoManual || !correoManual.trim()) return alert("❌ Operación cancelada.");
      correoDestino = correoManual.trim();
    }

    setProcesandoTicket(true);
    try {
      const templateParams = { to_email: correoDestino.trim(), rutUsuario: nombreDestino, tipo: 'Resolución', asunto: ticketSeleccionado.asunto, mensaje: detalleResolucion };
      await emailjs.send('service_thw7gfn', 'template_93ch74j', templateParams, 'GG3tS19diXKenuD_-');

      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: 'Resuelto' }).eq('id', ticketSeleccionado.id);

      if (!error) {
        setTickets(tickets.map(t => t.id === ticketSeleccionado.id ? { ...t, estado: 'Resuelto' } : t));
        alert(`✅ Correo enviado y ticket marcado como resuelto.`);
        setTicketSeleccionado(null);
      }
    } catch (err: any) {} finally { setProcesandoTicket(false); }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "sb-sindicato-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
  };

  if (!isMounted || validando) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO PARA ADMINS
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
  const asambleas = safeEncuestas.filter(e => e.opcion_a === 'A Favor' || e.categoria === 'Asamblea');
  const asambleaA = asambleas.reduce((sum, item) => sum + (item.votos_a || 0), 0);
  const asambleaB = asambleas.reduce((sum, item) => sum + (item.votos_b || 0), 0);
  const asambleaTotal = asambleaA + asambleaB;
  const pctFavor = asambleaTotal === 0 ? 0 : (asambleaA / asambleaTotal) * 100;
  const pctContra = asambleaTotal === 0 ? 0 : (asambleaB / asambleaTotal) * 100;

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const ticketsPendientes = safeTickets.filter(t => t?.estado === 'Pendiente').length;
  const ticketsRevision = safeTickets.filter(t => t?.estado === 'En Revisión').length;

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'Resuelto': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'En Revisión': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
      case 'Confirmada': return 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30';
      case 'Rechazada': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-200 text-slate-700 border-slate-300'; 
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans pb-24 text-slate-900 selection:bg-blue-300 relative overflow-hidden" 
         onClick={() => { if (menuAbiertoId) setMenuAbiertoId(null); if (ticketMenuAbiertoId) setTicketMenuAbiertoId(null); }}>

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-[150px] translate-x-1/3 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row h-screen">

        {/* SIDEBAR ADMINISTRADOR LOCAL */}
        <aside className="w-full md:w-72 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white flex flex-col shadow-2xl relative z-20 shrink-0">
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-xl font-black">⚙️</span>
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight leading-none truncate w-40">{editNombreSindicato || 'Sindicato'}</h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Panel de Control</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-lg">📊</span> Resumen Operativo
            </button>
            <button onClick={() => setActiveTab('padron')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'padron' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-lg">👥</span> Padrón & Postulantes
            </button>
            <button onClick={() => setActiveTab('soporte')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'soporte' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-lg">🎧</span> Soporte y Citas Legales
            </button>
            <button onClick={() => setActiveTab('comunicaciones')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'comunicaciones' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-lg">📢</span> Avisos, Votos y Actas
            </button>
          </nav>

          <div className="p-6 border-t border-white/10 space-y-3">
            <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              ⇦ Portal Socios
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20">
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-10">
          <div className="max-w-7xl mx-auto space-y-8 relative z-10">

            {/* TAB 1: DASHBOARD Y MÉTRICAS */}
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Mando Operativo</h2>
                  <p className="text-slate-500 font-medium">Estadísticas en tiempo real de tu organización.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden text-slate-800">
                    <span className="text-blue-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Total Socios</span>
                    <span className="text-5xl font-black">{loadingDatos ? '...' : usuarios.length}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden text-slate-800">
                    <span className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Votos Emitidos</span>
                    <span className="text-5xl font-black">{loadingDatos ? '...' : totalVotosEmitidos}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden text-slate-800">
                    <span className="text-amber-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Tickets Activos</span>
                    <span className="text-5xl font-black">{loadingDatos ? '...' : (ticketsPendientes + ticketsRevision)}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden text-slate-800">
                    <span className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Citas Legales</span>
                    <span className="text-5xl font-black">{loadingDatos ? '...' : citas.length}</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden text-slate-800">
                    <span className="text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Fondo Solidario</span>
                    <span className="text-4xl font-black">${loadingDatos ? '...' : fondoRecaudado.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link href="/dashboard/admin/beneficios" className="group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎁</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Convenios</h3>
                      <p className="text-xs text-slate-500 font-medium">Alianzas y beneficios</p>
                    </div>
                  </Link>
                  <button onClick={() => setActiveTab('padron')} className="text-left group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Directorio</h3>
                      <p className="text-xs text-slate-500 font-medium">Visión del padrón</p>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('soporte')} className="text-left group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-amber-500/20 hover:-translate-y-1 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎧</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Ayuda Pro</h3>
                      <p className="text-xs text-slate-500 font-medium">Chat y resolución</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PADRÓN Y POSTULACIONES AISLADOS */}
            {activeTab === 'padron' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión del Padrón</h2>
                  <p className="text-slate-500 font-medium">Aprueba nuevos ingresos y administra las cuentas exclusivas de tu organización.</p>
                </header>

                <section className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-rose-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">📥 Bandeja de Postulaciones</h3>
                      <p className="text-sm text-slate-500 mt-1">{postulaciones.length} solicitudes pendientes.</p>
                    </div>
                    {postulaciones.length > 0 && (
                      <button onClick={handleAprobarTodas} disabled={procesandoTodas} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all">
                        {procesandoTodas ? 'Procesando...' : '✅ Aprobar Todas'}
                      </button>
                    )}
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
                            <tr key={post.id} className="hover:bg-rose-50/30 transition-colors">
                              <td className="p-5 pl-8 font-extrabold text-slate-800 text-sm">{post.full_name}</td>
                              <td className="p-5 text-sm font-bold text-slate-500">{post.rut}</td>
                              <td className="p-5 text-sm font-medium text-slate-600">{post.email}</td>
                              <td className="p-5 pr-8 text-right flex justify-end gap-2">
                                <button onClick={() => handleRechazarPostulacion(post.id)} className="text-xs font-bold text-slate-400 hover:text-red-600 px-3 py-2 rounded-lg">Rechazar</button>
                                <button onClick={() => handleAprobarPostulacion(post)} disabled={procesandoPostulacion === post.id} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-md">
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

                <section className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">🛡️ Cuentas Activas de la Organización</h3>
                    </div>
                  </div>
                  <div className="p-2 overflow-x-auto" style={{ minHeight: '300px' }}>
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
                        {usuarios.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400">Cargando padrón local...</td></tr>
                        ) : (
                          usuarios.map((user) => {
                            const rolUsuarioLocal = String(user.role || '').toLowerCase();
                            const isAdminLocal = rolUsuarioLocal === 'admin' || rolUsuarioLocal === 'administrador';
                            return (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-5 pl-8 font-extrabold text-slate-800 text-sm">{user.full_name || 'Sin nombre'}</td>
                                <td className="p-5 text-xs text-slate-500">
                                  <span className="block font-bold text-slate-700">{user.rut}</span>
                                  {user.email}
                                </td>
                                <td className="p-5">
                                  <span className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-full border ${isAdminLocal ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {isAdminLocal ? 'Admin' : 'Socio'}
                                  </span>
                                </td>
                                <td className="p-5 pr-8 text-right relative">
                                  <button onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === user.id ? null : user.id); setTicketMenuAbiertoId(null); }} className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                  </button>
                                  {menuAbiertoId === user.id && (
                                    <div className="absolute right-12 top-10 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 text-left animate-fade-in-up" onClick={e => e.stopPropagation()}>
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
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* TAB 4: SOPORTE Y LEGAL */}
            {activeTab === 'soporte' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Soporte y Atención</h2>
                  <p className="text-slate-500 font-medium">Requerimientos de la mesa de ayuda y agendamiento legal.</p>
                </header>

                <section className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-visible">
                  <div className="p-8 border-b border-slate-100 bg-amber-50/50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">🎧 Tickets de Soporte</h3>
                  </div>
                  <div className="p-2 overflow-x-auto" style={{ minHeight: '200px' }}>
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
                        {tickets.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400">Sin tickets locales.</td></tr>
                        ) : (
                          tickets.map((ticket) => {
                            const infoSolicitante = usuarios.find(u => u.id === ticket.user_id || u.rut === ticket.rut || u.email === ticket.email);
                            return (
                              <tr key={ticket.id} className="hover:bg-amber-50/20 transition-colors">
                                <td className="p-5 pl-8">
                                  <p className="font-extrabold text-slate-800 text-sm">{ticket.asunto}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="p-5 text-xs text-slate-500">
                                  <span className="block font-bold text-slate-800">{infoSolicitante?.full_name || ticket.nombre || 'Anónimo'}</span>
                                  {ticket.rut || infoSolicitante?.rut}
                                </td>
                                <td className="p-5">
                                  <span className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-full border ${ticket.estado === 'Resuelto' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {ticket.estado}
                                  </span>
                                </td>
                                <td className="p-5 pr-8 text-right relative">
                                  <button onClick={(e) => { e.stopPropagation(); setTicketMenuAbiertoId(ticketMenuAbiertoId === ticket.id ? null : ticket.id); setMenuAbiertoId(null); }} className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                  </button>
                                  {ticketMenuAbiertoId === ticket.id && (
                                    <div className="absolute right-12 top-10 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 text-left" onClick={e => e.stopPropagation()}>
                                      <div className="p-2 space-y-1">
                                        {ticket.estado !== 'Resuelto' && <button onClick={() => { abrirModalResolucion(ticket); setTicketMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 rounded-xl">✅ Resolver y Notificar</button>}
                                        <button onClick={() => { handleEditarTicket(ticket); setTicketMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl">✏️ Editar Contenido</button>
                                        <button onClick={() => { handleEliminarTicket(ticket.id); setTicketMenuAbiertoId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl">🗑️ Eliminar</button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-indigo-50/50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">⚖️ Citas Legales</h3>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                          <th className="p-5 pl-8">Motivo</th>
                          <th className="p-5">Socio</th>
                          <th className="p-5">Estado</th>
                          <th className="p-5 pr-8 text-right">Opciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {citas.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400">Sin citas agendadas.</td></tr>
                        ) : (
                          citas.map((cita) => (
                            <tr key={cita.id} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="p-5 pl-8">
                                <p className="font-extrabold text-slate-800 text-sm">{cita.motivo}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{cita.fecha_reserva}</p>
                              </td>
                              <td className="p-5 text-xs text-slate-500 font-bold">{cita.email || cita.rut}</td>
                              <td className="p-5">
                                <span className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-full border ${cita.estado === 'Pendiente' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>{cita.estado}</span>
                              </td>
                              <td className="p-5 pr-8 text-right">
                                {cita.estado === 'Pendiente' ? (
                                  <button onClick={() => handleActualizarCita(cita.id, 'Confirmada')} className="text-xs font-black bg-white border border-slate-200 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-xl transition-all shadow-sm">Confirmar ✓</button>
                                ) : <span className="text-xs font-bold text-slate-400">Gestionada</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* TAB 5: COMUNICACIONES Y ACTAS */}
            {activeTab === 'comunicaciones' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Comunicación Oficial</h2>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">📢 Avisos y Comunicados</h3>
                    <form onSubmit={handlePublicarNoticia} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título</label>
                        <input type="text" required value={tituloNoticia} onChange={e => setTituloNoticia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mensaje</label>
                        <textarea required rows={4} value={contenidoNoticia} onChange={e => setContenidoNoticia(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                      </div>
                      <button type="submit" disabled={loadingNoticia} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all text-sm uppercase">
                        {loadingNoticia ? 'Publicando...' : 'Publicar y Notificar'}
                      </button>
                    </form>
                  </section>

                  <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">🗳️ Apertura de Votaciones</h3>
                    <form onSubmit={handleAbrirAsamblea} className="space-y-5 flex-1 flex flex-col">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Materia a Votar</label>
                        <input type="text" required value={tituloAsamblea} onChange={e => setTituloAsamblea(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                      </div>
                      <button type="submit" disabled={loadingAsamblea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all text-sm uppercase mt-auto">
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

      {/* --- MODALES --- */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setTicketSeleccionado(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div><h3 className="text-xl font-black text-slate-800">Resolver Ticket</h3></div>
              <button onClick={() => setTicketSeleccionado(null)} className="font-bold text-slate-500">✕</button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-blue-50 p-4 rounded-xl">{ticketSeleccionado.asunto}</p>
              <textarea rows={4} value={detalleResolucion} onChange={e => setDetalleResolucion(e.target.value)} placeholder="Resolución..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm outline-none resize-none"></textarea>
              <button onClick={confirmarResolucionTicket} disabled={procesandoTicket} className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl">{procesandoTicket ? 'Procesando...' : 'Resolver y Notificar ✉️'}</button>
            </div>
          </div>
        </div>
      )}

      {usuarioEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setUsuarioEnEdicion(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div><h3 className="text-xl font-black text-slate-800">Editar Perfil</h3></div>
              <button onClick={() => setUsuarioEnEdicion(null)} className="font-bold text-slate-500">✕</button>
            </div>
            <form onSubmit={guardarEdicionUsuario} className="p-8 space-y-5">
              <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="Nombre" />
              <input type="text" value={editRut} onChange={e => setEditRut(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="RUT" />
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="Email" />
              <button type="submit" disabled={guardandoUsuario} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl">{guardandoUsuario ? 'Guardando...' : 'Guardar Perfil'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}