'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase';

export default function SuperAdminPanel() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [validando, setValidando] = useState(true);

  // Estados para datos globales
  const [sindicatos, setSindicatos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para formulario de nuevo Sindicato
  const [nombreSindicato, setNombreSindicato] = useState('');
  const [rutSindicato, setRutSindicato] = useState('');
  const [logoSindicato, setLogoSindicato] = useState('');
  const [creandoSindicato, setCreandoSindicato] = useState(false);

  // Estado para modal de asignación de tenant a usuario
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [nuevoRol, setNuevoRol] = useState('socio');
  const [nuevoSindicatoId, setNuevoSindicatoId] = useState<string>('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      validarAccesoSuperAdmin();
    }
  }, [isMounted]);

  const validarAccesoSuperAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      const rolUsuario = String(data?.role || '').trim().toLowerCase();
      
      // Solo permitimos acceso si el rol es estrictamente superadmin
      if (rolUsuario === 'superadmin') {
        setValidando(false);
        fetchSuperAdminData();
      } else {
        alert('⚠️ Acceso denegado. Se requieren privilegios de Super Administrador.');
        router.push('/dashboard');
      }
    } else {
      router.push('/');
    }
  };

  const fetchSuperAdminData = async () => {
    try {
      const supabase = createClient();

      // Cargar todos los sindicatos
      const { data: sindData } = await supabase.from('sindicatos').select('*').order('id', { ascending: true });
      if (Array.isArray(sindData)) setSindicatos(sindData);

      // Cargar todos los perfiles de usuarios globales
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (Array.isArray(usersData)) setUsuarios(usersData);

    } catch (err) {
      console.error("Error cargando datos de Superadmin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSindicato = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoSindicato(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('sindicatos').insert([{
        nombre: nombreSindicato,
        rut_sindicato: rutSindicato,
        logo_url: logoSindicato.trim() !== '' ? logoSindicato.trim() : null,
        estado: 'Activo'
      }]);

      if (error) throw error;

      alert('✅ Sindicato creado exitosamente.');
      setNombreSindicato('');
      setRutSindicato('');
      setLogoSindicato('');
      fetchSuperAdminData();
    } catch (err: any) {
      alert('❌ Error al crear sindicato: ' + err.message);
    } finally {
      setCreandoSindicato(false);
    }
  };

  const abrirModalAsignacion = (user: any) => {
    setUsuarioSeleccionado(user);
    setNuevoRol(user.role || 'socio');
    setNuevoSindicatoId(user.sindicato_id ? String(user.sindicato_id) : '');
  };

  const guardarAsignacionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;
    setGuardandoAsignacion(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({
        role: nuevoRol,
        sindicato_id: nuevoSindicatoId ? Number(nuevoSindicatoId) : null
      }).eq('id', usuarioSeleccionado.id);

      if (error) throw error;

      alert('✅ Usuario actualizado y asignado a la organización correctamente.');
      setUsuarioSeleccionado(null);
      fetchSuperAdminData();
    } catch (err: any) {
      alert('❌ Error al actualizar usuario: ' + err.message);
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  if (!isMounted || validando) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans pb-24 text-slate-900 selection:bg-purple-300 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <div className="p-6 md:p-10 relative z-10 max-w-7xl mx-auto space-y-12">
        
        {/* HEADER SUPERADMIN */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-purple-500/30">
          <div>
            <span className="bg-gradient-to-r from-purple-500 to-indigo-400 text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
              Super Admin SaaS
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-3 mb-2">
              Panel Global de Tenants
            </h1>
            <p className="text-sm font-medium text-purple-200/80 uppercase tracking-widest">Gestión Centralizada de Sindicatos</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/admin" className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl text-sm font-bold transition-all">
              ← Panel Admin Sindicato
            </Link>
          </div>
        </div>

        {/* SECCIÓN 1: CREAR NUEVO SINDICATO */}
        <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <span className="p-2.5 bg-purple-100 text-purple-600 rounded-xl text-lg">🏢</span> 
            Registrar Nueva Organización (Sindicato)
          </h3>
          <form onSubmit={handleCrearSindicato} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Sindicato</label>
              <input type="text" required value={nombreSindicato} onChange={e => setNombreSindicato(e.target.value)} placeholder="Ej: Sindicato Minero Sur" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">RUT del Sindicato</label>
              <input type="text" required value={rutSindicato} onChange={e => setRutSindicato(e.target.value)} placeholder="Ej: 70.123.456-7" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo URL (Opcional)</label>
              <input type="url" value={logoSindicato} onChange={e => setLogoSindicato(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" disabled={creandoSindicato} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-500/25 text-sm">
                {creandoSindicato ? 'Creando Sindicato...' : '+ Crear Organización'}
              </button>
            </div>
          </form>
        </section>

        {/* SECCIÓN 2: LISTADO DE SINDICATOS EXISTENTES */}
        <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Sindicatos Activos en la Plataforma</h3>
            <span className="bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full">
              {sindicatos.length} Tenants Registrados
            </span>
          </div>
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="p-5 pl-8">ID</th>
                  <th className="p-5">Nombre Oficial</th>
                  <th className="p-5">RUT</th>
                  <th className="p-5 pr-8 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sindicatos.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 pl-8 font-mono font-bold text-slate-500">#{s.id}</td>
                    <td className="p-5 font-extrabold text-slate-800">{s.nombre}</td>
                    <td className="p-5 font-medium text-slate-600">{s.rut_sindicato}</td>
                    <td className="p-5 pr-8 text-right">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase rounded-full">
                        {s.estado || 'Activo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECCIÓN 3: PADRÓN GLOBAL Y ASIGNACIÓN DE TENANTS */}
        <section className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Padrón Global de Usuarios y Asignación de Roles</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full">
              {usuarios.length} Usuarios Totales
            </span>
          </div>
          <div className="p-2 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="p-5 pl-8">Usuario</th>
                  <th className="p-5">RUT / Email</th>
                  <th className="p-5">Rol Actual</th>
                  <th className="p-5">Sindicato Asignado (Tenant ID)</th>
                  <th className="p-5 pr-8 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((user) => {
                  const sindicatoAsociado = sindicatos.find(s => s.id === user.sindicato_id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 pl-8 font-extrabold text-slate-800">{user.full_name || 'Sin nombre'}</td>
                      <td className="p-5 text-xs text-slate-500 font-medium">
                        <span className="block font-bold text-slate-700">{user.rut}</span>
                        {user.email}
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase rounded-full">
                          {user.role || 'socio'}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-slate-700">
                        {sindicatoAsociado ? (
                          <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100 text-xs">
                            {sindicatoAsociado.nombre} (ID: {sindicatoAsociado.id})
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100 text-xs">
                            Sin Sindicato Asignado
                          </span>
                        )}
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <button 
                          onClick={() => abrirModalAsignacion(user)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md"
                        >
                          Modificar Tenant / Rol
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* MODAL DE ASIGNACIÓN DE SINDICATO Y ROL */}
      {usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setUsuarioSeleccionado(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Asignar Organización</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{usuarioSeleccionado.full_name}</p>
              </div>
              <button onClick={() => setUsuarioSeleccionado(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">✕</button>
            </div>
            
            <form onSubmit={guardarAsignacionTenant} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol del Usuario</label>
                <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500">
                  <option value="socio">Socio</option>
                  <option value="admin">Administrador (Directiva)</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sindicato (Tenant) al que pertenece</label>
                <select value={nuevoSindicatoId} onChange={e => setNuevoSindicatoId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500">
                  <option value="">-- Sin Sindicato (Global / Ninguno) --</option>
                  {sindicatos.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} (ID: {s.id})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setUsuarioSeleccionado(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoAsignacion} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-3.5 rounded-xl shadow-lg text-sm">
                  {guardandoAsignacion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}