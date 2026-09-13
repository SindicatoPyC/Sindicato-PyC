"use client";
import { useState, useEffect } from "react";
import { createClient } from "../app/lib/supabase";
import Link from "next/link";

export default function Campanita() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let canalActivo: any = null; // Guardamos la referencia del canal para limpiarlo correctamente

    const initCampanita = async () => {
      // 1. Identificar al usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        cargarNotificaciones(user.id);

        // 2. Generamos un nombre único con Date.now() para evitar choques al recargar
        const channelName = `notificaciones_${user.id}_${Date.now()}`;
        
        // 3. Encadenamos .on() y luego .subscribe() al final, guardándolo en la variable
        canalActivo = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notificaciones', // Apuntando a la tabla correcta
              filter: `user_id=eq.${user.id}` // Solo alertas de este usuario
            },
            (payload) => {
              setNotificaciones((prev) => [payload.new, ...prev]);
            }
          )
          .subscribe();
      }
    };

    initCampanita();

    // Limpieza al desmontar el componente (vital para evitar el error rojo en Next.js)
    return () => {
      if (canalActivo) {
        supabase.removeChannel(canalActivo);
      }
    };
  }, []);

  const cargarNotificaciones = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('notificaciones') 
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10); // Cargamos las últimas 10

      if (error) throw error;
      if (data) setNotificaciones(data);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  const marcarComoLeidas = async () => {
    setMostrarMenu(!mostrarMenu);
    
    if (!userId) return;

    try {
      // Actualizamos a 'leido: true' en la base de datos
      await supabase
        .from('notificaciones')
        .update({ leido: true }) 
        .eq('user_id', userId)
        .eq('leido', false);
      
      // Actualizamos visualmente al instante
      setNotificaciones(notificaciones.map(n => ({ ...n, leido: true })));
    } catch (err) {
      console.error("Error al actualizar notificaciones:", err);
    }
  };

  // Contamos usando la columna correcta 'leido'
  const noLeidasCount = notificaciones.filter(n => !n.leido).length;

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
        <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Centro de Alertas</span>
            <span className="text-[10px] bg-blue-600/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full">
              {notificaciones.length} Totales
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 hide-scrollbar">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold">
                No hay notificaciones nuevas.
              </div>
            ) : (
              notificaciones.map((n) => (
                <Link 
                  href={n.enlace || '/dashboard'} 
                  key={n.id} 
                  className={`block p-4 hover:bg-slate-800/40 transition ${!n.leido ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white">{n.titulo}</h4>
                    <span className="text-[9px] text-slate-500">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{n.mensaje}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}