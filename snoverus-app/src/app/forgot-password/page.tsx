'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setMessage('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al intentar enviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-800 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-rose-900 selection:text-white">
      
      {/* 🍷 PANEL IZQUIERDO DE ALTO CONTRASTE */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-center p-12 xl:p-16 relative z-10 bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-4xl font-black shadow-lg">
            🔐
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Recuperación de Acceso
          </h1>
          <p className="text-rose-100/90 text-sm leading-relaxed font-medium max-w-md mx-auto">
            No te preocupes, el Sindicato PYC respalda tu información. Ingresa tu correo y te ayudaremos a volver al portal.
          </p>
        </div>
      </div>

      {/* 📋 PANEL DERECHO: Formulario de Recuperación */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-100/80 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-white backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative">
          
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Restablecer Contraseña
            </h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Enviaremos instrucciones a tu correo institucional
            </p>
          </div>

          {errorMsg && (
             <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-3">
               <span>⚠️</span> <span>{errorMsg}</span>
             </div>
          )}

          {message ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-semibold">
                ✅ {message}
              </div>
              <Link href="/" className="inline-block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all text-sm">
                Volver al Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@sindicatopyc.cl"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-900 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
                />
              </div>

              <div className="pt-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-rose-950 hover:bg-rose-900 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-950/20 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/" className="text-slate-500 font-bold hover:text-slate-800 text-xs transition-colors">
              ← Volver al inicio de sesión
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}