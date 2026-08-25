'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase';

export default function AsistenciaPage() {
  const router = useRouter();
  
  // 🛡️ Estados de Usuario
  const [rutUsuario, setRutUsuario] = useState<string>('');

  // Estados de Asistencia
  const [asambleaActiva, setAsambleaActiva] = useState<any>(null);
  const [historialAsistencias, setHistorialAsistencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    async function initAsistencia() {
      // 1. Leer cookies de sesión
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
      const rut = sessionCookie ? sessionCookie.split('=')[1] : '12345678-9';
      setRutUsuario(rut);

      // 2. Buscar asambleas abiertas en Supabase
      const supabase = createClient();
      const { data: asamData } = await supabase
        .from('asambleas_votaciones')
        .select('*')
        .eq('estado', 'Abierta')
        .limit(1);

      if (asamData && asamData.length > 0) {
        setAsambleaActiva(asamData[0]);
      }

      // 3. Traer el historial de asistencias del socio
      const { data: asistData } = await supabase
        .from('asistencia_asambleas')
        .select('*')
        .eq('usuario_rut', rut)
        .order('fecha_asistencia', { ascending: false });

      if (asistData) setHistorialAsistencias(asistData);

      setLoading(false);
    }

    initAsistencia();
  }, []);

  const handleCheckInQR = async () => {
    if (!asambleaActiva) return;
    setRegistrando(true);
    const supabase = createClient();

    const { error } = await supabase.from('asistencia_asambleas').insert([
      { asamblea_titulo: asambleaActiva.titulo, usuario_rut: rutUsuario }
    ]);

    setRegistrando(false);

    if (error) {
      if (error.code === '23505') {
        alert('⚠️ Ya registraste tu asistencia para esta asamblea.');
      } else {
        alert('Error al registrar asistencia: ' + error.message);
      }
    } else {
      alert('✅ ¡Asistencia registrada exitosamente por código QR!');
      // Recargar historial
      const { data } = await supabase
        .from('asistencia_asambleas')
        .select('*')
        .eq('usuario_rut', rutUsuario)
        .order('fecha_asistencia', { ascending: false });
      if (data) setHistorialAsistencias(data);
    }
  };

  // QR dinámico basado en la asamblea activa actual
  const qrCheckInUrl = asambleaActiva 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=CheckIn_Asamblea_${asambleaActiva.id}_${asambleaActiva.titulo}`
    : 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SinAsambleaActiva';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Cabecera */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-100 opacity-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Control de Asistencia por QR</h2>
             <p className="text-slate-500 max-w-2xl text-sm">
               Valida tu presencia en las asambleas oficiales del sindicato escaneando el código QR habilitado por la directiva para cumplir con el quórum legal.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Escáner / Check-in QR */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-4">📷 Check-in de Asamblea</h3>
            
            {loading ? (
              <p className="text-slate-400 py-10">Verificando asambleas activas...</p>
            ) : !asambleaActiva ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 my-auto w-full">
                <span className="text-4xl mb-2 block">⏳</span>
                <p className="text-slate-600 font-bold">No hay asambleas abiertas en este momento.</p>
                <p className="text-xs text-slate-400 mt-1">El administrador habilitará el código QR al inicio de la sesión.</p>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">Asamblea Oficial</span>
                  <h4 className="font-extrabold text-slate-800 text-lg mt-1">{asambleaActiva.titulo}</h4>
                </div>

                {/* Código QR de Simulación */}
                <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 w-fit mx-auto shadow-inner">
                  <img src={qrCheckInUrl} alt="QR de Asistencia" className="w-44 h-44 opacity-90 mx-auto" />
                </div>

                <p className="text-xs text-slate-500">
                  Escanea con tu cámara o haz clic en el botón inferior para registrar tu asistencia automática.
                </p>

                <button 
                  onClick={handleCheckInQR}
                  disabled={registrando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {registrando ? 'Registrando...' : '✓ Registrar mi Asistencia Ahora'}
                </button>
              </div>
            )}
          </section>

          {/* Historial de Asistencias */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>📋</span> Mis Asistencias Registradas
            </h3>

            {loading ? (
              <p className="text-slate-400 text-center py-10">Cargando historial...</p>
            ) : historialAsistencias.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center flex flex-col items-center">
                <span className="text-4xl mb-3 opacity-50">📂</span>
                <p className="text-slate-500 font-medium">No registras asistencias recientes.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {historialAsistencias.map((item) => (
                  <div key={item.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Asistencia Válida
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-2">{item.asamblea_titulo}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        🕒 {new Date(item.fecha_asistencia).toLocaleString('es-CL')}
                      </p>
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