"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Campanita from "./Campanita"; 

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'sb-sindicato-session=; path=/; max-age=0;';
    document.cookie = 'sb-sindicato-rol=; path=/; max-age=0;';
    router.push('/');
  };

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 text-slate-100 w-full z-50 sticky top-0 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Lado Izquierdo: Tu Logo Original y Título */}
          <div className="flex-shrink-0 flex items-center gap-4 w-1/4">
            <img 
              src="/logopyf.jpeg" 
              alt="Sindicato PYC" 
              className="h-12 w-12 rounded-full object-contain border-2 border-slate-700 shadow-sm" 
            />
            <Link href="/dashboard" className="font-black text-xl tracking-tight text-white hover:opacity-80 transition hidden xl:block">
              Sindicato <span className="text-blue-500">PYC</span>
            </Link>
          </div>

          {/* CENTRO: Menú de Navegación PRO (Mega Menú) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white transition">Inicio</Link>
            <Link href="/dashboard/beneficios" className="text-sm font-bold text-slate-300 hover:text-white transition">Beneficios</Link>
            
            {/* Asistente Legal Destacado */}
            <Link href="/dashboard/chat-legal" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              🤖 Asistente Legal
            </Link>

            {/* Menú Desplegable Flotante */}
            <div className="relative group h-20 flex items-center">
              <button className="flex items-center gap-1 text-sm font-bold text-slate-300 group-hover:text-white transition outline-none">
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
          </div>

          {/* Lado Derecho: Controles y Perfil */}
          <div className="flex items-center justify-end gap-4 sm:gap-6 w-1/4">
            
            <Campanita />

            <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-white">Alexander M.</span>
              <span className="text-[10px] text-blue-400 font-extrabold tracking-widest uppercase">Administrador</span>
            </div>
            
            <Link href="/dashboard/perfil" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 shadow-sm hover:border-blue-500 transition cursor-pointer">
              <span className="text-lg">👷</span>
            </Link>

            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition ml-2 p-2 rounded-xl hover:bg-slate-800/50"
              title="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Menú Hamburguesa (Móviles) */}
            <button className="lg:hidden text-slate-400 hover:text-white ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
          </div>
        </div>
      </div>
    </nav>
  );
}