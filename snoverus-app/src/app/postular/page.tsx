'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';

export default function PostularPage() {
  const [rut, setRut] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sindicatoId, setSindicatoId] = useState('');
  
  const [sindicatos, setSindicatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar la lista completa de sindicatos disponibles al montar el componente
  useEffect(() => {
    async function cargarSindicatos() {
      const supabase = createClient();
      
      // Eliminamos el .eq('estado', 'Activo') para traerlos todos y filtrar localmente
      const { data, error } = await supabase
        .from('sindicatos')
        .select('id, nombre, estado');
      
      if (!error && data) {
        // Mostramos todos excepto los que estén explícitamente suspendidos
        const sindicatosVisibles = data.filter(s => 
          !s.estado || s.estado.toLowerCase() !== 'suspendido'
        );
        setSindicatos(sindicatosVisibles);
      }
    }
    cargarSindicatos();
  }, []);

  const handlePostular = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!sindicatoId) {
      setErrorMsg('Debes seleccionar la organización a la que deseas postular.');
      setLoading(false);
      return;
    }

    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    try {
      const supabase = createClient();

      const { data: socioExistente } = await supabase
        .from('profiles')
        .select('id')
        .eq('rut', cleanRut)
        .eq('sindicato_id', parseInt(sindicatoId))
        .maybeSingle();

      if (socioExistente) {
        throw new Error('Este RUT ya está registrado como socio activo en esta organización. Inicia sesión.');
      }

      const { data: postulacionExistente } = await supabase
        .from('postulaciones')
        .select('id')
        .eq('rut', cleanRut)
        .eq('sindicato_id', parseInt(sindicatoId))
        .eq('estado', 'Pendiente')
        .maybeSingle();

      if (postulacionExistente) {
        throw new Error('Ya tienes una postulación en revisión con este RUT para esta organización.');
      }

      const { error: insertError } = await supabase
        .from('postulaciones')
        .insert([{
          rut: cleanRut,
          full_name: fullName,
          email: email,
          telefono: telefono, 
          estado: 'Pendiente',
          sindicato_id: parseInt(sindicatoId)
        }]);

      if (insertError) throw insertError;

      setEnviado(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar la postulación. Verifica las políticas RLS en Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#040814] font-sans text-slate-200 flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-600 selection:text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full max-w-xl bg-gradient-to-b from-slate-900/90 to-[#071324]/90 p-8 sm:p-12 rounded-[2rem] border border-cyan-900/50 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)] relative z-20 backdrop-blur-2xl">
        
        {enviado ? (
          <div className="text-center space-y-6 py-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <span className="text-4xl text-white">✓</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">Postulación Enviada</h2>
            <p className="text-cyan-100/70 text-sm font-medium leading-relaxed max-w-md mx-auto">
              Tus datos han sido recibidos. La directiva revisará tu solicitud y recibirás tus credenciales vía número de teléfono y en el correo <strong>{email}</strong>.
            </p>
            <div className="pt-6">
              <Link href="/" className="inline-block bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm border border-cyan-400/20">
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3 mb-10">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                📋 Formulario de Ingreso
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                Postular a la Organización
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                Ingresa tus datos y selecciona tu sindicato
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm font-semibold flex items-center gap-3 shadow-inner">
                <span className="text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">⚠️</span> 
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostular} className="space-y-6">
              
              {/* Selector de Sindicato */}
              <div className="space-y-2 group">
                <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                  Organización a Postular
                </label>
                <select 
                  required
                  value={sindicatoId}
                  onChange={(e) => setSindicatoId(e.target.value)}
                  className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner appearance-none"
                >
                  <option value="" disabled>Selecciona tu organización...</option>
                  {sindicatos.map((sindicato) => (
                    <option key={sindicato.id} value={sindicato.id}>
                      {sindicato.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                  Nombre Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                    RUT
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
                  <label className="block text-[11px] font-bold text-amber-500 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-amber-400 flex justify-between">
                    <span>Número de teléfono</span>
                    <span className="text-slate-500 text-[9px]">+569</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="987654321"
                    className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[11px] font-bold text-cyan-600 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-cyan-400 drop-shadow-sm">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  className="w-full bg-[#0a1128] border border-cyan-900/60 rounded-xl px-5 py-4 text-cyan-50 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-[#0d1838] transition-all font-medium text-sm shadow-inner"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 text-sm tracking-widest uppercase border border-cyan-400/20"
                >
                  {loading ? 'Enviando Datos...' : 'Enviar Postulación'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-cyan-900/30 text-center flex items-center justify-between text-xs font-medium text-slate-500">
              <span>¿Ya eres socio validado?</span>
              <Link href="/" className="text-cyan-500 font-bold hover:text-cyan-300 transition-colors drop-shadow-[0_0_2px_rgba(6,182,212,0.8)]">
                Volver al Inicio de Sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}