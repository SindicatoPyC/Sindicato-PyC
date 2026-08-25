'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function PerfilPage() {
  const [votosHistoricos, setVotosHistoricos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // RUT del administrador/socio activo actual para la demo
  const rutSocio = '11111111-1';

  useEffect(() => {
    async function fetchPerfilData() {
      // Traer votos históricos
      const supabase = createClient();
      const { data } = await supabase
        .from('votos_registrados')
        .select('*, asambleas_votaciones(titulo)')
        .eq('usuario_rut', rutSocio);

      if (data) setVotosHistoricos(data);
      setLoading(false);
    }
    fetchPerfilData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Tarjeta de Identidad del Socio */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-100 opacity-50 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-2xl w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
                AM
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Alexander Montenegro</h2>
                <p className="text-slate-500 font-medium text-sm">Socio Activo - Operaciones</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Vigente</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RUT Registrado</span>
              <span className="text-sm font-extrabold text-slate-800">{rutSocio}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Organización</span>
              <span className="text-sm font-extrabold text-slate-800">SNOVERUS S.A.</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha de Afiliación</span>
              <span className="text-sm font-extrabold text-slate-800">15/03/2021</span>
            </div>
          </div>
        </div>

        {/* Historial y Auditoría de Votación */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 text-xl font-bold">🛡️</div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Historial y Auditoría de Participación</h3>
              <p className="text-sm text-slate-500">Registro inmutable de votos emitidos desde la base de datos</p>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm text-center py-6">Cargando registros de auditoría...</p>
          ) : votosHistoricos.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">
              No registras votos históricos en asambleas pasadas.
            </div>
          ) : (
            <div className="space-y-4">
              {votosHistoricos.map((voto) => (
                <div key={voto.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">ID VOTO: #{voto.id.toString().toUpperCase()}</span>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded">VERIFICADO</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">{voto.asambleas_votaciones?.titulo || 'Asamblea General'}</h4>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Opción Registrada</span>
                    <span className="text-sm font-extrabold text-emerald-600 uppercase">{voto.opcion_elegida}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}