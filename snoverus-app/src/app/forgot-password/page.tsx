'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../lib/supabase'; 

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  
  // Estados de formulario
  const [rut, setRut] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [targetEmail, setTargetEmail] = useState(''); 
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // ----------------------------------------------------------------------
  // PASO 1: Buscar correo real mediante RUT y Solicitar Código
  // ----------------------------------------------------------------------
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    try {
      const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_por_rut', { 
        p_rut: cleanRut 
      });

      if (rpcError || !realEmail) {
        throw new Error('No encontramos una cuenta asociada a este RUT.');
      }

      setTargetEmail(realEmail); 

      const { error } = await supabase.auth.resetPasswordForEmail(realEmail);

      if (error) throw error;

      setSuccessMsg('Código enviado. Revisa tu bandeja de entrada.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hubo un problema al solicitar el código.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // PASO 2: Verificar Código y Actualizar Contraseña
  // ----------------------------------------------------------------------
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Verificamos el OTP con el correo real (inicia sesión temporal)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code,
        type: 'recovery',
      });

      if (verifyError) throw new Error('Código inválido o expirado.');

      // 2. Actualizamos la contraseña del usuario autenticado
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccessMsg('Contraseña actualizada. Redirigiendo...');
      
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-6 selection:bg-rose-900 selection:text-white">
      <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2rem] border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Restablecer Contraseña
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {step === 1 ? 'Enviaremos instrucciones a tu correo' : 'Ingresa el código que recibiste'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-3">
            <span>⚠️</span> 
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-3">
            <span>✅</span> 
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-5">
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
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-rose-950 hover:bg-rose-900 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-950/20 disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? 'Buscando perfil...' : 'Enviar código de recuperación'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Código de recuperación
              </label>
              <input 
                type="text" 
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ingresa el código"
                maxLength={8} 
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-center text-2xl tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Nueva Contraseña
              </label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-rose-950 hover:bg-rose-900 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-950/20 disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>

      </div>
    </div>
  );
}