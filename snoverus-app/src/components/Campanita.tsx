"use client";
import { useState, useEffect } from "react";
import { createClient } from "../app/lib/supabase";

export default function Campanita() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    cargarNotificaciones();

    // 🛡️ Corrección de sintaxis en el generador de string aleatorio
    const channelName = `notificaciones_${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones_sindicato' },
        (payload) => {
          setNotificaciones((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones_sindicato')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setNotificaciones(data);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  const marcarComoLeidas = async () => {
    setMostrarMenu(!mostrarMenu);
    try {
      await supabase
        .from('notificaciones_sindicato')
        .update({ leida: true })
        .eq('leida', false);
      
      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    } catch (err) {
      console.error("Error al actualizar notificaciones:", err);
    }
  };

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="relative">
      <button 
        onClick={marcarComoLeidas}
        className="relative p-2 text-slate-300 hover:text-white transition rounded-xl hover:bg-slate-800/50 focus:outline-none cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {noLeidasCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md animate-pulse">
            {noLeidasCount}
          </span>
        )}
      </button>

      {mostrarMenu && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Centro de Alertas</span>
            <span className="text-[10px] bg-blue-600/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full">
              {notificaciones.length} Totales
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold">
                No hay notificaciones nuevas.
              </div>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-slate-800/40 transition ${!n.leida ? 'bg-slate-800/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white">{n.titulo}</h4>
                    <span className="text-[9px] text-slate-500">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{n.mensaje}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}