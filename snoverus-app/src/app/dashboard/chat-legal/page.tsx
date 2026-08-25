'use client';

import { useState, useRef, useEffect } from 'react';

interface Mensaje {
  remitente: 'usuario' | 'ia';
  texto: string;
  fuente?: string;
}

export default function ChatLegalPage() {
  const [pregunta, setPregunta] = useState('');
  const [historial, setHistorial] = useState<Mensaje[]>([
    {
      remitente: 'ia',
      texto: '¡Hola! Soy tu Asistente Legal Virtual del Sindicato. Estoy conectado al marco regulatorio oficial. ¿En qué puedo ayudarte hoy?',
      fuente: 'Sindicato PyC - Sistema IA'
    }
  ]);
  const [cargando, setCargando] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hacia abajo cuando llega un nuevo mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historial, cargando]);

  const enviarPregunta = async (textoConsulta?: string) => {
    const textoAEnviar = textoConsulta || pregunta;
    if (!textoAEnviar.trim()) return;

    const nuevaPregunta: Mensaje = { remitente: 'usuario', texto: textoAEnviar };
    setHistorial((prev) => [...prev, nuevaPregunta]);
    if (!textoConsulta) setPregunta('');
    setCargando(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat-legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: textoAEnviar }),
      });

      const data = await res.json();
      if (res.ok) {
        setHistorial((prev) => [
          ...prev,
          { remitente: 'ia', texto: data.respuesta, fuente: data.fuente }
        ]);
      } else {
        setHistorial((prev) => [
          ...prev,
          { remitente: 'ia', texto: '⚠️ Hubo un error al procesar la respuesta en el servidor de Python.' }
        ]);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setHistorial((prev) => [
        ...prev,
        { remitente: 'ia', texto: '🔌 No se pudo conectar con el servidor backend. Asegúrate de que Uvicorn esté encendido.' }
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      
      {/* HEADER ESTILO CORPORATIVO MICROSOFT */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          {/* El "Monito" o Avatar del Asistente */}
          <div style={{ width: '50px', height: '50px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(37,99,235,0.4)' }}>
            🤖
          </div>
          {/* Indicador verde de línea */}
          <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #0f172a' }}></span>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Asistente Legal Inteligente</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Sindicato PyC • Conectado a la base documental oficial</p>
        </div>
      </div>

      {/* SUGERENCIAS RÁPIDAS (CHIPS) */}
      <div style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center', fontWeight: '500' }}>Sugerencias:</span>
        {['bono', 'vacaciones', 'permisos', 'beneficios'].map((item) => (
          <button
            key={item}
            onClick={() => enviarPregunta(item)}
            style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#334155', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🔍 {item}
          </button>
        ))}
      </div>

      {/* ÁREA DE MENSAJES (CHAT HISTORIAL) */}
      <div style={{ height: '420px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#ffffff' }}>
        {historial.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.remitente === 'usuario' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: msg.remitente === 'usuario' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                backgroundColor: msg.remitente === 'usuario' ? '#2563eb' : '#f1f5f9',
                color: msg.remitente === 'usuario' ? 'white' : '#1e293b',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                lineHeight: '1.5',
                fontSize: '14px'
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.texto}</p>
              {msg.fuente && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: msg.remitente === 'usuario' ? '#bfdbfe' : '#64748b', borderTop: msg.remitente === 'usuario' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0', paddingTop: '4px' }}>
                  📄 Fuente: {msg.fuente}
                </div>
              )}
            </div>
          </div>
        ))}

        {cargando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖 Analizando documentos del sindicato...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* BARRA DE ENTRADA (INPUT Y BOTÓN) */}
      <form onSubmit={(e) => { e.preventDefault(); enviarPregunta(); }} style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu consulta legal o sindical aquí..."
          style={{ flex: 1, padding: '12px 16px', fontSize: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
        />
        <button
          type="submit"
          disabled={cargando || !pregunta.trim()}
          style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background 0.2s', opacity: (!pregunta.trim() || cargando) ? 0.6 : 1 }}
        >
          Enviar 🚀
        </button>
      </form>

    </div>
  );
}