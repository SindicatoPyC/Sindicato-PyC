'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function EncuestasPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Estados de Encuestas
  const [encuestas, setEncuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function initEncuestas() {
      // Traer las encuestas desde Supabase
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('encuestas_clima')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (Array.isArray(data)) setEncuestas(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    initEncuestas();
  }, [isMounted]);

  const handleVotar = async (id: number, opcion: 'a' | 'b', votosActuales: number) => {
    try {
      const supabase = createClient();
      const campo = opcion === 'a' ? 'votos_a' : 'votos_b';
      
      // Sumamos 1 voto a la opción elegida
      const { error } = await supabase
        .from('encuestas_clima')
        .update({ [campo]: votosActuales + 1 })
        .eq('id', id);

      if (!error) {
        // Actualizamos el estado local para ver la animación de la barra de inmediato
        setEncuestas(encuestas.map(e => e.id === id ? { ...e, [campo]: votosActuales + 1 } : e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cabecera del Módulo */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Encuestas y Clima Laboral</h2>
             <p className="text-slate-500 max-w-2xl text-sm">
               Tu opinión es fundamental. Ayúdanos a definir prioridades, evaluar beneficios y mejorar las condiciones respondiendo estas consultas rápidas.
             </p>
           </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-10">Cargando consultas activas...</p>
        ) : encuestas.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
             <span className="text-5xl mb-4 block">🍃</span>
             <p className="text-slate-500 font-medium">No hay encuestas activas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {encuestas.map((item) => {
              // Calcular porcentajes dinámicos
              const total = (item.votos_a || 0) + (item.votos_b || 0);
              const pctA = total === 0 ? 0 : Math.round((item.votos_a / total) * 100);
              const pctB = total === 0 ? 0 : Math.round((item.votos_b / total) * 100);

              return (
                <div key={item.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.categoria}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 mt-3 leading-snug">{item.titulo}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                      👥 {total} votos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* Botón Opción A */}
                    <button 
                      onClick={() => handleVotar(item.id, 'a', item.votos_a)} 
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition-all text-left group overflow-hidden relative"
                    >
                      <div className="flex justify-between font-bold text-slate-800 text-sm mb-3 relative z-10">
                        <span className="pr-4">{item.opcion_a}</span>
                        <span className="text-blue-600">{pctA}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 relative z-10">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pctA}%` }}></div>
                      </div>
                    </button>

                    {/* Botón Opción B */}
                    <button 
                      onClick={() => handleVotar(item.id, 'b', item.votos_b)} 
                      className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 transition-all text-left group overflow-hidden relative"
                    >
                      <div className="flex justify-between font-bold text-slate-800 text-sm mb-3 relative z-10">
                        <span className="pr-4">{item.opcion_b}</span>
                        <span className="text-indigo-600">{pctB}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 relative z-10">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pctB}%` }}></div>
                      </div>
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}