'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function AdminPanel() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Estados para Formularios
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [contenidoNoticia, setContenidoNoticia] = useState('');
  const [loadingNoticia, setLoadingNoticia] = useState(false);

  const [tituloAsamblea, setTituloAsamblea] = useState('');
  const [loadingAsamblea, setLoadingAsamblea] = useState(false);

  // Estados para Archivo PDF del Acta
  const [actaTitulo, setActaTitulo] = useState('');
  const [actaTipo, setActaTipo] = useState('Ordinaria');
  const [actaFecha, setActaFecha] = useState('');
  const [actaResumen, setActaResumen] = useState('');
  const [actaArchivo, setActaArchivo] = useState<File | null>(null);
  const [loadingActa, setLoadingActa] = useState(false);

  // Estados para Datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [votos, setVotos] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchEnterpriseData = async () => {
    try {
      const supabase = createClient();
      
      // 1. Consultamos la tabla 'profiles' asegurando traer la columna 'role'
      const { data: usersData, error: userError } = await supabase
        .from('profiles')
        .select('id, rut, email, full_name, role, created_at')
        .order('created_at', { ascending: false });
        
      if (!userError && Array.isArray(usersData)) {
        setUsuarios(usersData);
      }
      
      const { data: ticketsData } = await supabase.from('tickets_soporte').select('*').order('created_at', { ascending: false });
      if (Array.isArray(ticketsData)) setTickets(ticketsData);
      
      const { data: votosData } = await supabase.from('votos_registrados').select('*');
      if (Array.isArray(votosData)) setVotos(votosData);
      
      const { data: citasData } = await supabase.from('agenda_legal').select('*').order('fecha_reserva', { ascending: false });
      if (Array.isArray(citasData)) setCitas(citasData);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingDatos(false);
    }
  };

  useEffect(() => {
    if (isMounted) fetchEnterpriseData();
  }, [isMounted]);

  const handlePublicarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNoticia(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('comunicados').insert([{ titulo: tituloNoticia, contenido: contenidoNoticia }]);
      if (!error) {
        alert('📢 ¡Comunicado publicado con éxito!');
        setTituloNoticia(''); setContenidoNoticia('');
        fetchEnterpriseData();
      }
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingNoticia(false); }
  };

  const handleAbrirAsamblea = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAsamblea(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('asambleas_votaciones').insert([{ titulo: tituloAsamblea, estado: 'Abierta' }]);
      if (!error) {
        alert('🗳️ ¡Asamblea abierta!');
        setTituloAsamblea('');
        fetchEnterpriseData();
      }
    } catch (err: any) { alert('Error: ' + err.message); } finally { setLoadingAsamblea(false); }
  };

  const handleSubirActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actaArchivo) {
      alert("⚠️ Por favor, selecciona un archivo PDF para el acta.");
      return;
    }
    
    setLoadingActa(true);
    try {
      const supabase = createClient();
      const fileExt = actaArchivo.name.split('.').pop();
      const fileName = `${Date.now()}_acta.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('actas')
        .upload(fileName, actaArchivo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('actas')
        .getPublicUrl(fileName);

      const { error } = await supabase.from('libro_actas').insert([{
        titulo: actaTitulo,
        tipo_asamblea: actaTipo,
        fecha_reunion: actaFecha || new Date().toISOString().split('T')[0],
        resumen_acuerdos: actaResumen,
        url_acta_pdf: publicUrl
      }]);

      if (!error) {
        alert('📜 ¡Acta PDF registrada y subida oficialmente!');
        setActaTitulo(''); setActaTipo('Ordinaria'); setActaFecha(''); setActaResumen(''); setActaArchivo(null);
        fetchEnterpriseData();
      } else {
        alert('Error: ' + error.message);
      }
    } catch (err: any) {
      alert('Error al subir: ' + err.message);
    } finally {
      setLoadingActa(false);
    }
  };

  // Cambio de roles dinámico y seguro conectado a Supabase
  const handleCambiarRol = async (user: any) => {
    const nuevoRol = user.role === 'admin' ? 'socio' : 'admin';
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ role: nuevoRol }).eq('id', user.id);
      
      if (!error) {
        setUsuarios(usuarios.map(u => (u.id === user.id) ? { ...u, role: nuevoRol } : u));
      } else {
        alert('Error actualizando el rol: Verifica las políticas RLS en Supabase.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleActualizarTicket = async (id: number, nuevoEstado: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets_soporte').update({ estado: nuevoEstado }).eq('id', id);
      if (!error) setTickets(tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    } catch (err: any) {}
  };

  const handleActualizarCita = async (id: number, nuevoEstado: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('agenda_legal').update({ estado: nuevoEstado }).eq('id', id);
      if (!error) setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    } catch (err: any) {}
  };

  const handleLogout = () => {
    document.cookie = 'sb-sindicato-session=; path=/; max-age=0;';
    document.cookie = 'sb-sindicato-rol=; path=/; max-age=0;';
    router.push('/');
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white font-black animate-pulse text-xl">Cargando Consola Analítica...</div></div>;

  const safeVotos = Array.isArray(votos) ? votos : [];
  const totalVotos = safeVotos.length;
  const aFavorCount = safeVotos.filter(v => v?.opcion_elegida === 'A favor').length;
  const enContraCount = safeVotos.filter(v => v?.opcion_elegida === 'En contra').length;
  const pctFavor = totalVotos === 0 ? 0 : (aFavorCount / totalVotos) * 100;
  const pctContra = totalVotos === 0 ? 0 : (enContraCount / totalVotos) * 100;

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const totalTickets = safeTickets.length;
  const ticketsPendientes = safeTickets.filter(t => t?.estado === 'Pendiente').length;
  const ticketsRevision = safeTickets.filter(t => t?.estado === 'En Revisión').length;
  const ticketsResueltos = safeTickets.filter(t => t?.estado === 'Resuelto').length;
  const pctPendientes = totalTickets === 0 ? 0 : (ticketsPendientes / totalTickets) * 100;
  const pctResueltos = totalTickets === 0 ? 0 : (ticketsResueltos / totalTickets) * 100;

  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const safeCitas = Array.isArray(citas) ? citas : [];

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'Resuelto': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'En Revisión': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Confirmada': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rechazada': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700'; 
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 pb-24">
      
      {/* HEADER INSTITUCIONAL PREMIUM */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white font-black px-3 py-1.5 rounded-xl text-xs tracking-wider uppercase shadow-md">
              Enterprise
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">SNOVERUS S.A.</h1>
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Consola de Mando Analítica</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-200">
              ← Ver Portal Socios
            </Link>
            <button onClick={handleLogout} className="text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        
        {/* KPI CARDS */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Métricas en Directo</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence & KPIs</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Socios</span>
              <span className="text-3xl font-black text-blue-600">{safeUsuarios.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Votos Emitidos</span>
              <span className="text-3xl font-black text-emerald-600">{totalVotos}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tickets Abiertos</span>
              <span className="text-3xl font-black text-amber-600">{ticketsPendientes + ticketsRevision}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Citas Legales</span>
              <span className="text-3xl font-black text-indigo-600">{safeCitas.length}</span>
            </div>
          </div>
        </div>

        {/* GRÁFICOS / MÉTRICAS VISUALES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <h3 className="text-lg font-black text-slate-900 mb-6">Distribución de Votación</h3>
            <div className="w-full flex-grow flex flex-col justify-center space-y-6">
              {totalVotos === 0 ? <p className="text-slate-400 text-xs font-semibold text-center py-6">Sin registros de votación activos.</p> : (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-emerald-600 uppercase tracking-wider">A Favor</span>
                      <span className="text-slate-800">{aFavorCount} votos ({pctFavor.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctFavor}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-red-600 uppercase tracking-wider">En Contra</span>
                      <span className="text-slate-800">{enContraCount} votos ({pctContra.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctContra}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <h3 className="text-lg font-black text-slate-900 mb-6">Rendimiento de Mesa de Ayuda</h3>
            <div className="w-full flex-grow flex flex-col justify-center space-y-6">
              {totalTickets === 0 ? <p className="text-slate-400 text-xs font-semibold text-center py-6">Sin tickets registrados.</p> : (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-500 uppercase tracking-wider">Pendientes</span>
                      <span className="text-slate-800">{ticketsPendientes} tickets</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${pctPendientes}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-emerald-600 uppercase tracking-wider">Resueltos</span>
                      <span className="text-slate-800">{ticketsResueltos} tickets</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctResueltos}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ACCIONES Y FORMULARIOS DE ADMINISTRACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* NUEVO COMUNICADO */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-4">📢 Nuevo Comunicado</h3>
            <form onSubmit={handlePublicarNoticia} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título del Aviso</label>
                <input type="text" required value={tituloNoticia} onChange={(e) => setTituloNoticia(e.target.value)} placeholder="Ej: Asamblea Extraordinaria" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Contenido</label>
                <textarea required rows={3} value={contenidoNoticia} onChange={(e) => setContenidoNoticia(e.target.value)} placeholder="Escribe los detalles..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"></textarea>
              </div>
              <button type="submit" disabled={loadingNoticia} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs">Publicar Muro</button>
            </form>
          </section>

          {/* APERTURA DE ASAMBLEA */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-4">🗳️ Apertura de Asamblea</h3>
            <form onSubmit={handleAbrirAsamblea} className="space-y-4 flex flex-col h-full justify-between">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Materia de Votación</label>
                <input type="text" required value={tituloAsamblea} onChange={(e) => setTituloAsamblea(e.target.value)} placeholder="Ej: Aprobación de Presupuesto" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              </div>
              <button type="submit" disabled={loadingAsamblea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs">Abrir Votación Oficial</button>
            </form>
          </section>

          {/* SUBIR ACTA OFICIAL PDF */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-4">📜 Subir Acta Oficial (PDF)</h3>
            <form onSubmit={handleSubirActa} className="space-y-3 flex flex-col h-full justify-between">
              <div className="space-y-3">
                <input type="text" required value={actaTitulo} onChange={(e) => setActaTitulo(e.target.value)} placeholder="Título del Acta..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/50" />
                
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" required value={actaFecha} onChange={(e) => setActaFecha(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50" />
                  <select value={actaTipo} onChange={(e) => setActaTipo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50">
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                    <option value="Directorio">Directorio</option>
                  </select>
                </div>

                <input type="text" required value={actaResumen} onChange={(e) => setActaResumen(e.target.value)} placeholder="Resumen de Acuerdos..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/50" />
                
                <input 
                  type="file" 
                  accept="application/pdf" 
                  required 
                  onChange={(e) => setActaArchivo(e.target.files ? e.target.files[0] : null)} 
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer" 
                />
              </div>

              <button type="submit" disabled={loadingActa} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/30 text-xs">
                {loadingActa ? 'Subiendo PDF...' : 'Subir Acta Oficial'}
              </button>
            </form>
          </section>

        </div>

        {/* GESTIÓN DE ROLES (RBAC) */}
        <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <h3 className="text-lg font-black text-slate-900 mb-4">🛡️ Gestión de Roles (RBAC)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-4">RUT del Socio</th>
                  <th className="p-4">Rol Actual</th>
                  <th className="p-4 text-right">Acción Directiva</th>
                </tr>
              </thead>
              <tbody>
                {safeUsuarios.map((user, idx) => (
                  <tr key={user.id || user.rut || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900 text-sm">{user.rut}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Socio'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleCambiarRol(user)} className="text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition shadow-sm">
                        Cambiar a {user.role === 'admin' ? 'Socio' : 'Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BANDEJAS DE SOPORTE Y LEGAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-4">🎧 Tickets de Soporte</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {safeTickets.length === 0 ? (
                <p className="text-slate-400 text-xs font-semibold text-center py-8">No hay tickets registrados.</p>
              ) : (
                safeTickets.map((ticket, idx) => (
                  <div key={idx} className="flex justify-between items-center p-5 border border-slate-200 bg-slate-50 rounded-2xl gap-4">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getBadgeStyle(ticket.estado)}`}>{ticket.estado}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-2">{ticket.asunto}</h4>
                    </div>
                    <div>
                      <button onClick={() => handleActualizarTicket(ticket.id, 'Resuelto')} className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap">
                        Resolver ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-4">⚖️ Solicitudes Legales</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {safeCitas.length === 0 ? (
                <p className="text-slate-400 text-xs font-semibold text-center py-8">No hay solicitudes legales registradas.</p>
              ) : (
                safeCitas.map((cita, idx) => (
                  <div key={idx} className="flex justify-between items-center p-5 border border-slate-200 bg-slate-50 rounded-2xl gap-4">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getBadgeStyle(cita.estado)}`}>{cita.estado}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-2">{cita.motivo}</h4>
                    </div>
                    <div>
                      <button onClick={() => handleActualizarCita(cita.id, 'Confirmada')} className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap">
                        Aprobar ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}