'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function CredencialPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Datos del socio
  const [socio, setSocio] = useState({
    nombres: "Cargando...",
    apellidos: "",
    rut: "",
    rol: "Socio Activo"
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function fetchSocioData() {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
      
      if (sessionCookie) {
        const rutSesion = sessionCookie.split('=')[1];
        
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('rut', rutSesion)
            .single();

          if (data && !error) {
            setSocio({
              nombres: data.nombres || 'Socio',
              apellidos: data.apellidos || 'Snoverus',
              rut: data.rut,
              rol: data.rol === 'Administrador' ? 'Directiva' : 'Socio Activo'
            });
          }
        } catch (error) {
          console.error("Error cargando perfil:", error);
        }
      }
    }

    fetchSocioData();
  }, [isMounted]);

  const qrUrl = socio.rut 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SindicatoSnoverus_Validacion_${socio.rut}`
    : 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Cargando...';

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 flex flex-col">
      
      {/* Área de la Credencial Centrada */}
      <main className="flex-grow flex items-center justify-center p-4 mt-8">
        
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 relative transform transition-transform hover:scale-[1.02] duration-300">
          
          {/* Header Credencial (Diseño Tarjeta de Identidad) */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-6 flex justify-between items-center relative overflow-hidden h-32">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            <div className="relative z-10 flex items-center gap-3 mt-[-20px]">
              <div className="bg-white text-blue-800 font-black text-xl p-2 rounded-xl shadow-md">SN</div>
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight leading-tight">SNOVERUS</h2>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Sindicato de Trabajadores</p>
              </div>
            </div>
          </div>

          {/* Cuerpo Credencial */}
          <div className="px-8 pb-8 text-center relative">
            
            {/* Foto de Perfil Dinámica */}
            <div className="w-28 h-28 mx-auto bg-slate-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center mb-4 -mt-14 relative z-20">
              <span className="text-5xl">{socio.rol === 'Directiva' ? '👔' : '👷🏽‍♂️'}</span>
            </div>

            {/* Nombres y Apellidos desde BD */}
            <h3 className="text-xl font-black text-slate-900 uppercase leading-none mb-1">{socio.nombres}</h3>
            <h4 className="text-lg font-bold text-slate-500 uppercase mb-5">{socio.apellidos}</h4>

            {/* Datos Técnicos */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6">
              <div className="flex justify-between items-center text-left mb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RUT</p>
                  <p className="text-sm font-extrabold text-slate-800">{socio.rut || '---'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vigencia</p>
                  <p className="text-sm font-extrabold text-slate-800">12/2026</p>
                </div>
              </div>
              <div className="text-left border-t border-slate-200 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</p>
                  <p className="text-sm font-extrabold text-blue-600">{socio.rol}</p>
              </div>
            </div>

            {/* Código QR Real de Validación */}
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 w-fit mx-auto mb-4 shadow-inner">
              <img src={qrUrl} alt="Código QR de Validación" className="w-32 h-32 opacity-90" />
            </div>

            <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto mb-5 leading-tight">
              Escanea este código QR en establecimientos adheridos para validar tus beneficios sindicales.
            </p>

            {/* Sello de Vigencia Animado */}
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 py-2.5 rounded-xl flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="font-extrabold uppercase tracking-widest text-[11px]">Afiliación al Día</span>
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
}