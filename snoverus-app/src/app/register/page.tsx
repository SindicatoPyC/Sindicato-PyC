'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase'; 

// 🔄 SLIDES PARA EL CARRUSEL DE REGISTRO
const sindicalSlides = [
  {
    icon: "🚀",
    title: "Súmate a Nuestra Comunidad",
    description: "Forma parte del Sindicato PYC. Regístrate con tu RUT, nombre y correo institucional para acceder a todos los beneficios y asambleas virtuales."
  },
  {
    icon: "🤝",
    title: "Respaldo y Colectividad",
    description: "Unidos protegemos nuestros derechos laborales, impulsamos mejores condiciones y construimos un futuro sólido para nuestras familias."
  },
  {
    icon: "🛡️",
    title: "Seguridad y Confianza",
    description: "Tu cuenta de socio está protegida bajo estrictos estándares de privacidad y cifrado institucional."
  }
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sindicalSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Guardar el RUT, el correo, el nombre y el rol 'socio' en la tabla 'profiles'
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authData.user.id, 
              rut: rut, 
              email: email,
              full_name: fullName,
              role: 'socio' // 👈 Rol por defecto para cualquier nuevo registro
            }
          ]);

        if (profileError) {
          console.error("Error al guardar perfil:", profileError.message);
        }

        setSuccessMsg('¡Registro exitoso! Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          router.push('/');
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrarse en el sistema. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-800 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-rose-900 selection:text-white">
      
      {/* 🍷 PANEL IZQUIERDO DE ALTO CONTRASTE */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 text-white shadow-2xl overflow-hidden">
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/30 blur-[100px] rounded-full pointer-events-none"></div>

        {/* LOGOTIPO OFICIAL */}
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

        {/* Carrusel Dinámico */}
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

      {/* 📋 PANEL DERECHO: Formulario de Registro con Nombre, RUT y Correo */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-100/80 backdrop-blur-sm">
        
        <div className="w-full max-w-lg bg-white backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative">
          
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full text-rose-900 text-xs font-bold tracking-wider uppercase">
              📝 Registro Institucional
            </div>
            
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Crear Nueva Cuenta
            </h2>
            
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Completa tus datos para afiliarte al portal
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-3">
              <span>⚠️</span> 
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-3">
              <span>✅</span> 
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Nombre Completo
              </label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez Soto"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                RUT del Socio
              </label>
              <input 
                type="text" 
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="11111111-1"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Correo Electrónico Institucional
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@sindicatopyc.cl"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Contraseña
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Confirmar Contraseña
              </label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-rose-950 hover:bg-rose-900 text-white font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-950/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Registrando socio...' : 'Completar Registro'}
              </button>
            </div>
          </form>

          {/* Enlace de regreso al Login (Ruta raíz) */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center flex items-center justify-between text-xs font-medium text-slate-500">
            <span>¿Ya tienes una cuenta?</span>
            <Link href="/" className="text-rose-900 font-bold hover:underline">
              Iniciar Sesión aquí
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}