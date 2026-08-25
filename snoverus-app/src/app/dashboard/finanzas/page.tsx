'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function FinanzasPage() {
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Socio de prueba actual
  const rutSocio = '12345678-9';

  // Datos simulados para el gráfico de Transparencia Sindical
  const gastosSindicato = [
    { name: 'Asesoría Legal', value: 35, color: '#3B82F6' },
    { name: 'Beneficios y Bonos', value: 45, color: '#10B981' },
    { name: 'Gastos Administrativos', value: 15, color: '#F59E0B' },
    { name: 'Fondo de Huelga', value: 5, color: '#6366F1' },
  ];

  useEffect(() => {
    async function fetchFinanzas() {
      // Consultamos las cuotas
      const supabase = createClient();
      const { data } = await supabase
        .from('cuotas_sindicales')
        .select('*')
        .eq('usuario_rut', rutSocio)
        .order('id', { ascending: false });

      if (data) setCuotas(data);
      setLoading(false);
    }
    
    fetchFinanzas();
  }, []);

  const cuotaAlDia = cuotas.length > 0 && cuotas[0].estado === 'Pagado';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cabecera */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
               <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Tesorería y Finanzas</h2>
               <p className="text-slate-500 max-w-2xl text-sm">
                 Revisa el estado de tus cuotas sindicales y el balance de transparencia de nuestra organización.
               </p>
             </div>
             <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-sm ${cuotaAlDia ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span className="text-2xl">{cuotaAlDia ? '✅' : '⚠️'}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Estado de Cuota</p>
                  <p className="text-sm font-extrabold">{cuotaAlDia ? 'Al Día' : 'Pendiente de Pago'}</p>
                </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Historial de Cuotas del Socio */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 text-xl font-bold">💳</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Mi Historial de Pagos</h3>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm text-center py-10">Cargando registros...</p>
            ) : cuotas.length === 0 ? (
              <p className="text-slate-500 font-medium text-center py-10">No hay registros de cuotas.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left bg-slate-50">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Período</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.map((cuota) => (
                      <tr key={cuota.id} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                        <td className="p-4 font-bold text-slate-800">{cuota.mes} {cuota.anio}</td>
                        <td className="p-4 text-slate-600 font-medium">${cuota.monto.toLocaleString('es-CL')}</td>
                        <td className="p-4 text-right">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${cuota.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {cuota.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Gráfico de Transparencia (BI) */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 text-xl font-bold">📊</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Transparencia Sindical</h3>
                <p className="text-xs text-slate-500">Distribución del gasto anual proyectado</p>
              </div>
            </div>

            <div className="h-64 w-full flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gastosSindicato} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {gastosSindicato.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Leyenda manual para mejor diseño */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full px-4">
                {gastosSindicato.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name} ({item.value}%)
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}