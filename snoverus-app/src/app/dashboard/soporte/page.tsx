'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import emailjs from '@emailjs/browser';

export default function SoportePage() {
  const [rutUsuario, setRutUsuario] = useState<string>('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('Consulta General');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeData() {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
      const rut = sessionCookie ? sessionCookie.split('=')[1] : '12345678-9';
      setRutUsuario(rut);
      fetchTickets(rut);
    }
    initializeData();
  }, []);

  const fetchTickets = async (rut: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('tickets_soporte')
      .select('*')
      .eq('usuario_rut', rut)
      .order('created_at', { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const handleEnviarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const supabase = createClient();

    // 1. Guardar en la base de datos de Supabase
    const { error } = await supabase.from('tickets_soporte').insert([
      { 
        usuario_rut: rutUsuario, 
        asunto: `[${tipo}] ${asunto}`,
        mensaje: mensaje 
      }
    ]);

    if (error) {
      alert('Error al guardar el ticket en la base de datos: ' + error.message);
      setEnviando(false);
      return; 
    } 

    // 2. 🚀 Enviar Correo con la plantilla de EmailJS
    try {
      await emailjs.send(
        'service_thw7gfn',    // Tu Service ID
        'template_93ch74j',   // Tu Template ID
        {
          user_email: email,
          rutUsuario: rutUsuario,
          tipo: tipo,
          asunto: asunto,
          mensaje: mensaje,
        },
        'GG3tS19diXKenuD_-'   // Tu Public Key
      );
      console.log("¡Correo enviado con éxito!");
    } catch (err) {
      console.error("Error enviando correo con EmailJS:", err);
    }

    // 3. Notificación al usuario y reset del formulario
    alert('✅ ¡Solicitud ingresada correctamente! Se ha enviado un comprobante a tu correo.');
    setEmail('');
    setTipo('Consulta General');
    setAsunto('');
    setMensaje('');
    fetchTickets(rutUsuario);
    setEnviando(false);
  };

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'Resuelto': return 'bg-emerald-100 text-emerald-700';
      case 'En Revisión': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Centro de Soporte</h2>
             <p className="text-slate-500 max-w-2xl text-sm">
               ¿Tienes alguna duda sobre tus beneficios o un problema en la plataforma? Envía un ticket a la directiva y te responderemos a la brevedad.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Soporte */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 text-xl font-bold">🎧</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Abrir Nuevo Ticket</h3>
              </div>
            </div>

            <form onSubmit={handleEnviarTicket} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Solicitud</label>
                <select 
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Reclamo">Reclamo</option>
                  <option value="Beneficio">Solicitud de Beneficio Económico</option>
                  <option value="Asesoría Legal">Asesoría Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tu Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Asunto de tu consulta</label>
                <input 
                  type="text" 
                  required
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Problema con carga de documento..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Detalle del problema</label>
                <textarea 
                  required
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Explícanos tu situación con el mayor detalle posible..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={enviando}
                className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {enviando ? 'Guardando y Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </section>

          {/* Historial de Tickets */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 text-xl font-bold">📋</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Mis Tickets Activos</h3>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm text-center py-10">Cargando tu historial...</p>
            ) : tickets.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center">
                <span className="text-4xl mb-3">🍃</span>
                <p className="text-slate-500 font-medium">No tienes tickets de soporte en este momento.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl transition-all hover:bg-white hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-800 leading-tight">{ticket.asunto}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${getBadgeStyle(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{ticket.mensaje}</p>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        TICKET #{ticket.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString('es-CL')}
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