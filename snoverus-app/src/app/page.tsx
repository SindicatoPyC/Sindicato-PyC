'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from './lib/supabase';

const sindicalSlides = [
  {
    icon: "✊",
    title: "Juntos somos más fuertes",
    description: "Este espacio fue diseñado para mantenernos conectados, informados y respaldados. Accede a tus beneficios, votaciones, actas y canales de asesoría en un solo lugar."
  },
  {
    icon: "🎁",
    title: "Beneficios Exclusivos",
    description: "Descubre convenios en salud, educación, recreación y comercio pensados especialmente para ti y tu grupo familiar."
  },
  {
    icon: "⚖️",
    title: "Asesoría Legal Transparente",
    description: "Cuenta con respaldo jurídico profesional y acceso directo a actas, acuerdos y asambleas de manera abierta y segura."
  }
];

export default function LoginPage() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sindicalSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    try {
      const supabase = createClient();

      const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_por_rut', { 
        p_rut: cleanRut 
      });

      if (rpcError || !realEmail) {
        throw new Error('No encontramos una cuenta asociada a este RUT.');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: realEmail,
        password,
      });

      if (authError) throw new Error('RUT o contraseña incorrectos.');

      if (authData.session) {
        document.cookie = `sb-sindicato-session=${authData.user.email}; path=/; max-age=86400`;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          throw new Error('Error al obtener los permisos del usuario.');
        }

        document.cookie = `sb-sindicato-rol=${profileData.role}; path=/; max-age=86400`;

        // LÓGICA DE REDIRECCIÓN CON PRIORIDAD SUPERADMIN
        const rolUsuario = String(profileData.role || '').trim().toLowerCase();

        if (rolUsuario === 'superadmin') {
          router.push('/superadmin');
        } else if (rolUsuario === 'admin' || rolUsuario === 'administrador') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard');
        }
        
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión. Por favor, verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-200 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-cyan-600 selection:text-white">
      {/* Panel Izquierdo - Branding Institucional */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 text-white shadow-[10px_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Luces de fondo dinámicas */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4 group">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-cyan-500/30 backdrop-blur-md flex items-center justify-center text-cyan-300 text-2xl font-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            PYC
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-widest text-cyan-400 uppercase block mb-1">
              Organización Gremial
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">
              Sindicato <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">PYC</span>
            </h1>
          </div>
        </div>

        {/* Carrusel */}
        <div className="space-y-6 my-auto relative z-10">
          <div className="relative p-8 rounded-3xl bg-slate-900/40 border border-cyan-800/30 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:bg-slate-900/60 hover:border-cyan-700/50">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-white/10 flex items-center justify-center text-3xl text-white mb-6 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform transition-transform hover:-translate-y-1">
              {sindicalSlides[currentSlide].icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white tracking-tight mb-3">
              {sindicalSlides[currentSlide].title}
            </h3>
            
            <p className="text-cyan-100/70 text-sm leading-relaxed font-medium min-h-[80px]">
              {sindicalSlides[currentSlide].description}
            </p>

            <div className="flex items-center gap-2 pt-4">
              {sindicalSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === index ? 'w-10 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'w-3 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-cyan-500/60 font-semibold flex items-center justify-between">
          <span>© 2026 Sindicato PYC</span>
          <span className="flex items-center gap-2 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]"></span>
            Red Encriptada
          </span>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#040814] backdrop-blur-sm">
        {/* Elemento decorativo sutil en el fondo derecho */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none"></div>

        {/* CONTENEDOR MISTERIOSO DIAMANTE OSCURO */}
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900/90 to-[#071324]/90 p-8 sm:p-10 rounded-[2rem] border border-cyan-900/50 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)] relative z-20 backdrop-blur-2xl">
          
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 bg-cyan-950/50 border border-cyan-800/50 px-4 py-1.5 rounded-full text-cyan-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              ✨ Portal de Socios
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              Bienvenido
            </h2>
            
            <p className="text-slate-400 text-sm font-medium">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl text-red-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-inner">
              <span className="text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">⚠️</span> 
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                RUT del Socio
              </label>
              <input 
                type="text" 
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="11111111-1"
                className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner"
              />
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                  Contraseña
                </label>
                <Link href="/forgot-password" className="text-cyan-500 text-xs font-bold hover:text-cyan-300 transition-colors drop-shadow-[0_0_2px_rgba(6,182,212,0.8)]">
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-sm tracking-wide flex items-center justify-center gap-2 border border-cyan-400/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando Sistema...
                  </>
                ) : 'Ingresar al Portal Seguro'}
              </button>
            </div>
          </form>

          {/* BOTÓN VIP LLAMATIVO PARA POSTULANTES */}
          <div className="mt-12 p-[2px] rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-500 shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all duration-300">
            <div className="bg-slate-950 p-6 rounded-[14px] text-center flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(245,158,11,0)_0%,rgba(245,158,11,0.1)_50%,rgba(245,158,11,0)_100%)] animate-[spin_4s_linear_infinite] pointer-events-none"></div>
              
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest relative z-10 drop-shadow-md">
                ¿Aún no eres parte del sindicato?
              </span>
              
              <Link href="/postular" className="relative z-10 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-slate-900 text-sm font-black uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center justify-center gap-2 group transform hover:scale-[1.02]">
                Llenar Formulario de Postulación
                <span className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">🚀</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}