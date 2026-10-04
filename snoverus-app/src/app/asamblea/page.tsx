"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function AsambleaPage() {
    const [enReunion, setEnReunion] = useState(false);
    
    // Estados para aislar la sala por Tenant (Sindicato)
    const [loading, setLoading] = useState(true);
    const [roomName, setRoomName] = useState("");
    const [userName, setUserName] = useState("Socio Sindicato");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("socio");
    const [nombreSindicato, setNombreSindicato] = useState("Organización");

    useEffect(() => {
        async function initSala() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;
            
            if (user.email) setUserEmail(user.email);

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, sindicato_id')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                if (profile.full_name) setUserName(profile.full_name);
                setUserRole(profile.role);

                if (profile.sindicato_id) {
                    const { data: sindicato } = await supabase
                        .from('sindicatos')
                        .select('nombre')
                        .eq('id', profile.sindicato_id)
                        .single();
                        
                    if (sindicato) {
                        setNombreSindicato(sindicato.nombre);
                        // Nombre de sala limpio y seguro para el iframe web
                        setRoomName(`SindicatoPYC_Asamblea_Tenant${profile.sindicato_id}_2026`);
                    }
                } else if (profile.role === 'superadmin') {
                    setRoomName('SindicatoPYC_SalaControl_Superadmin');
                    setNombreSindicato('Panel Global Superadmin');
                }
            } else {
                setRoomName('SindicatoPYC_AsambleaGeneral');
            }
            setLoading(false);
        }
        initSala();
    }, []);

    // Construcción de la URL segura para Jitsi en Web e Iframe móvil (Evita menús de marcación o app externa)
    const jitsiUrl = `https://meet.jit.si/${roomName || 'SindicatoPYC_AsambleaGeneral'}#userInfo.displayName="${encodeURIComponent(userName)}"&userInfo.email="${encodeURIComponent(userEmail || 'socio@sindicato.cl')}"&config.startWithAudioMuted=true&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.hideConferenceSubject=true&config.disableInviteFunctions=true`;

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans p-4 sm:p-8 md:p-12 relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
            
            {/* Luces ambientales de fondo estilo SaaS */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[180px] opacity-10 pointer-events-none -translate-y-1/3 translate-x-1/3 bg-blue-600"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/4 bg-blue-500"></div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                
                {/* Header de la vista */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <span className="px-3 py-1 mb-2 inline-block text-[10px] font-black uppercase tracking-[0.2em] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Transmisión Cifrada
                        </span>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Asamblea Virtual — <span className="text-blue-400">{nombreSindicato}</span>
                        </h1>
                    </div>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 w-fit">
                        <span>←</span> Volver al Panel Principal
                    </Link>
                </div>
                
                {/* Contenedor principal de la tarjeta */}
                <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-white/10 relative">
                    {loading ? (
                        <div className="text-center py-24 text-slate-400 font-medium">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            Sincronizando credenciales seguras...
                        </div>
                    ) : !enReunion ? (
                        <div className="text-center py-16 sm:py-24 border border-dashed border-white/10 rounded-[2rem] bg-black/20 max-w-2xl mx-auto px-6">
                            <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 border border-blue-500/20 shadow-inner">
                                📹
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Sala de Asambleas Oficial</h2>
                            <p className="text-slate-400 text-sm sm:text-base mb-10 leading-relaxed">
                                Estás a punto de unirte a la transmisión en vivo de <strong>{nombreSindicato}</strong>. Por norma gremial, tu micrófono ingresará silenciado.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button onClick={() => setEnReunion(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-600/30 text-xs uppercase tracking-widest hover:-translate-y-0.5">
                                    Ingresar a la Asamblea Ahora
                                </button>
                                <Link href="/dashboard" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-4 px-8 rounded-2xl transition-all border border-white/10 text-xs uppercase tracking-widest text-center">
                                    Cancelar
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                            <div className="w-full h-[650px] rounded-[2rem] overflow-hidden border border-white/10 bg-black relative shadow-2xl">
                                <iframe
                                    src={jitsiUrl}
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 0,
                                    }}
                                    title="Sala de Asamblea Virtual"
                                />
                            </div>
                            <div className="flex justify-center pt-2">
                                <button onClick={() => setEnReunion(false)} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all">
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