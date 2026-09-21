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

  // Estados para Identidad y Tenant del Sindicato Actual
  const [idSindicatoActual, setIdSindicatoActual] = useState<number | null>(null);
  const [editNombreSindicato, setEditNombreSindicato] = useState('');
  const [editLogoSindicato, setEditLogoSindicato] = useState('');
  const [guardandoSindicato, setGuardandoSindicato] = useState(false);

  // Estados para Formularios
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

  // Estados para Datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [encuestasData, setEncuestasData] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  
  // Estados del Fondo Solidario y Negociaciones Archivadas
  const [fondoRecaudado, setFondoRecaudado] = useState(0); 
  const [metaFondo, setMetaFondo] = useState(1000000); 
  const [negociacionesArchivadas, setNegociacionesArchivadas] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // Estados para Modal de Resolución de Ticket
  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);
  const [detalleResolucion, setDetalleResolucion] = useState('');
  const [procesandoTicket, setProcesandoTicket] = useState(false);

  // Estado para procesar postulaciones
  const [procesandoPostulacion, setProcesandoPostulacion] = useState<number | null>(null);
  const [procesandoTodas, setProcesandoTodas] = useState(false);

  // Estados para Modal de Edición de Ticket
  const [ticketEnEdicion, setTicketEnEdicion] = useState<any>(null);
  const [editTicketAsunto, setEditTicketAsunto] = useState('');
  const [editTicketDescripcion, setEditTicketDescripcion] = useState('');
  const [guardandoTicket, setGuardandoTicket] = useState(false);

  // Estados para Modal de Edición de Usuario
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<any>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  // Estados para los Menús Flotantes
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
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      const rolUsuario = String(data?.role || '').trim().toLowerCase();
      
      if (rolUsuario === 'superadmin' || rolUsuario === 'admin' || rolUsuario === 'administrador' || rolUsuario === 'directiva') {
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
        }
      }
      
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (Array.isArray(usersData)) setUsuarios(usersData);
      
      const { data: ticketsData } = await supabase.from('tickets_soporte').select('*').order('created_at', { ascending: false });
      if (Array.isArray(ticketsData)) setTickets(ticketsData);
      
      const { data: encData } = await supabase.from('encuestas_clima').select('*');
      if (Array.isArray(encData)) setEncuestasData(encData);
      
      const { data: citasData } = await supabase.from('agenda_legal').select('*').order('fecha_reserva', { ascending: false });
      if (Array.isArray(citasData)) setCitas(citasData);

      const { data: postData } = await supabase.from('postulaciones').select('*').eq('estado', 'Pendiente').order('created_at', { ascending: false });
      if (Array.isArray(postData)) setPostulaciones(postData);

      const { data: aportesData } = await supabase.from('fondo_aportes').select('monto').eq('estado', 'Aprobado');
      if (aportesData) setFondoRecaudado(aportesData.reduce((sum, a) => sum + Number(a.monto), 0));

      const { data: metaData } = await supabase.from('fondo_meta').select('monto_meta').eq('id', 1).single();
      if (metaData) setMetaFondo(metaData.monto_meta);

      const { data: negData } = await supabase
        .from('negociacion_info')
        .select(`*, hitos_negociacion (*)`)
        .eq('estado', 'Archivada')
        .order('id', { ascending: false });
        
      if (Array.isArray(negData)) setNegociacionesArchivadas(negData);

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
        logo_url: editLogoSindicato.trim() !== '' ? editLogoSindicato.trim() : '/logopyf.jpeg'
      }).eq('id', idSindicatoActual);

      if (error) throw error;
      alert('✅ Identidad visual actualizada. Los socios verán el cambio en tiempo real.');
    } catch (err: any) {
      alert('❌ Error al actualizar el sindicato: ' + err.message);
    } finally {
      setGuardandoSindicato(false);
    }
  };

  const notificarATodos = async (titulo: string, mensaje: string, tipo: string, enlace: string) => {
    const supabase = createClient();
    const { data: perfiles } = await supabase.from('profiles').select('id');
    if (!perfiles) return;

    const notificaciones = perfiles.map(perfil => ({
      user_id: perfil.id,
      titulo: titulo,
      mensaje: mensaje,
      tipo: tipo,
      enlace: enlace,
      leido: false
    }));

    await supabase.from('notificaciones').insert(notificaciones);
  };

  const handlePublicarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNoticia(true);
    try {
      const supabase = createClient();
      await supabase.from('comunicados').insert([{ titulo: tituloNoticia, contenido: contenidoNoticia }]);
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
        titulo: tituloAsamblea, 
        categoria: 'Asamblea',
        opcion_a: 'A Favor',
        opcion_b: 'En Contra',
        votos_a: 0,
        votos_b: 0
      }]);
      await notificarATodos('🗳️ Nueva Votación Abierta', tituloAsamblea, 'asamblea', '/dashboard/encuestas');
      setTituloAsamblea('');
      fetchEnterpriseData();
      alert('🗳️ ¡Votación generada correctamente en el módulo de Encuestas y socios notificados!');
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
      await supabase.from('libro_actas').insert([{ titulo: actaTitulo, tipo_asamblea: actaTipo, fecha_reunion: actaFecha || new Date().toISOString().split('T')[0], resumen_acuerdos: actaResumen, url_acta_pdf: publicUrl }]);
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
        alert(`✅ Rol actualizado exitosamente a ${nuevoRol.toUpperCase()}`);
      } else alert('❌ Error de Supabase: ' + error.message);
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
        full_name: editNombre,
        rut: editRut,
        email: editEmail
      }).eq('id', usuarioEnEdicion.id);

      if (!error) {
        setUsuarios(usuarios.map(u => (u.id === usuarioEnEdicion.id) ? { ...u, full_name: editNombre, rut: editRut, email: editEmail } : u));
        setUsuarioEnEdicion(null);
        alert('✅ Perfil actualizado exitosamente.');
      } else alert('❌ Error al actualizar perfil: ' + error.message);
    } catch (err: any) { console.error(err); } finally { setGuardandoUsuario(false); }
  };

  const handleEliminarUsuario = async (user: any) => {
    if (!window.confirm(`⚠️ ESTÁS A PUNTO DE ELIMINAR UN SOCIO\n\n¿Estás seguro de que deseas eliminar permanentemente a ${user.full_name || user.rut} del padrón?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (!error) {
        setUsuarios(usuarios.filter(u => u.id !== user.id));
        alert('✅ Usuario eliminado correctamente del padrón.');
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

  // 🚀 PROCESAMIENTO AUTOMATIZADO CORE (Supabase + EmailJS + WhatsApp Web.js Local)
  const procesarPostulanteSupabase = async (postulacion: any) => {
    const supabase = createClient();
    const cleanRut = postulacion.rut.replace(/[^0-9kK]/g, '');
    const ultimosDigitos = cleanRut.length > 4 ? cleanRut.slice(-4) : '1234';
    const passwordTemporal = `Pyc${ultimosDigitos}.2026`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: postulacion.email,
      password: passwordTemporal,
    });

    if (authError) {
      console.warn("Aviso Auth:", authError.message);
    }

    if (authData?.user) {
       await supabase.from('profiles').upsert({
         id: authData.user.id,
         rut: postulacion.rut,
         full_name: postulacion.full_name,
         email: postulacion.email,
         role: 'socio',
         sindicato_id: idSindicatoActual
       });
    } else {
       await supabase.from('profiles').upsert({
         rut: postulacion.rut,
         full_name: postulacion.full_name,
         email: postulacion.email,
         role: 'socio',
         sindicato_id: idSindicatoActual
       }, { onConflict: 'rut' });
    }

    await supabase.from('postulaciones').update({ estado: 'Aprobada' }).eq('id', postulacion.id);

    // 1. Envío automatizado de correo (EmailJS)
    const templateParams = {
      to_email: postulacion.email,
      rutUsuario: postulacion.full_name,
      tipo: 'Aprobación de Membresía',
      asunto: '¡Bienvenido a la Organización!',
      mensaje: `Hola ${postulacion.full_name},\n\nTu postulación ha sido aprobada por la directiva.\n\nPuedes acceder al portal con las siguientes credenciales:\n\nRUT: ${postulacion.rut}\nContraseña: ${passwordTemporal}\n\nTe recomendamos cambiar tu contraseña en tu primer ingreso.`
    };

    try {
      await emailjs.send('service_thw7gfn', 'template_93ch74j', templateParams, 'GG3tS19diXKenuD_-');
    } catch (emailErr) {
      console.error("Fallo de EmailJS:", emailErr);
    }

    // 2. Envío 100% automatizado por WhatsApp (A través de nuestra propia API whatsapp-web.js local)
    if (postulacion.telefono) {
      try {
        const textoMensaje = `*SINDICATO: POSTULACIÓN APROBADA*\n\n¡Hola ${postulacion.full_name}! Tu solicitud ha sido aceptada.\n\nTus credenciales:\n*RUT:* ${postulacion.rut}\n*Clave Temporal:* ${passwordTemporal}\n\nIngresa al portal y cambia tu clave en el primer inicio.`;

        // Llamamos al servidor Node.js que está corriendo en paralelo en el puerto 3001
        await fetch('http://localhost:3001/api/enviar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono: postulacion.telefono,
            mensaje: textoMensaje
          })
        });
      } catch (wspErr) {
        console.error("Fallo automatizando WhatsApp con servidor local:", wspErr);
      }
    }

    return passwordTemporal; 
  };

  const handleAprobarPostulacion = async (postulacion: any) => {
    if (!window.confirm(`¿Aprobar al socio ${postulacion.full_name}?\n\nSe crearán sus credenciales, se enviará el correo electrónico y la notificación automatizada por WhatsApp mediante el servidor local.`)) return;

    setProcesandoPostulacion(postulacion.id);
    try {
      await procesarPostulanteSupabase(postulacion);
      setPostulaciones(postulaciones.filter(p => p.id !== postulacion.id));
      alert(`✅ Socio ${postulacion.full_name} aprobado y notificado con éxito.`);
      fetchEnterpriseData(); 
    } catch (err: any) {
      alert(`❌ Error durante la aprobación: ${err.message}`);
    } finally {
      setProcesandoPostulacion(null);
    }
  };

  const handleAprobarTodas = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas APROBAR de forma masiva a los ${postulaciones.length} postulantes pendientes?\n\nSe enviarán notificaciones por correo electrónico y WhatsApp a todos.`)) return;

    setProcesandoTodas(true);
    let aprobados = 0;
    let errores = 0;

    for (const post of postulaciones) {
      try {
        await procesarPostulanteSupabase(post);
        aprobados++;
      } catch (err) {
        errores++;
      }
    }

    alert(`Proceso masivo finalizado.\n✅ Aprobados y notificados: ${aprobados}\n❌ Errores: ${errores}`);
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
        asunto: editTicketAsunto,
        descripcion: editTicketDescripcion
      }).eq('id', ticketEnEdicion.id);

      if (!error) {
        setTickets(tickets.map(t => (t.id === ticketEnEdicion.id) ? { ...t, asunto: editTicketAsunto, descripcion: editTicketDescripcion } : t));
        setTicketEnEdicion(null);
        alert('✅ Ticket actualizado exitosamente.');
      } else alert('❌ Error al actualizar ticket: ' + error.message);
    } catch (err: any) { alert('❌ Excepción: ' + err.message); } finally { setGuardandoTicket(false); }
  };

  const handleEliminarTicket = async (id: string | number) => {
    if (!window.confirm("⚠️ ¿Estás seguro de que deseas ELIMINAR este ticket permanentemente?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').delete().eq('id', id);
      if (!error) setTickets(tickets.filter(t => t.id !== id));
      else alert("❌ Error al eliminar el ticket: " + error.message);
    } catch (err: any) { console.error(err); }
  };

  const handleActualizarEstadoTicket = async (id: string | number, nuevoEstado: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: nuevoEstado }).eq('id', id);
      if (!error) setTickets(tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
      else alert("❌ Error al cambiar el estado: " + error.message);
    } catch (err: any) { console.error(err); }
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
      const templateParams = { to_email: correoDestino.trim(), rutUsuario: nombreDestino, tipo: 'Resolución de Directiva', asunto: ticketSeleccionado.asunto, mensaje: detalleResolucion };
      await emailjs.send('service_thw7gfn', 'template_93ch74j', templateParams, 'GG3tS19diXKenuD_-');

      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: 'Resuelto' }).eq('id', ticketSeleccionado.id);
      
      if (!error) {
        setTickets(tickets.map(t => t.id === ticketSeleccionado.id ? { ...t, estado: 'Resuelto' } : t));
        alert(`✅ Correo enviado y ticket marcado como resuelto.`);
        setTicketSeleccionado(null);
      } else alert("⚠️ El correo se envió al socio, pero hubo un error en Supabase: " + error.message);
    } catch (err: any) {
      alert("❌ Error al enviar el correo. Revisa la consola.");
    } finally {
      setProcesandoTicket(false);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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

      <div className="p-6 md:p-10 relative z-10">
        
        {/* HEADER PREMIUM */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 p-8 md:p-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto relative overflow-hidden border border-slate-700/50">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                Panel Directiva
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight mb-2">
              {editNombreSindicato || 'SINDICATO'}
            </h1>
            <p className="text-sm font-medium text-blue-200/80 uppercase tracking-widest">Centro de Mando Operativo</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto relative z-10">
            <Link href="/dashboard" className="flex-1 md:flex-none text-center px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-sm font-bold transition-all backdrop-blur-md">
              ← Portal Socios
            </Link>
            <button onClick={handleLogout} className="flex-1 md:flex-none text-center px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl text-sm font-bold hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-600/30 border border-red-500/50">
              Cerrar Sesión
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto space-y-12">
          
          {/* MÓDULOS DE GESTIÓN INTERACTIVOS */}
          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Navegación Rápida
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Link href="/dashboard/admin/beneficios" className="group bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform text-white">🎁</div>
                  <h3 className="text-xl font-black text-slate-800 mb-3">Convenios</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Administra la red de beneficios, descuentos y alianzas para los socios.</p>
                </div>
              </Link>
              <Link href="/dashboard/admin/socios" className="group bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform text-white">👥</div>
                  <h3 className="text-xl font-black text-slate-800 mb-3">Padrón de Socios</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Visualiza el registro, valida credenciales y gestiona perfiles de trabajadores.</p>
                </div>
              </Link>
              <Link href="/dashboard/admin/soporte" className="group bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform text-white">🎧</div>
                  <h3 className="text-xl font-black text-slate-800 mb-3">Mesa de Ayuda</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Panel central para resolver solicitudes, consultas y reclamos laborales.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* MÉTRICAS PRINCIPALES VIBRANTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2rem] shadow-xl shadow-blue-900/20 flex flex-col relative overflow-hidden text-white border border-blue-500/30 hover:scale-[1.02] transition-transform">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <span className="text-blue-200 text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">Total Socios</span>
              <span className="text-5xl font-black relative z-10">{loadingDatos ? '...' : usuarios.length}</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[2rem] shadow-xl shadow-emerald-900/20 flex flex-col relative overflow-hidden text-white border border-emerald-400/30 hover:scale-[1.02] transition-transform">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <span className="text-emerald-100 text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">Votos Emitidos</span>
              <span className="text-5xl font-black relative z-10">{loadingDatos ? '...' : totalVotosEmitidos}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2rem] shadow-xl shadow-amber-900/20 flex flex-col relative overflow-hidden text-white border border-amber-400/30 hover:scale-[1.02] transition-transform">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <span className="text-amber-100 text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">Tickets Activos</span>
              <span className="text-5xl font-black relative z-10">{loadingDatos ? '...' : (ticketsPendientes + ticketsRevision)}</span>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-800 p-8 rounded-[2rem] shadow-xl shadow-indigo-900/20 flex flex-col relative overflow-hidden text-white border border-indigo-400/30 hover:scale-[1.02] transition-transform">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <span className="text-indigo-200 text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">Citas Legales</span>
              <span className="text-5xl font-black relative z-10">{loadingDatos ? '...' : citas.length}</span>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 rounded-[2rem] shadow-xl shadow-rose-900/20 flex flex-col relative overflow-hidden text-white border border-rose-400/30 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push('/dashboard/solidario')}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <span className="text-rose-100 text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">Fondo Solidario</span>
              <span className="text-4xl font-black relative z-10">${loadingDatos ? '...' : fondoRecaudado.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* === SECCIÓN DE IDENTIDAD DEL SINDICATO === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/30 text-xl">🎨</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Identidad de la Organización</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Personaliza el nombre y logo de esta instancia. Los cambios se reflejarán en tiempo real en la barra superior.</p>
              </div>
            </div>
            <form onSubmit={guardarCambiosSindicato} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Oficial</label>
                <input type="text" required value={editNombreSindicato} onChange={e => setEditNombreSindicato(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL del Logo</label>
                <input type="url" value={editLogoSindicato} onChange={e => setEditLogoSindicato(e.target.value)} placeholder="https://..." className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium text-slate-700" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" disabled={guardandoSindicato} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 text-sm tracking-wide">
                  {guardandoSindicato ? 'Guardando...' : 'Guardar Cambios Visuales'}
                </button>
              </div>
            </form>
          </section>

          {/* === SECCIÓN DE BANDEJA DE POSTULACIONES === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden relative">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-rose-600 text-white p-3 rounded-xl shadow-md text-xl shadow-rose-500/30">📥</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Bandeja de Postulaciones</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Nuevos trabajadores solicitando ingresar al sindicato.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                  {postulaciones.length} Pendientes
                </span>
                {postulaciones.length > 0 && (
                  <button 
                    onClick={handleAprobarTodas}
                    disabled={procesandoTodas}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {procesandoTodas ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Procesando...
                      </>
                    ) : (
                      '✅ Aprobar Todas'
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="p-5 pl-8">Postulante</th>
                    <th className="p-5">RUT</th>
                    <th className="p-5">Correo Electrónico</th>
                    <th className="p-5 pr-8 text-right">Acción Requerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {postulaciones.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm font-medium">No hay postulaciones pendientes de revisión.</td></tr>
                  ) : (
                    postulaciones.map((post) => (
                      <tr key={post.id} className="hover:bg-rose-50/40 transition-colors group">
                        <td className="p-5 pl-8 font-extrabold text-slate-800 text-sm">{post.full_name}</td>
                        <td className="p-5 text-sm font-bold text-slate-500">{post.rut}</td>
                        <td className="p-5 text-sm font-medium text-slate-600">{post.email}</td>
                        <td className="p-5 pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleRechazarPostulacion(post.id)}
                              className="text-xs font-bold text-slate-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Rechazar
                            </button>
                            <button 
                              onClick={() => handleAprobarPostulacion(post)}
                              disabled={procesandoPostulacion === post.id || procesandoTodas}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
                            >
                              {procesandoPostulacion === post.id ? 'Creando...' : 'Aprobar Ingreso'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ACCIONES Y FORMULARIOS MODERNIZADOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 text-xl">📢</div>
                <h3 className="text-xl font-black text-slate-800">Noticias</h3>
              </div>
              <form onSubmit={handlePublicarNoticia} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título del Aviso</label>
                  <input type="text" required value={tituloNoticia} onChange={(e) => setTituloNoticia(e.target.value)} placeholder="Ej: Asamblea Extraordinaria" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contenido</label>
                  <textarea required rows={3} value={contenidoNoticia} onChange={(e) => setContenidoNoticia(e.target.value)} placeholder="Escribe los detalles..." className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium resize-none"></textarea>
                </div>
                <button type="submit" disabled={loadingNoticia} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 text-sm tracking-wide mt-2">
                  {loadingNoticia ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </form>
            </section>

            <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3 rounded-xl shadow-lg shadow-amber-500/30 text-xl">🗳️</div>
                <h3 className="text-xl font-black text-slate-800">Votaciones</h3>
              </div>
              <form onSubmit={handleAbrirAsamblea} className="space-y-5 flex flex-col h-full justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Materia de Votación</label>
                  <input type="text" required value={tituloAsamblea} onChange={(e) => setTituloAsamblea(e.target.value)} placeholder="Ej: Aprobación de Presupuesto" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium" />
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mt-4 mb-6 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Estado Actual Global</p>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2"><span className="text-emerald-400">A Favor</span><span className="text-white">{pctFavor.toFixed(0)}%</span></div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${pctFavor}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2"><span className="text-red-400">En Contra</span><span className="text-white">{pctContra.toFixed(0)}%</span></div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full" style={{ width: `${pctContra}%` }}></div></div>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loadingAsamblea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 text-sm tracking-wide mt-auto">
                  {loadingAsamblea ? 'Abriendo...' : 'Abrir Nueva Votación'}
                </button>
              </form>
            </section>

            <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-3 rounded-xl shadow-lg shadow-purple-500/30 text-xl">📜</div>
                <h3 className="text-xl font-black text-slate-800">Libro de Actas</h3>
              </div>
              <form onSubmit={handleSubirActa} className="space-y-4 flex flex-col h-full justify-between">
                <div>
                  <input type="text" required value={actaTitulo} onChange={(e) => setActaTitulo(e.target.value)} placeholder="Título del Acta Oficial" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required value={actaFecha} onChange={(e) => setActaFecha(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-medium" />
                  <select value={actaTipo} onChange={(e) => setActaTipo(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-medium">
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                    <option value="Directorio">Directorio</option>
                  </select>
                </div>
                <div>
                  <input type="text" required value={actaResumen} onChange={(e) => setActaResumen(e.target.value)} placeholder="Resumen corto de Acuerdos" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all font-medium" />
                </div>
                <div className="mt-2">
                  <input type="file" accept="application/pdf" required onChange={(e) => setActaArchivo(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl p-1.5 transition-all" />
                </div>
                <button type="submit" disabled={loadingActa} className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/25 text-sm tracking-wide mt-4">
                  {loadingActa ? 'Subiendo PDF...' : 'Subir Acta al Servidor'}
                </button>
              </form>
            </section>
          </div>
          
          {/* === SECCIÓN DE NEGOCIACIONES ARCHIVADAS === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-visible">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex items-center justify-between rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-3 rounded-xl shadow-md text-xl">🗃️</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Historial de Negociaciones Colectivas</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Registro completo y detallado de procesos legales finalizados.</p>
                </div>
              </div>
              <span className="bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-rose-200 shadow-sm">{negociacionesArchivadas.length} Archivadas</span>
            </div>

            <div className="p-8">
              {negociacionesArchivadas.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3 block opacity-30">📁</span>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay procesos de negociación archivados en el sistema.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {negociacionesArchivadas.map((neg) => {
                    const sortedHitos = neg.hitos_negociacion ? [...neg.hitos_negociacion].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) : [];
                    return (
                      <div key={neg.id} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                          <div>
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{neg.titulo}</h4>
                            <p className="text-sm text-slate-500 font-medium mt-1">{neg.descripcion}</p>
                          </div>
                          {neg.petitorio_url && (
                            <a href={neg.petitorio_url} target="_blank" rel="noopener noreferrer" className="bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0">
                              📄 Ver Petitorio
                            </a>
                          )}
                        </div>

                        {sortedHitos.length > 0 ? (
                          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cronograma de Eventos Transcurridos</p>
                            <div className="space-y-4">
                              {sortedHitos.map((hito, idx) => (
                                <div key={hito.id} className="flex gap-4 items-start relative">
                                  {idx !== sortedHitos.length - 1 && <div className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-slate-200"></div>}
                                  <div className="w-5 h-5 rounded-full bg-white border-4 border-rose-400 mt-0.5 shrink-0 relative z-10 shadow-sm"></div>
                                  <div className="flex-1 pb-2">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h5 className="text-sm font-bold text-slate-800">{hito.titulo}</h5>
                                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">{hito.estado}</span>
                                      <span className="text-[10px] font-bold text-slate-400 ml-auto">{new Date(hito.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium">{hito.descripcion}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-bold italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">Sin hitos registrados para este proceso.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* === SECCIÓN DE GESTIÓN DE ROLES === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-visible">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md text-xl">🛡️</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Control de Accesos y Padrón</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Administra los perfiles, asigna privilegios directivos y gestiona las cuentas.</p>
                </div>
              </div>
            </div>
            
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="p-5 pl-8">Socio Registrado</th>
                    <th className="p-5">Contacto / RUT</th>
                    <th className="p-5">Nivel de Acceso</th>
                    <th className="p-5 pr-8 text-right">Opciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usuarios.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm font-medium">Cargando padrón de usuarios...</td></tr>
                  ) : (
                    usuarios.map((user, idx) => {
                      const rolUsuario = String(user.role || '').toLowerCase();
                      const isAdminUser = rolUsuario === 'admin' || rolUsuario === 'administrador';
                      const nombreMostrado = user.full_name || 'Socio sin nombre';
                      const iniciales = nombreMostrado.substring(0, 2).toUpperCase();

                      return (
                        <tr key={user.id || user.rut || idx} className="hover:bg-blue-50/40 transition-colors group relative">
                          <td className="p-5 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/30 shrink-0">
                                {iniciales}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                  {nombreMostrado}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-xs text-slate-500 font-medium">
                            <span className="block text-slate-800 font-bold text-sm mb-0.5">{user.rut}</span>
                            {user.email || 'Sin correo registrado'}
                          </td>
                          <td className="p-5">
                            <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${isAdminUser ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm shadow-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {isAdminUser ? 'Administrador' : 'Socio'}
                            </span>
                          </td>
                          
                          {/* MENÚ DE ACCIONES (TRES PUNTITOS USUARIO) */}
                          <td className="p-5 pr-8 text-right relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuAbiertoId(menuAbiertoId === user.id ? null : user.id);
                                setTicketMenuAbiertoId(null);
                              }}
                              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                            </button>

                            {/* DROPDOWN FLOTANTE USUARIO */}
                            {menuAbiertoId === user.id && (
                              <div 
                                className="absolute right-12 top-10 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 text-left animate-fade-in-up"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="p-2 space-y-1">
                                  <button 
                                    onClick={() => { handleEditarUsuario(user); setMenuAbiertoId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-lg">✏️</span> Editar Perfil
                                  </button>
                                  <button 
                                    onClick={() => { handleCambiarRol(user); setMenuAbiertoId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-lg">🔄</span> Hacer {isAdminUser ? 'Socio' : 'Admin'}
                                  </button>
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button 
                                    onClick={() => { handleEliminarUsuario(user); setMenuAbiertoId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-lg">🗑️</span> Eliminar Cuenta
                                  </button>
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

          {/* === SECCIÓN DE MESA DE AYUDA (FORMATO TABLA) === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-visible">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md text-xl">🎧</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Mesa de Ayuda</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Gestiona los requerimientos, consultas y reclamos de los socios.</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-600 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-amber-200 shadow-sm shadow-amber-100">{ticketsPendientes} Pendientes</span>
            </div>
            
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="p-5 pl-8">Asunto del Ticket</th>
                    <th className="p-5">Solicitante</th>
                    <th className="p-5">Estado</th>
                    <th className="p-5 pr-8 text-right">Opciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tickets.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm font-medium">Bandeja de tickets impecable.</td></tr>
                  ) : (
                    tickets.map((ticket, idx) => {
                      const infoSolicitante = usuarios.find(u => u.id === ticket.user_id || u.rut === ticket.rut || u.email === ticket.email);
                      const nombreSolicitante = infoSolicitante?.full_name || ticket.nombre || 'Socio Anónimo';
                      const correoDestino = ticket.email || infoSolicitante?.email || 'No especificado';
                      const rutSolicitante = ticket.rut || infoSolicitante?.rut || 'Sin RUT';

                      return (
                        <tr key={ticket.id || idx} className="hover:bg-blue-50/40 transition-colors group relative">
                          <td className="p-5 pl-8">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 flex items-center justify-center font-black text-xs shadow-md shrink-0">
                                🎫
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                  {ticket.asunto}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-1">{ticket.descripcion}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-xs text-slate-500 font-medium align-top">
                            <span className="block text-slate-800 font-bold text-sm mb-0.5">{nombreSolicitante}</span>
                            <span className="block">{rutSolicitante}</span>
                            <span className="text-blue-600">{correoDestino}</span>
                          </td>
                          <td className="p-5 align-top">
                            <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getBadgeStyle(ticket.estado)}`}>
                              {ticket.estado}
                            </span>
                          </td>
                          
                          {/* MENÚ DE ACCIONES (TRES PUNTITOS TICKET) */}
                          <td className="p-5 pr-8 text-right relative align-top">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTicketMenuAbiertoId(ticketMenuAbiertoId === ticket.id ? null : ticket.id);
                                setMenuAbiertoId(null);
                              }}
                              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                            </button>

                            {/* DROPDOWN FLOTANTE TICKET */}
                            {ticketMenuAbiertoId === ticket.id && (
                              <div 
                                className="absolute right-12 top-10 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 text-left animate-fade-in-up"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="p-2 space-y-1">
                                  {ticket.estado !== 'Resuelto' && (
                                    <button 
                                      onClick={() => { abrirModalResolucion(ticket); setTicketMenuAbiertoId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-lg">✅</span> Resolver y Notificar
                                    </button>
                                  )}
                                  {ticket.estado === 'Resuelto' && (
                                    <button 
                                      onClick={() => { handleActualizarEstadoTicket(ticket.id, 'Pendiente'); setTicketMenuAbiertoId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-lg">🔄</span> Reabrir Ticket
                                    </button>
                                  )}
                                  {ticket.estado === 'Pendiente' && (
                                    <button 
                                      onClick={() => { handleActualizarEstadoTicket(ticket.id, 'En Revisión'); setTicketMenuAbiertoId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-lg">👀</span> Marcar en Revisión
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => { handleEditarTicket(ticket); setTicketMenuAbiertoId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-lg">✏️</span> Editar Contenido
                                  </button>
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button 
                                    onClick={() => { handleEliminarTicket(ticket.id); setTicketMenuAbiertoId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                                  >
                                    <span className="text-lg">🗑️</span> Eliminar Ticket
                                  </button>
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

          {/* === SECCIÓN DE AGENDA LEGAL (FORMATO TABLA) === */}
          <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-visible">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md text-xl">⚖️</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Agenda Legal</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Revisa y confirma las solicitudes de asesoría jurídica.</p>
                </div>
              </div>
              <span className="bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-indigo-200 shadow-sm shadow-indigo-100">{citas.filter(c => c.estado === 'Pendiente').length} Solicitudes</span>
            </div>
            
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="p-5 pl-8">Motivo de Asesoría</th>
                    <th className="p-5">Solicitante</th>
                    <th className="p-5">Estado</th>
                    <th className="p-5 pr-8 text-right">Opciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {citas.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm font-medium">No hay citas agendadas.</td></tr>
                  ) : (
                    citas.map((cita, idx) => {
                      const infoSolicitante = usuarios.find(u => u.rut === cita.rut || u.email === cita.email);
                      const nombreSolicitante = infoSolicitante?.full_name || cita.email || cita.rut || 'Socio Anónimo';

                      return (
                        <tr key={cita.id || idx} className="hover:bg-indigo-50/40 transition-colors group relative">
                          <td className="p-5 pl-8">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-black text-xs shadow-md shrink-0">
                                📅
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                  {cita.motivo}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                  {cita.fecha_reserva}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-xs text-slate-500 font-medium align-top">
                            <span className="block text-slate-800 font-bold text-sm mb-0.5">{nombreSolicitante}</span>
                          </td>
                          <td className="p-5 align-top">
                            <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getBadgeStyle(cita.estado)}`}>
                              {cita.estado}
                            </span>
                          </td>
                          <td className="p-5 pr-8 text-right align-top">
                            {cita.estado === 'Pendiente' ? (
                              <button onClick={() => handleActualizarCita(cita.id, 'Confirmada')} className="text-xs font-black bg-white border border-slate-200 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white text-slate-600 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                Confirmar ✓
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">Gestionada</span>
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

        </main>
      </div>

      {/* MODAL DE RESOLUCIÓN DE TICKET */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setTicketSeleccionado(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Resolver Ticket</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Notificación por correo al socio</p>
              </div>
              <button onClick={() => setTicketSeleccionado(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-slate-500">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <span className="block text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Asunto del Socio</span>
                <p className="font-bold text-slate-700 text-sm">{ticketSeleccionado.asunto}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detalle de la Resolución (Se enviará por correo)</label>
                <textarea 
                  rows={4} 
                  value={detalleResolucion} 
                  onChange={(e) => setDetalleResolucion(e.target.value)} 
                  placeholder="Estimado socio, le informamos que hemos resuelto su problema..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium resize-none"
                ></textarea>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setTicketSeleccionado(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={confirmarResolucionTicket} disabled={procesandoTicket} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 text-sm flex justify-center items-center gap-2">
                {procesandoTicket ? 'Procesando...' : 'Resolver y Notificar ✉️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE TICKET */}
      {ticketEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setTicketEnEdicion(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Editar Ticket</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Corrigiendo datos del requerimiento</p>
              </div>
              <button onClick={() => setTicketEnEdicion(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-slate-500">✕</button>
            </div>
            
            <form onSubmit={guardarEdicionTicket} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asunto del Ticket</label>
                <input 
                  type="text" 
                  value={editTicketAsunto} 
                  onChange={(e) => setEditTicketAsunto(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción</label>
                <textarea 
                  rows={4}
                  value={editTicketDescripcion} 
                  onChange={(e) => setEditTicketDescripcion(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700 resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setTicketEnEdicion(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoTicket} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm">
                  {guardandoTicket ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE USUARIO */}
      {usuarioEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setUsuarioEnEdicion(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Editar Perfil</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Modificando datos del socio</p>
              </div>
              <button onClick={() => setUsuarioEnEdicion(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-slate-500">✕</button>
            </div>
            
            <form onSubmit={guardarEdicionUsuario} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={editNombre} 
                  onChange={(e) => setEditNombre(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">RUT</label>
                <input 
                  type="text" 
                  value={editRut} 
                  onChange={(e) => setEditRut(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setUsuarioEnEdicion(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoUsuario} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm">
                  {guardandoUsuario ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}