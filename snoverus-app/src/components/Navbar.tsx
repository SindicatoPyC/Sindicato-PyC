"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../app/lib/supabase";
import Campanita from "./Campanita"; 

export default function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("Socio PYC");
  const [userRole, setUserRole] = useState("Socio Activo");
  
  // 📱 Estado para controlar el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        const nameToDisplay = profile.full_name || profile.email?.split('@')[0] || "Socio PYC";
        setUserName(nameToDisplay);
        setUserRole(profile.role === 'admin' ? 'Administrador' : 'Socio Activo');
      } else {
        setUserName(user.email?.split('@')[0] || "Socio PYC");
      }
    };

    fetchUserData();
  }, []);

  // 🛡️ Cierre de sesión completo (Servidor + Cookies locales)
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión en Supabase:", err);
    }

    // Borramos las cookies locales
    document.cookie = 'sb-sindicato-session=; path=/; max-age=0;';
    document.cookie = 'sb-sindicato-rol=; path=/; max-age=0;';
    
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 text-slate-100 w-full z-[100] sticky top-0 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Lado Izquierdo: Tu Logo Original y Título */}
          <div className="flex-shrink-0 flex items-center gap-4 w-auto lg:w-1/4">
            <img 
              src="/logopyf.jpeg" 
              alt="Sindicato PYC" 
              className="h-12 w-12 rounded-full object-contain border-2 border-slate-700 shadow-sm" 
            />
            <Link href="/dashboard" className="font-black text-xl tracking-tight text-white hover:opacity-80 transition hidden sm:block">
              Sindicato <span className="text-blue-500">PYC</span>
            </Link>
          </div>

          {/* CENTRO: Menú de Navegación PRO (Mega Menú Desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white transition">Inicio</Link>
            <Link href="/dashboard/beneficios" className="text-sm font-bold text-slate-300 hover:text-white transition">Beneficios</Link>
            
            {/* Asistente Legal Destacado */}
            <Link href="/dashboard/chat-legal" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              🤖 Asistente Legal
            </Link>

            {/* Menú Desplegable Flotante */}
            <div className="relative group h-20 flex items-center">
              <button className="flex items-center gap-1 text-sm font-bold text-slate-300 group-hover:text-white transition outline-none cursor-pointer">
                Más Módulos
                <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Panel del Mega Menú (Se muestra al hacer Hover) */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[480px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 z-50 overflow-hidden">
                <div className="p-6 grid grid-cols-2 gap-2">
                  <Link href="/dashboard/credencial" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">🪪</span>
                    <div><h4 className="text-sm font-bold text-white">Credencial</h4><p className="text-[10px] text-slate-400">ID Digital Sindicato</p></div>
                  </Link>
                  <Link href="/dashboard/actas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">📜</span>
                    <div><h4 className="text-sm font-bold text-white">Actas</h4><p className="text-[10px] text-slate-400">Documentos oficiales</p></div>
                  </Link>
                  <Link href="/dashboard/finanzas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">💰</span>
                    <div><h4 className="text-sm font-bold text-white">Finanzas</h4><p className="text-[10px] text-slate-400">Transparencia sindical</p></div>
                  </Link>
                  <Link href="/dashboard/asistencia" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">📅</span>
                    <div><h4 className="text-sm font-bold text-white">Asistencia</h4><p className="text-[10px] text-slate-400">Registro de asambleas</p></div>
                  </Link>
                  <Link href="/dashboard/encuestas" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">📊</span>
                    <div><h4 className="text-sm font-bold text-white">Encuestas</h4><p className="text-[10px] text-slate-400">Participación activa</p></div>
                  </Link>
                  <Link href="/dashboard/negociacion" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">🤝</span>
                    <div><h4 className="text-sm font-bold text-white">Negociación</h4><p className="text-[10px] text-slate-400">Contratos colectivos</p></div>
                  </Link>
                  <Link href="/dashboard/solidario" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">🫂</span>
                    <div><h4 className="text-sm font-bold text-white">Solidario</h4><p className="text-[10px] text-slate-400">Aportes y ayudas</p></div>
                  </Link>
                  <Link href="/dashboard/soporte" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition">
                    <span className="text-xl">🎧</span>
                    <div><h4 className="text-sm font-bold text-white">Soporte</h4><p className="text-[10px] text-slate-400">Mesa de ayuda</p></div>
                  </Link>
                </div>
              </div>
            </div>

            {/* BOTÓN EXCLUSIVO PARA ADMINISTRADORES */}
            {userRole === 'Administrador' && (
              <Link 
                href="/dashboard/admin" 
                className="text-sm font-bold text-white flex items-center gap-2 bg-rose-900 hover:bg-rose-800 px-4 py-1.5 rounded-full transition-colors border border-rose-700 shadow-md ml-2"
              >
                ⚙️ Panel Admin
              </Link>
            )}

          </div>

          {/* Lado Derecho: Controles y Perfil Dinámico */}
          <div className="flex items-center justify-end gap-3 sm:gap-6 w-auto lg:w-1/4">
            
            <Campanita />

            <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-white">{userName}</span>
              <span className="text-[10px] text-blue-400 font-extrabold tracking-widest uppercase">{userRole}</span>
            </div>
            
            <Link href="/dashboard/perfil" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 shadow-sm hover:border-blue-500 transition cursor-pointer">
              <span className="text-lg">👷</span>
            </Link>

            <button 
              onClick={handleLogout}
              className="hidden sm:block text-slate-400 hover:text-red-400 transition p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer"
              title="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* 📱 Botón Menú Hamburguesa (Móviles) PROGRAMADO */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors relative z-[110]"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            
          </div>
        </div>
      </div>

      {/* 📱 PANEL DESPLEGABLE MÓVIL */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden z-[90] ${isMobileMenuOpen ? 'max-h-[85vh] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
        <div className="flex flex-col px-4 space-y-2 overflow-y-auto max-h-[75vh] pb-6 hide-scrollbar">
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-sm bg-slate-800/50 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/50">🏠 Inicio</Link>
          <Link href="/dashboard/beneficios" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-sm bg-slate-800/50 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/50">🎁 Beneficios</Link>
          <Link href="/dashboard/chat-legal" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-400 font-bold text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 p-4 rounded-2xl">🤖 Asistente Legal</Link>

          <div className="h-px bg-slate-800 my-2"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Módulos del Sindicato</span>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link href="/dashboard/credencial" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">🪪</span><span className="text-xs font-bold text-slate-300">Credencial</span></Link>
            <Link href="/dashboard/actas" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">📜</span><span className="text-xs font-bold text-slate-300">Actas</span></Link>
            <Link href="/dashboard/finanzas" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">💰</span><span className="text-xs font-bold text-slate-300">Finanzas</span></Link>
            <Link href="/dashboard/asistencia" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">📅</span><span className="text-xs font-bold text-slate-300">Asistencia</span></Link>
            <Link href="/dashboard/encuestas" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">📊</span><span className="text-xs font-bold text-slate-300">Encuestas</span></Link>
            <Link href="/dashboard/negociacion" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">🤝</span><span className="text-xs font-bold text-slate-300">Negociación</span></Link>
            <Link href="/dashboard/solidario" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">🫂</span><span className="text-xs font-bold text-slate-300">Solidario</span></Link>
            <Link href="/dashboard/soporte" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1"><span className="text-xl">🎧</span><span className="text-xs font-bold text-slate-300">Soporte</span></Link>
          </div>

          <div className="h-px bg-slate-800 my-2"></div>
          
          {userRole === 'Administrador' && (
            <Link href="/dashboard/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-bold text-sm bg-rose-900/50 hover:bg-rose-800 text-rose-300 border border-rose-800 p-4 rounded-2xl">
              ⚙️ Panel de Administración
            </Link>
          )}

          <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full text-center font-bold text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-4 rounded-2xl mt-2">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}