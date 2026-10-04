"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function AsambleaPage() {
    const [loading, setLoading] = useState(true);
    const [linkMeet, setLinkMeet] = useState("");
    const [nombreSindicato, setNombreSindicato] = useState("Organización");

    useEffect(() => {
        async function fetchAsambleaData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('sindicato_id')
                .eq('id', user.id)
                .single();
            
            if (profile?.sindicato_id) {
                const { data: sindicato } = await supabase
                    .from('sindicatos')
                    .select('nombre, link_asamblea')
                    .eq('id', profile.sindicato_id)
                    .single();
                    
                if (sindicato) {
                    setNombreSindicato(sindicato.nombre);
                    if (sindicato.link_asamblea) {
                        setLinkMeet(sindicato.link_asamblea);
                    }
                }
            }
            setLoading(false);
        }
        fetchAsambleaData();
    }, []);

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans p-6 sm:p-12 relative overflow-hidden flex flex-col items-center justify-center selection:bg-blue-600 selection:text-white">
            
            {/* Luces ambientales de fondo estilo SaaS */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[180px] opacity-10 pointer-events-none -translate-y-1/3 translate-x-1/3 bg-blue-600"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/4 bg-blue-500"></div>

            <div className="max-w-xl w-full bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/10 text-center space-y-6 relative z-10">
                
                <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center text-4xl mx-auto border border-blue-500/20 shadow-inner">
                    📹
                </div>
                
                <div>
                    <span className="px-3 py-1 mb-3 inline-block text-[10px] font-black uppercase tracking-[0.2em] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Transmisión Oficial
                    </span>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Asamblea Virtual — <span className="text-blue-400">{nombreSindicato}</span>
                    </h1>
                </div>

                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Has validado tu asistencia correctamente. Haz clic en el botón de abajo para unirte a la videollamada oficial de la asamblea en curso.
                </p>

                {loading ? (
                    <div className="py-8 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                        Sincronizando acceso seguro...
                    </div>
                ) : linkMeet ? (
                    <div className="space-y-4 pt-4">
                        <a 
                            href={linkMeet} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full block bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-600/30 text-xs uppercase tracking-widest text-center"
                        >
                            🚀 Unirse a la Videollamada
                        </a>
                        <p className="text-[11px] text-slate-500 font-medium">Se abrirá de forma nativa en tu aplicación o navegador móvil.</p>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-2xl">
                        ⚠️ La directiva aún no ha configurado el enlace oficial para esta asamblea. Vuelve a intentarlo en unos momentos.
                    </div>
                )}

                <div className="pt-4 border-t border-white/5">
                    <Link href="/dashboard" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        ← Volver al Panel Principal
                    </Link>
                </div>
            </div>
        </div>
    );
}