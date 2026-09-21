'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../app/lib/supabase";
import Campanita from "./Campanita"; 

export default function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("Cargando...");
  const [userRole, setUserRole] = useState("socio");
  
  // 🏢 Estados dinámicos para el Tenant (Sindicato)
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenantName, setTenantName] = useState("Sindicato PYC");
  const [tenantLogo, setTenantLogo] = useState("/logopyf.jpeg");
  
  // ✏️ Estados para el Modal de Edición de Identidad
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editTenantName, setEditTenantName] = useState("");
  const [editTenantLogo, setEditTenantLogo] = useState(""); 
  const [logoFile, setLogoFile] = useState<File | null>(null); 
  const [savingTenant, setSavingTenant] = useState(false);

  // 🌐 Estados del Menú SaaS (Switcher solo para Superadmin)
  const [menuOpen, setMenuOpen] = useState(false);
  const [sindicatos, setSindicatos] = useState<any[]>([]);

  // 🔐 Modal de credenciales (Mantenido por seguridad extra si se requiere re-validar)
  const [modalAdminOpen, setModalAdminOpen] = useState(false);
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: any;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // 1. Cargar Perfil del Usuario y su Sindicato asignado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`full_name, role, email, sindicatos (id, nombre, logo_url)`)
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setUserName(profile.full_name || profile.email?.split('@')[0] || "Usuario");
        const rolActual = String(profile.role || '').trim().toLowerCase();
        setUserRole(rolActual);

        let activeSindicato = profile.sindicatos ? (Array.isArray(profile.sindicatos) ? profile.sindicatos[0] : profile.sindicatos) : null;
        
        // 2. Control estricto de roles para cargar los Tenants
        if (rolActual === 'superadmin') {
          // SOLO EL SUPERADMIN PUEDE VER Y CAMBIAR A OTROS SINDICATOS
          const { data: allSindicatos } = await supabase.from('sindicatos').select('*');
          if (allSindicatos) setSindicatos(allSindicatos);

          const cachedTenantId = localStorage.getItem('sindicato_activo');
          if (cachedTenantId && allSindicatos) {
             const found = allSindicatos.find(s => String(s.id) === String(cachedTenantId));
             if (found) activeSindicato = found;
          }
        } else {
          // ADMIN Y SOCIO: Se les fuerza su sindicato asignado en la BD. Aislamiento total.
          if (activeSindicato) {
            localStorage.setItem('sindicato_activo', activeSindicato.id);
          }
        }

        // 3. Setear variables del entorno visual activo
        if (activeSindicato) {
          setTenantId(activeSindicato.id);
          setTenantName(activeSindicato.nombre || "Organización Activa");
          setTenantLogo(activeSindicato.logo_url || "/logopyf.jpeg");
          
          setEditTenantName(activeSindicato.nombre || "Organización Activa");
          setEditTenantLogo(activeSindicato.logo_url || "");

          // MAGIA EN TIEMPO REAL
          const channelName = `tenant-ui-${activeSindicato.id}-${Date.now()}`;
          channel = supabase.channel(channelName)
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'sindicatos',
              filter: `id=eq.${activeSindicato.id}` 
            }, (payload) => {
              setTenantName(payload.new.nombre);
              setTenantLogo(payload.new.logo_url || '/logopyf.jpeg');
              setEditTenantName(payload.new.nombre);
              setEditTenantLogo(payload.new.logo_url || '');
            }).subscribe();
        }
      } else {
        setUserName(user.email?.split('@')[0] || "Usuario");
      }
    };

    fetchUserData();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (channel) createClient().removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) { console.error(err); }
    document.cookie = 'sb-sindicato-session=; path=/; max-age=0;';
    document.cookie = 'sb-sindicato-rol=; path=/; max-age=0;';
    router.push('/');
    router.refresh();
  };

  const seleccionarSindicato = (sindicato: any) => {
    localStorage.setItem('sindicato_activo', sindicato.id);
    setMenuOpen(false);
    window.location.reload(); 
  };

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailAdmin,
      password: passwordAdmin,
    });

    if (error) alert('❌ Credenciales inválidas: ' + error.message);
    else {
      setModalAdminOpen(false);
      router.push('/dashboard/admin');
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSavingTenant(true);
    try {
      const supabase = createClient();
      let finalLogoUrl = editTenantLogo; 

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo_${tenantId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
        finalLogoUrl = data.publicUrl;
      }

      const { error } = await supabase.from('sindicatos').update({
        nombre: editTenantName,
        logo_url: finalLogoUrl.trim() !== '' ? finalLogoUrl.trim() : '/logopyf.jpeg'
      }).eq('id', tenantId);

      if (error) throw error;
      
      setShowTenantModal(false);
      setLogoFile(null);
    } catch (err: any) {
      alert("Error al actualizar la identidad: " + err.message);
    } finally {
      setSavingTenant(false);
    }
  };

  const getDisplayRole = (role: string) => {
    if (role === 'superadmin') return 'Superadmin';
    if (role === 'admin' || role === 'administrador') return 'Administrador';
    return 'Socio Activo';
  };

  const getInitials = (name: string) => {
    if (!name || name === "Cargando...") return '..';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const iniciales = getInitials(userName);
  const isAdminOrSuper = userRole === 'superadmin' || userRole === 'admin' || userRole === 'administrador';

  return (
    <>
      <nav className="bg-[#0f172a] border-b border-slate-800 text-slate-100 w-full z-[100] sticky top-0 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LADO IZQUIERDO: RENDERIZADO CONDICIONAL BASADO EN EL ROL */}
            <div className="flex-shrink-0 flex items-center gap-4 w-auto lg:w-1/4">
              
              {userRole === 'superadmin' ? (
                /* --- VISTA SUPERADMIN: DROPDOWN COMPLETO --- */
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="group flex items-center gap-4 text-left transition-all hover:opacity-80 relative p-1 rounded-xl hover:bg-white/5 focus:outline-none">
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-white flex items-center justify-center relative">
                      <img src={tenantLogo} alt={tenantName} className="h-full w-full object-contain" onError={(e) => { e.currentTarget.src = '/logopyf.jpeg' }} />
                    </div>
                    <div className="hidden sm:block relative">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mb-0.5">Control Global</span>
                      <span className="font-black text-xl tracking-tight text-white flex items-center gap-2 leading-none group-hover:text-purple-300 transition-colors">
                        {tenantName}
                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                      </span>
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute left-0 mt-3 w-[340px] bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl p-4 z-50 animate-fade-in-up">
                      <div className="px-3 py-2 border-b border-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saltar a Organización</p>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto mb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {sindicatos.map(s => (
                          <button
                            key={s.id}
                            onClick={() => seleccionarSindicato(s)}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${tenantId === s.id ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50' : 'text-slate-300 hover:bg-slate-800'}`}
                          >
                            <span className="truncate pr-2">{s.nombre}</span>
                            <span className="text-[9px] bg-black/20 px-2 py-1 rounded-md opacity-80 shrink-0">ID: {s.id}</span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-800 pt-4 space-y-2.5">
                        <button onClick={() => { setMenuOpen(false); setShowTenantModal(true); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-3">
                          <span className="text-base">✏️</span> Modificar Identidad Visual
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              ) : isAdminOrSuper ? (
                /* --- VISTA ADMIN NORMAL: EDICIÓN DIRECTA, SIN DROPDOWN --- */
                <button onClick={() => setShowTenantModal(true)} className="group flex items-center gap-4 text-left transition-all hover:opacity-80 relative p-1 rounded-xl hover:bg-white/5 focus:outline-none" title="Editar identidad del Sindicato">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-white flex items-center justify-center relative">
                    <img src={tenantLogo} alt={tenantName} className="h-full w-full object-contain" onError={(e) => { e.currentTarget.src = '/logopyf.jpeg' }} />
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                      <span className="text-white text-lg drop-shadow-md">✏️</span>
                    </div>
                  </div>
                  <div className="hidden sm:block relative">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Mi Organización</span>
                    <span className="font-black text-xl tracking-tight text-white flex items-center gap-2 leading-none group-hover:text-blue-300 transition-colors">
                      {tenantName}
                    </span>
                  </div>
                </button>

              ) : (
                /* --- VISTA SOCIO: LOGO ESTÁTICO --- */
                <div className="flex items-center gap-4 p-1">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-700 shadow-sm bg-white flex items-center justify-center">
                    <img src={tenantLogo} alt={tenantName} className="h-full w-full object-contain" onError={(e) => { e.currentTarget.src = '/logopyf.jpeg' }} />
                  </div>
                  <Link href="/dashboard" className="font-black text-xl tracking-tight text-white hover:opacity-80 transition hidden sm:block">
                    {tenantName}
                  </Link>
                </div>
              )}
            </div>

            {/* CENTRO: Menú de Navegación */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
              <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white transition">Inicio</Link>
              <Link href="/dashboard/beneficios" className="text-sm font-bold text-slate-300 hover:text-white transition">Beneficios</Link>
              <Link href="/dashboard/chat-legal" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">🤖 Asistente Legal</Link>

              <div className="relative group h-20 flex items-center">
                <button className="flex items-center gap-1 text-sm font-bold text-slate-300 group-hover:text-white transition outline-none cursor-pointer">
                  Más Módulos <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[480px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 z-50 overflow-hidden">
                  <div className="p-6 grid grid-cols-2 gap-2">
                    <Link href="/dashboard/credencial" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">🪪</span><div><h4 className="text-sm font-bold text-white">Credencial</h4><p className="text-[10px] text-slate-400">ID Digital Sindicato</p></div></Link>
                    <Link href="/dashboard/actas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">📜</span><div><h4 className="text-sm font-bold text-white">Actas</h4><p className="text-[10px] text-slate-400">Documentos oficiales</p></div></Link>
                    <Link href="/dashboard/finanzas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">💰</span><div><h4 className="text-sm font-bold text-white">Finanzas</h4><p className="text-[10px] text-slate-400">Transparencia sindical</p></div></Link>
                    <Link href="/dashboard/asistencia" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">📅</span><div><h4 className="text-sm font-bold text-white">Asistencia</h4><p className="text-[10px] text-slate-400">Registro de asambleas</p></div></Link>
                    <Link href="/dashboard/encuestas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">📊</span><div><h4 className="text-sm font-bold text-white">Encuestas</h4><p className="text-[10px] text-slate-400">Participación activa</p></div></Link>
                    <Link href="/dashboard/negociacion" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">🤝</span><div><h4 className="text-sm font-bold text-white">Negociación</h4><p className="text-[10px] text-slate-400">Contratos colectivos</p></div></Link>
                    <Link href="/dashboard/solidario" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">🫂</span><div><h4 className="text-sm font-bold text-white">Solidario</h4><p className="text-[10px] text-slate-400">Aportes y ayudas</p></div></Link>
                    <Link href="/dashboard/soporte" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition"><span className="text-xl">🎧</span><div><h4 className="text-sm font-bold text-white">Soporte</h4><p className="text-[10px] text-slate-400">Mesa de ayuda</p></div></Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                {userRole === 'superadmin' && (
                  <Link href="/superadmin" className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-2 bg-purple-900/40 hover:bg-purple-900/60 px-4 py-2 rounded-full transition-colors border border-purple-500/50 shadow-md ml-2">⚡ Consola SaaS</Link>
                )}
                {isAdminOrSuper && (
                  <Link href="/dashboard/admin" className="text-sm font-bold text-white flex items-center gap-2 bg-rose-900 hover:bg-rose-800 px-4 py-1.5 rounded-full transition-colors border border-rose-700 shadow-md ml-2">⚙️ Panel Admin</Link>
                )}
              </div>
            </div>

            {/* LADO DERECHO: Campanita y Perfil */}
            <div className="flex items-center justify-end gap-3 sm:gap-5 w-auto lg:w-1/4">
              <Campanita />
              <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-white">{userName}</span>
                <span className={`text-[10px] font-extrabold tracking-widest uppercase ${userRole === 'superadmin' ? 'text-purple-400' : isAdminOrSuper ? 'text-blue-400' : 'text-slate-400'}`}>{getDisplayRole(userRole)}</span>
              </div>
              
              <Link href="/dashboard/perfil" className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition cursor-pointer border-2 ${userRole === 'superadmin' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-500/50 text-white' : isAdminOrSuper ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-500/50 text-white' : 'bg-slate-800 border-slate-600 text-slate-200'}`}>
                <span className="text-sm font-black">{iniciales}</span>
              </Link>

              <button onClick={handleLogout} className="hidden sm:block text-slate-400 hover:text-red-400 transition p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>

              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors relative z-[110]">
                {isMobileMenuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🚀 MODAL FLOTANTE DE IDENTIDAD VISUAL */}
      {showTenantModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" onClick={() => setShowTenantModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Identidad Visual</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Ajustar logo y nombre</p>
              </div>
              <button onClick={() => {setShowTenantModal(false); setLogoFile(null);}} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-slate-500">✕</button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Oficial</label>
                <input 
                  type="text" 
                  value={editTenantName} 
                  onChange={(e) => setEditTenantName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-bold text-slate-700" 
                />
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                <label className="block text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Subir Logo desde Equipo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    setLogoFile(e.target.files ? e.target.files[0] : null);
                    if (e.target.files && e.target.files.length > 0) setEditTenantLogo(""); 
                  }} 
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-white border border-slate-200 rounded-2xl p-1.5 transition-all shadow-sm" 
                />
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-blue-200 flex-1"></div>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">O usar enlace Web</span>
                  <div className="h-px bg-blue-200 flex-1"></div>
                </div>
                <input 
                  type="url" 
                  value={editTenantLogo} 
                  onChange={(e) => {
                    setEditTenantLogo(e.target.value);
                    setLogoFile(null); 
                  }} 
                  placeholder="https://tusitio.com/logo.png" 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder-slate-400" 
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => {setShowTenantModal(false); setLogoFile(null);}} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm shadow-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={savingTenant} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm flex items-center justify-center gap-2">
                  {savingTenant ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}