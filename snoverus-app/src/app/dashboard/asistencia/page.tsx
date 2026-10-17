'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AsistenciaPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sindicatoId, setSindicatoId] = useState<number | null>(null);
  
  // Nombre de la asamblea actual para el registro
  const [tituloAsamblea, setTituloAsamblea] = useState('Asamblea General Ordinaria');
  
  const [escaneando, setEscaneando] = useState(false);
  const [ultimoEscaneado, setUltimoEscaneado] = useState<string | null>(null);
  const [mensajeStatus, setMensajeStatus] = useState<{texto: string, tipo: 'success'|'error'|'info'} | null>(null);

  useEffect(() => {
    setIsMounted(true);
    verificarRol();
  }, []);

  const verificarRol = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase.from('profiles').select('role, sindicato_id').eq('id', user.id).single();
      if (data) {
        const rol = String(data.role || '').toLowerCase();
        setIsAdmin(rol === 'admin' || rol === 'administrador' || rol === 'superadmin');
        setSindicatoId(data.sindicato_id);
      }
    }
  };

  const procesarQR = async (textoQR: string) => {
    if (ultimoEscaneado === textoQR) return;
    setUltimoEscaneado(textoQR);
    setMensajeStatus({ texto: 'Procesando lectura...', tipo: 'info' });

    try {
      const qrData = JSON.parse(textoQR);

      if (!qrData.rut || !qrData.socio_id) {
        throw new Error("Código QR no pertenece a esta plataforma.");
      }

      const supabase = createClient();

      const { data: existe } = await supabase
        .from('asistencia_asambleas')
        .select('id')
        .eq('sindicato_id', sindicatoId)
        .eq('usuario_rut', qrData.rut)
        .eq('asamblea_titulo', tituloAsamblea)
        .maybeSingle();

      if (existe) {
        setMensajeStatus({ texto: `⚠️ RUT ${qrData.rut} ya registrado.`, tipo: 'error' });
        setTimeout(() => setUltimoEscaneado(null), 4000); 
        return;
      }

      const { error } = await supabase
        .from('asistencia_asambleas')
        .insert([{
          sindicato_id: sindicatoId,
          usuario_rut: qrData.rut,
          asamblea_titulo: tituloAsamblea,
          fecha_asistencia: new Date().toISOString()
        }]);

      if (error) throw error;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

      setMensajeStatus({ texto: `✅ Autorizado: ${qrData.rut}`, tipo: 'success' });
      setTimeout(() => setUltimoEscaneado(null), 2500);

    } catch (error: any) {
      console.error(error);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setMensajeStatus({ texto: `❌ QR Inválido.`, tipo: 'error' });
      setTimeout(() => setUltimoEscaneado(null), 3000);
    }
  };

  if (!isMounted) return null;

  // --- VISTA PARA SOCIO NORMAL ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center max-w-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📅</div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Registro de Asistencia</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
            Para registrar tu asistencia, dirígete a la sección <strong>"Credencial"</strong> y presenta tu código QR al Presidente.
          </p>
          <button onClick={() => window.location.href='/dashboard/credencial'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest">
            Ir a mi Credencial
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA PARA PRESIDENTE (ESCÁNER MÓVIL Y ESCRITORIO) ---
  return (
    <div className="bg-slate-950 font-sans text-white flex justify-center overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>
      
      {/* Contenedor central (Parece un teléfono) */}
      <div className="w-full max-w-md flex flex-col relative bg-slate-950 shadow-2xl" style={{ height: 'calc(100vh - 80px)' }}>
        
        {/* Header Compacto */}
        <header className="px-6 pt-6 pb-4 shrink-0 z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Modo Escáner
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-none">Acceso</h1>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">
              Registrando para:
            </label>
            <input 
              type="text" 
              value={tituloAsamblea}
              onChange={(e) => setTituloAsamblea(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-white outline-none px-1"
              placeholder="Asamblea..."
            />
          </div>
        </header>

        {/* Área de la Cámara */}
        <div className="flex-1 relative bg-black w-full overflow-hidden flex flex-col border-y border-slate-800">
          {escaneando ? (
            <div className="absolute inset-0">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    procesarQR(result[0].rawValue);
                  }
                }}
                onError={(error) => console.error(error)}
                constraints={{ facingMode: 'environment' }}
                styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                components={{ finder: false }}
              />
              
              {/* Overlay visual del escáner */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 bg-black/40">
                <div className="w-64 h-64 border-2 border-white/30 rounded-[2rem] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-[2rem]"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-[2rem]"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-[2rem]"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-[2rem]"></div>
                  {/* Línea láser de escaneo */}
                  <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_20px_#3b82f6] absolute top-1/2 -translate-y-1/2 animate-scan"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
              <div className="w-20 h-20 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center text-4xl mb-4">📷</div>
              <h3 className="text-lg font-black text-white mb-2">Cámara Inactiva</h3>
              <p className="text-xs text-slate-400">Activa el escáner para comenzar a registrar la asistencia.</p>
            </div>
          )}
        </div>

        {/* Footer con Controles */}
        <div className="px-6 py-6 shrink-0 z-10 bg-slate-950 pb-8">
          
          {/* Mensajes de Status */}
          <div className="h-16 mb-4">
            {mensajeStatus && (
              <div className={`h-full px-4 rounded-2xl border text-sm font-bold animate-in zoom-in-95 flex items-center justify-center text-center leading-tight shadow-lg ${
                mensajeStatus.tipo === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10' :
                mensajeStatus.tipo === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                {mensajeStatus.texto}
              </div>
            )}
          </div>

          <button 
            onClick={() => setEscaneando(!escaneando)}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
              escaneando 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {escaneando ? '⏹ Detener Lectura' : '▶ Activar Escáner'}
          </button>
        </div>

      </div>
      
      {/* Animación del láser */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 15%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 85%; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}