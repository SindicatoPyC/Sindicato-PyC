'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';

export default function PostularPage() {
  const [rut, setRut] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePostular = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    try {
      const supabase = createClient();

      // Verificar si el RUT ya está en la tabla de profiles (ya es socio) usando maybeSingle()
      const { data: socioExistente } = await supabase
        .from('profiles')
        .select('id')
        .eq('rut', cleanRut)
        .maybeSingle();

      if (socioExistente) {
        throw new Error('Este RUT ya está registrado como socio activo. Inicia sesión.');
      }

      // Verificar si ya tiene una postulación pendiente usando maybeSingle()
      const { data: postulacionExistente } = await supabase
        .from('postulaciones')
        .select('id')
        .eq('rut', cleanRut)
        .eq('estado', 'Pendiente')
        .maybeSingle();

      if (postulacionExistente) {
        throw new Error('Ya tienes una postulación en revisión con este RUT.');
      }

      // Insertar nueva postulación
      const { error: insertError } = await supabase
        .from('postulaciones')
        .insert([{
          rut: cleanRut,
          full_name: fullName,
          email: email,
          estado: 'Pendiente'
        }]);

      if (insertError) throw insertError;

      setEnviado(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar la postulación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-800 flex items-center justify-center p-6 relative selection:bg-rose-900 selection:text-white overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-400/20 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <div className="w-full max-w-xl bg-white/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative z-10">
        
        {enviado ? (
          <div className="text-center space-y-6 py-8 animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
              ✓
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Postulación Enviada</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
              Tus datos han sido recibidos correctamente. La directiva revisará tu solicitud y, una vez aprobada, recibirás tus credenciales de acceso en el correo <strong>{email}</strong>.
            </p>
            <div className="pt-6">
              <Link href="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg text-sm">
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full text-rose-900 text-[10px] font-black tracking-widest uppercase">
                Formulario de Ingreso
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Postular al Sindicato
              </h2>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Ingresa tus datos para solicitar validación
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-3">
                <span>⚠️</span> 
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostular} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                  Nombre Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                  RUT
                </label>
                <input 
                  type="text" 
                  required
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="11111111-1"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-900 focus:ring-2 focus:ring-rose-900/20 transition-all font-medium text-sm shadow-sm"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-rose-950 hover:bg-rose-900 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-rose-950/20 disabled:opacity-50 text-sm tracking-widest uppercase cursor-pointer"
                >
                  {loading ? 'Enviando Datos...' : 'Enviar Postulación'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center flex items-center justify-between text-xs font-medium text-slate-500">
              <span>¿Ya eres socio validado?</span>
              <Link href="/" className="text-rose-900 font-bold hover:underline">
                Volver al Inicio de Sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}