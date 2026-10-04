'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Encapsulamos la lógica principal para poder usar useSearchParams de forma segura en Next.js
function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Capturamos a dónde quería ir el usuario antes de que le pidiéramos login (Ej: el QR de asamblea)
  const redirectDestino = searchParams.get('redirect');

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

        // LÓGICA DE REDIRECCIÓN INTELIGENTE CON FORZADO ABSOLUTO
        const urlParams = new URLSearchParams(window.location.search);
        const redirectDestinoReal = urlParams.get('redirect');

        if (redirectDestinoReal) {
          // Si venía de un QR de asamblea, forzamos la redirección absoluta
          window.location.href = redirectDestinoReal; 
        } else {
          // Redirección normal según su rol
          const rolUsuario = String(profileData.role || '').trim().toLowerCase();
          if (rolUsuario === 'superadmin') {
            router.push('/superadmin');
          } else if (rolUsuario === 'admin' || rolUsuario === 'administrador') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard');
          }
        }
        
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión. Por favor, verifica tus datos.');
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-200 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-cyan-600 selection:text-white">
      {/* Panel Izquierdo - Branding Institucional */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 text-white shadow-[10px_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Luces de fondo dinámicas sutiles */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-5 group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-cyan-500/20 backdrop-blur-md flex items-center justify-center text-cyan-400 text-2xl font-black shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
            PYC
          </div>
          <div>
            <span className="text-[10px] font-black tracking-[0.25em] text-cyan-500 uppercase block mb-1">
              Organización Gremial
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">
              Sindicato <span className="text-cyan-400">PYC</span>
            </h1>
          </div>
        </div>

        {/* Carrusel Institucional */}
        <div className="space-y-6 my-auto relative z-10">
          <div className="relative p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:bg-white/10 hover:border-cyan-500/30">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl text-white mb-6 shadow-lg shadow-cyan-500/20 transform transition-transform hover:-translate-y-1">
              {sindicalSlides[currentSlide].icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white tracking-tight mb-4">
              {sindicalSlides[currentSlide].title}
            </h3>
            
            <p className="text-slate-300 text-sm leading-relaxed font-medium min-h-[80px]">
              {sindicalSlides[currentSlide].description}
            </p>

            <div className="flex items-center gap-2 pt-6">
              {sindicalSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === index ? 'w-10 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'w-3 bg-slate-700/50 hover:bg-slate-600'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>© 2026 Sindicato PYC</span>
          <span className="flex items-center gap-2 text-cyan-500">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_#22d3ee]"></span>
            Plataforma Segura
          </span>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>

        {/* Tarjeta de Inicio de Sesión Modernizada */}
        <div className="w-full max-w-md bg-white/[0.02] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-20 backdrop-blur-3xl">
          
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase">
              ✨ Portal de Socios
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Bienvenido
            </h2>
            
            <p className="text-slate-400 text-sm font-medium">
              {redirectDestino 
                ? 'Inicia sesión para registrar tu asistencia.' 
                : 'Ingresa tus credenciales para continuar.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <span className="text-lg">⚠️</span> 
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 transition-colors group-focus-within:text-cyan-400">
                RUT del Socio
              </label>
              <input 
                type="text" 
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="11111111-1"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-cyan-400">
                  Contraseña
                </label>
                <Link href="/forgot-password" className="text-cyan-500 hover:text-cyan-400 text-xs font-bold transition-colors">
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </>
                ) : (
                  redirectDestino ? 'Ingresar y Confirmar Asistencia' : 'Ingresar al Portal'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sección de Postulación Refinada */}
        <div className="mt-10 w-full max-w-md">
          <div className="p-[1px] rounded-[1.5rem] bg-gradient-to-r from-amber-500/20 via-yellow-500/40 to-amber-500/20">
            <div className="bg-slate-950/80 backdrop-blur-xl p-6 rounded-[1.5rem] text-center flex flex-col gap-4">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                ¿Aún no eres parte del sindicato?
              </span>
              
              <Link href="/postular" className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group">
                Formulario de Postulación
                <span className="transform transition-transform group-hover:translate-x-1">🚀</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Exportamos la página envuelta en Suspense para asegurar el correcto renderizado del lado del cliente en Next.js
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}