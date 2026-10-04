"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from '../lib/supabase'; // Asegúrate de que la ruta coincida con tu proyecto
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function AsambleaPage() {
    const [enReunion, setEnReunion] = useState(false);
    
    // Estados para aislar la sala por Tenant (Sindicato)
    const [loading, setLoading] = useState(true);
    const [roomName, setRoomName] = useState("");
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState(""); // Agregamos estado para el email
    const [userRole, setUserRole] = useState("socio");
    const [nombreSindicato, setNombreSindicato] = useState("Organización");

    useEffect(() => {
        async function initSala() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;
            
            // Guardamos el email para satisfacer la validación de TypeScript en Jitsi
            if (user.email) setUserEmail(user.email);

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, sindicato_id')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                setUserName(profile.full_name);
                setUserRole(profile.role);

                if (profile.sindicato_id) {
                    const { data: sindicato } = await supabase
                        .from('sindicatos')
                        .select('nombre')
                        .eq('id', profile.sindicato_id)
                        .single();
                        
                    if (sindicato) {
                        setNombreSindicato(sindicato.nombre);
                        // Nombre de sala encriptado/aislado por tenant
                        setRoomName(`AsambleaOficial_Tenant${profile.sindicato_id}_2026`);
                    }
                } else if (profile.role === 'superadmin') {
                    setRoomName('SalaControl_Superadmin');
                    setNombreSindicato('Panel Global Superadmin');
                }
            }
            setLoading(false);
        }
        initSala();
    }, []);

    // Determinar si tiene permisos de moderador
    const isModerator = userRole === 'admin' || userRole === 'superadmin';

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span>📹</span> Asamblea Virtual - {nombreSindicato}
                    </h1>
                    <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                        ← Volver al Panel Principal
                    </Link>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 border border-slate-200">
                    {loading ? (
                        <div className="text-center py-16 text-slate-500 font-medium">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            Configurando conexión segura...
                        </div>
                    ) : !enReunion ? (
                        <div className="text-center py-12 sm:py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="mb-4 text-5xl">📹</div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Sala de Asambleas</h2>
                            <p className="text-slate-600 mb-8 max-w-md mx-auto">
                                Únete a la transmisión oficial en vivo de <strong>{nombreSindicato}</strong>. Tu micrófono estará silenciado automáticamente.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => setEnReunion(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg">
                                    Ingresar a la Asamblea
                                </button>
                                <Link href="/dashboard" className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-8 rounded-xl transition-all">
                                    Cancelar
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-4">
                            <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 bg-black relative shadow-inner">
                                <JitsiMeeting
                                    domain="meet.jit.si"
                                    roomName={roomName}
                                    userInfo={{ 
                                        displayName: userName,
                                        email: userEmail || "usuario@plataforma.com" // Parámetro añadido para cumplir con TypeScript
                                    }}
                                    configOverwrite={{
                                        startWithAudioMuted: true,
                                        startWithVideoMuted: false,
                                        prejoinPageEnabled: false,
                                        disableModeratorIndicator: true,
                                    }}
                                    interfaceConfigOverwrite={{
                                        SHOW_JITSI_WATERMARK: false,
                                        SHOW_WATERMARK_FOR_GUESTS: false,
                                        // Restricciones de interfaz según el rol
                                        TOOLBAR_BUTTONS: isModerator 
                                            ? ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'mute-everyone', 'security']
                                            : ['microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat', 'raisehand', 'tileview'],
                                    }}
                                    getIFrameRef={(iframeRef) => {
                                        iframeRef.style.height = '100%';
                                        iframeRef.style.width = '100%';
                                        iframeRef.style.border = 'none';
                                    }}
                                />
                            </div>
                            <div className="flex justify-center mt-6 pt-6 border-t border-slate-100">
                                <button onClick={() => setEnReunion(false)} className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-sm px-6 py-3 rounded-xl transition-all">
                                    ✕ Abandonar sala y volver al menú
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}