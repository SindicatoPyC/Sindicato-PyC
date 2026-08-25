'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function SolidarioPage() {
  const [isMounted, setIsMounted] = useState(false);

  // 🛡️ Estado de Usuario
  const [rutUsuario, setRutUsuario] = useState<string>('');

  // Estados del Formulario
  const [tipoBeneficio, setTipoBeneficio] = useState('Salud / Emergencia Médica');
  const [monto, setMonto] = useState('150000');
  const [descripcion, setDescripcion] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Historial de Solicitudes
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function initSolidario() {
      // 1. Leer cookies de sesión
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
      const rut = sessionCookie ? sessionCookie.split('=')[1] : '12345678-9';
      setRutUsuario(rut);

      // 2. Traer el historial de solicitudes del socio
      fetchSolicitudes(rut);
    }

    initSolidario();
  }, [isMounted]);

  const fetchSolicitudes = async (rut: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('fondo_solidario')
        .select('*')
        .eq('usuario_rut', rut)
        .order('created_at', { ascending: false });

      if (Array.isArray(data)) setSolicitudes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('fondo_solidario').insert([{
        usuario_rut: rutUsuario,
        tipo_beneficio: tipoBeneficio,
        monto_solicitado: Number(monto),
        descripcion: descripcion,
        estado: 'En Revisión'
      }]);

      if (!error) {
        alert('✅ Solicitud enviada a la Directiva correctamente.');
        setDescripcion('');
        fetchSolicitudes(rutUsuario);
      } else {
        alert('Error: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rechazado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cabecera Estilo Emergencia */}
        <div className="bg-gradient-to-br from-rose-600 to-red-800 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-rose-500/30 text-rose-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Apoyo Mutuo y Solidaridad</span>
            <h2 className="text-3xl font-black mb-2">Fondo de Auxilio Solidario</h2>
            <p className="text-rose-100 text-sm leading-relaxed">
              Fondo de emergencia financiado por la cuota sindical para brindar asistencia económica directa en momentos críticos o imprevistos de nuestros socios y sus familias.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 lg:col-span-1 h-fit">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🆘</span> Solicitar Auxilio
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Causal de Solicitud</label>
                <select value={tipoBeneficio} onChange={(e) => setTipoBeneficio(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white font-medium text-sm focus:border-rose-500 outline-none text-slate-900">
                  <option value="Salud / Emergencia Médica">Salud / Emergencia Médica</option>
                  <option value="Bono Nacimiento / Maternidad">Bono Nacimiento / Maternidad</option>
                  <option value="Auxilio por Defunción Fam. Directo">Auxilio por Defunción Fam. Directo</option>
                  <option value="Siniestro / Catástrofe">Siniestro / Catástrofe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Monto Estimado ($ CLP)</label>
                <input type="number" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-sm focus:border-rose-500 outline-none text-slate-900" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Motivo o Justificación Breve</label>
                <textarea required rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe brevemente la situación..." className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-sm focus:border-rose-500 outline-none resize-none text-slate-900"></textarea>
              </div>

              <button type="submit" disabled={submitLoading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50">
                {submitLoading ? 'Enviando...' : 'Enviar Solicitud al Directorio'}
              </button>
            </form>
          </section>

          {/* Historial de Solicitudes */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>📋</span> Registro de Tramitaciones
            </h3>

            {loading ? (
              <p className="text-slate-400 text-center py-10">Cargando tramitaciones...</p>
            ) : solicitudes.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center flex flex-col items-center">
                <span className="text-4xl mb-3 opacity-50">📂</span>
                <p className="text-slate-500 font-medium">No has realizado solicitudes al fondo solidario.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {solicitudes.map((item) => (
                  <div key={item.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                          {item.tipo_beneficio}
                        </span>
                        <span className="text-xs font-bold text-slate-400">ID #{item.id}</span>
                      </div>
                      <p className="font-extrabold text-slate-800 text-base mt-2">${Number(item.monto_solicitado).toLocaleString('es-CL')} CLP</p>
                      <p className="text-xs text-slate-600 mt-1">{item.descripcion}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${getBadgeStyle(item.estado)}`}>
                        {item.estado}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(item.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </main>
    </div>
  );
}