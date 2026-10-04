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

function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
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

        // REDIRECCIÓN INTELIGENTE CON MEMORIA DE QR
        const urlParams = new URLSearchParams(window.location.search);
        const redirectDestinoReal = urlParams.get('redirect');

        if (redirectDestinoReal) {
          window.location.href = redirectDestinoReal; // Va directo al QR /asistencia/[id]
        } else {
          const rolUsuario = String(profileData.role || '').trim().toLowerCase();
          if (rolUsuario === 'superadmin') {
            window.location.href = '/superadmin';
          } else if (rolUsuario === 'admin' || rolUsuario === 'administrador') {
            window.location.href = '/dashboard/admin';
          } else {
            window.location.href = '/dashboard';
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
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 text-white shadow-2xl overflow-hidden">
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-cyan-500/20 backdrop-blur-md flex items-center justify-center text-cyan-400 text-2xl font-black shadow-lg">
            PYC
          </div>
          <div>
            <span className="text-[10px] font-black tracking-[0.25em] text-cyan-500 uppercase block mb-1">Organización Gremial</span>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">Sindicato <span className="text-cyan-400">PYC</span></h1>
          </div>
        </div>

        <div className="space-y-6 my-auto relative z-10">
          <div className="relative p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl text-white mb-6 shadow-lg shadow-cyan-500/20">
              {sindicalSlides[currentSlide].icon}
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-4">{sindicalSlides[currentSlide].title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium min-h-[80px]">{sindicalSlides[currentSlide].description}</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">© 2026 Sindicato PYC</div>
      </div>

      <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-950">
        <div className="w-full max-w-md bg-white/[0.02] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl">
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase">✨ Portal de Socios</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Bienvenido</h2>
            <p className="text-slate-400 text-sm font-medium">{redirectDestino ? 'Inicia sesión para registrar tu asistencia al instante.' : 'Ingresa tus credenciales para continuar.'}</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center gap-3">
              <span>⚠️</span> <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">RUT del Socio</label>
              <input type="text" required value={rut} onChange={(e) => setRut(e.target.value)} placeholder="11111111-1" className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                <Link href="/forgot-password" className="text-cyan-500 hover:text-cyan-400 text-xs font-bold">¿Olvidaste tu clave?</Link>
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest">
              {loading ? 'Verificando...' : (redirectDestino ? 'Ingresar y Confirmar Asistencia' : 'Ingresar al Portal')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}