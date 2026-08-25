'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function NegociacionPage() {
  const [hitos, setHitos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHitos() {
      // Consultamos los hitos
      const supabase = createClient();
      const { data } = await supabase
        .from('hitos_negociacion')
        .select('*')
        .order('fecha', { ascending: true });

      if (data) setHitos(data);
      setLoading(false);
    }
    fetchHitos();
  }, []);

  const getTimelineStyle = (estado: string) => {
    switch (estado) {
      case 'Completado': return { dot: 'bg-emerald-500 border-emerald-200', card: 'border-emerald-200 bg-emerald-50/30', icon: '✅' };
      case 'Actual': return { dot: 'bg-blue-600 border-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse', card: 'border-blue-400 bg-blue-50 shadow-md', icon: '🔥' };
      default: return { dot: 'bg-slate-300 border-slate-100', card: 'border-slate-200 bg-slate-50 opacity-70', icon: '⏳' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 mt-8 space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-rose-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
               <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Negociación Colectiva 2026</h2>
               <p className="text-slate-500 max-w-2xl text-sm">
                 Sigue en tiempo real el avance legal de nuestro pliego de peticiones. La información es oficial y transparente.
               </p>
             </div>
             
             <button className="bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0">
               <span>📄</span> Descargar Petitorio
             </button>
           </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <span>⏱️</span> Cronograma Legal
          </h3>

          {loading ? (
            <p className="text-center text-slate-400 py-10">Cargando cronograma...</p>
          ) : (
            <div className="relative border-l-4 border-slate-100 ml-4 sm:ml-8 space-y-10 pb-4">
              {hitos.map((hito) => {
                const styles = getTimelineStyle(hito.estado);
                return (
                  <div key={hito.id} className="relative ml-8 sm:ml-12 group">
                    <span className={`absolute -left-[45px] sm:-left-[63px] flex h-6 w-6 items-center justify-center rounded-full border-4 ring-8 ring-white ${styles.dot}`}></span>
                    
                    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${styles.card}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          {styles.icon} {hito.titulo}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-lg">
                            {hito.fecha}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-white border ${hito.estado === 'Actual' ? 'text-blue-600 border-blue-200' : 'text-slate-500 border-slate-200'}`}>
                            {hito.estado}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {hito.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}