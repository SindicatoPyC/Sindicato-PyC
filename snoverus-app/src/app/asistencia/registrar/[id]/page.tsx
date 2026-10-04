'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase'; 

export default function RegistrarAsistenciaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [estado, setEstado] = useState<'cargando' | 'exito' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('Validando tu asistencia para el quórum...');

  useEffect(() => {
    async function registrar() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setEstado('error');
        setMensaje('Debes iniciar sesión en la plataforma primero.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('sindicato_id, rut').eq('id', user.id).single();
      const { data: asamblea } = await supabase.from('asambleas_votaciones').select('sindicato_id, estado, titulo').eq('id', params.id).single();

      if (!asamblea || asamblea.sindicato_id !== profile?.sindicato_id) {
        setEstado('error');
        setMensaje('Esta asamblea no pertenece a tu organización.');
        return;
      }

      if (asamblea.estado !== 'Abierta') {
        setEstado('error');
        setMensaje('El registro para esta asamblea ya se encuentra cerrado.');
        return;
      }

      // 1. Registro de asistencia para el quórum global
      const { error } = await supabase.from('asistencia_asambleas').insert([{
        asamblea_titulo: asamblea.titulo,
        usuario_rut: profile.rut,
        user_id: user.id,
        estado: 'Presente'
      }]);

      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          setEstado('exito');
          setMensaje('Tu asistencia ya estaba registrada en el quórum.');
        } else {
          setEstado('error');
          setMensaje('Error al registrar. Intenta de nuevo.');
        }
      } else {
        setEstado('exito');
        setMensaje(`¡Asistencia confirmada para: ${asamblea.titulo}!`);
      }
    }
    
    registrar();
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
        {estado === 'cargando' && (
          <div className="animate-pulse space-y-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black text-slate-700">{mensaje}</p>
          </div>
        )}
        
        {estado === 'exito' && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className="text-7xl mb-6 drop-shadow-sm">✅</div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">¡Presente!</h2>
            <p className="text-slate-500 font-medium">{mensaje}</p>
            {/* 2. Redirección directa a Jitsi */}
            <button onClick={() => router.push('/asamblea')} className="mt-8 w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors uppercase tracking-widest text-xs">
              Entrar a la Asamblea Virtual
            </button>
          </div>
        )}

        {estado === 'error' && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className="text-7xl mb-6 drop-shadow-sm">⚠️</div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Acceso Denegado</h2>
            <p className="text-rose-500 font-bold">{mensaje}</p>
            <button onClick={() => router.push('/dashboard')} className="mt-8 w-full bg-slate-100 text-slate-700 font-black py-4 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs">
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}