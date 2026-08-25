"use client";
import { useState } from "react";
import Link from "next/link";
import AsambleaVirtual from "../../components/AsambleaVirtual"; 

export default function AsambleaPage() {
    const [enReunion, setEnReunion] = useState(false);
    // Definimos la sala directamente sin depender de la API
    const salaId = "AsambleaGeneralSindicatoPYC-2026-Oficial";

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span>📹</span> Asamblea Virtual - Sindicato PYC
                    </h1>
                    <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                        ← Volver al Panel Principal
                    </Link>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 border border-slate-200">
                    {!enReunion ? (
                        <div className="text-center py-12 sm:py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="mb-4 text-5xl">📹</div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Sala de Asambleas</h2>
                            <p className="text-slate-600 mb-8 max-w-md mx-auto">
                                Únete a la transmisión oficial en vivo. Tu micrófono estará silenciado automáticamente.
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
                            <AsambleaVirtual salaId={salaId} />
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