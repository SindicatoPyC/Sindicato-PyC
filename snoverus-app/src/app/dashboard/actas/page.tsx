'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function ActasPage() {
  const [actas, setActas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActas() {
      // Traer actas de Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from('libro_actas')
        .select('*')
        .order('fecha_reunion', { ascending: false });

      if (!error && data) {
        setActas(data);
      }
      setLoading(false);
    }
    
    fetchActas();
  }, []);

  const getBadgeStyle = (tipo: string) => {
    switch (tipo) {
      case 'Extraordinaria': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Directorio': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200'; // Ordinaria
    }
  };

  // Función segura contra errores de hidratación de Next.js
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`; // DD-MM-YYYY
    }
    return fechaStr;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cabecera */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Libro de Actas y Acuerdos</h2>
             <p className="text-slate-500 max-w-2xl text-sm">
               Repositorio oficial y transparente de todas las actas de asambleas ordinarias, extraordinarias y reuniones de directorio de SNOVERUS S.A.
             </p>
           </div>
        </div>

        {/* Lista de Actas */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span>📜</span> Registro Histórico Oficial
          </h3>

          {loading ? (
            <p className="text-center text-slate-400 py-10">Cargando actas registradas...</p>
          ) : actas.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No hay actas registradas en el sistema.</p>
          ) : (
            <div className="space-y-6">
              {actas.map((acta) => (
                <div key={acta.id} className="p-6 border border-slate-200 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${getBadgeStyle(acta.tipo_asamblea)}`}>
                        {acta.tipo_asamblea}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        📅 {formatearFecha(acta.fecha_reunion)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg leading-snug">{acta.titulo}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{acta.resumen_acuerdos}</p>
                  </div>

                  <a 
                    href={acta.url_acta_pdf} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-2"
                  >
                    <span>📥</span> Descargar Acta (PDF)
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}