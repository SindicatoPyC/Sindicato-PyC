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

        if (profileData.role === 'admin' || profileData.role === 'administrador') {
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
    <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-800 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-rose-900 selection:text-white">
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/30 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black shadow-lg">
            PYC
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-widest text-rose-300 uppercase block">
              Organización Gremial
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              Sindicato <span className="text-rose-400">PYC</span>
            </h1>
          </div>
        </div>

        <div className="space-y-6 my-auto relative z-10">
          <div className="relative p-8 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4 transition-all duration-700">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl text-white">
              {sindicalSlides[currentSlide].icon}
            </div>
            
            <h3 className="text-xl font-bold text-white tracking-tight transition-all duration-300">
              {sindicalSlides[currentSlide].title}
            </h3>
            
            <p className="text-rose-100/90 text-sm leading-relaxed font-medium min-h-[80px] transition-all duration-300">
              {sindicalSlides[currentSlide].description}
            </p>

            <div className="flex items-center gap-2 pt-2">
              {sindicalSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/30'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-rose-300/80 font-semibold flex items-center justify-between">
          <span>© 2026 Sindicato PYC</span>
          <span>Trabajadores Unidos</span>
        </div>
      </div>

      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-100/80 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-white backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full text-rose-900 text-xs font-bold tracking-wider uppercase">
              ✨ Portal de Socios
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h2>
            
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Ingresa tu RUT institucional para continuar
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-3">
              <span>⚠️</span> 
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                RUT del Socio
              </label>
              <input 
                type="text" 
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="11111111-1"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Contraseña
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
              <div className="flex justify-end pt-1">
                <Link href="/forgot-password" className="text-rose-900 text-xs font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div className="pt-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-rose-950 hover:bg-rose-900 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-950/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Verificando...' : 'Ingresar al Portal'}
              </button>
            </div>
          </form>

          {/* NUEVO BLOQUE DE POSTULACIÓN */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <span>¿Aún no eres parte del sindicato?</span>
            <Link href="/postular" className="bg-rose-50 text-rose-900 border border-rose-100 font-bold px-5 py-2.5 rounded-xl hover:bg-rose-100 transition-colors shadow-sm">
              Postularse aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}