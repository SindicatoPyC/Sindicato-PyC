"use client";
import React, { useState, useEffect } from "react";

const slides = [
  {
    id: 1,
    titulo: "Tu Portal al Futuro.",
    descripcion: "Un espacio interactivo diseñado para potenciar tu participación y gestionar tus beneficios con total transparencia.",
    badge: "BIENVENIDO",
    badgeColor: "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30",
    bgClass: "bg-slate-950",
    accent: "from-blue-600 to-cyan-400",
    icon: "🚀",
  },
  {
    id: 2,
    titulo: "Asistente Legal 24/7.",
    descripcion: "Nuestra nueva IA resuelve tus dudas laborales al instante basándose en las normativas oficiales del Sindicato.",
    badge: "INTELIGENCIA ARTIFICIAL",
    badgeColor: "bg-purple-400/20 text-purple-400 border border-purple-400/30",
    bgClass: "bg-[#09090b]", // Casi negro puro para resaltar el morado
    accent: "from-purple-600 to-pink-500",
    icon: "🤖",
  },
  {
    id: 3,
    titulo: "Decide el Mañana.",
    descripcion: "Las votaciones para la Negociación Colectiva están por comenzar. Tu voz es el motor de nuestro sindicato.",
    badge: "ACCIÓN REQUERIDA",
    badgeColor: "bg-orange-400/20 text-orange-400 border border-orange-400/30",
    bgClass: "bg-slate-900",
    accent: "from-orange-500 to-red-500",
    icon: "🗳️",
  },
];

export default function Carrusel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-reproducción cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800/60 group">
      
      {/* Contenedor de Slides */}
      <div 
        className="flex transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] h-full w-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className={`min-w-full h-full relative overflow-hidden ${slide.bgClass} flex items-center`}>
            
            {/* Efectos de Luces Flotantes (Glassmorphism) */}
            <div className={`absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br ${slide.accent} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse`}></div>
            <div className={`absolute -bottom-32 right-0 w-80 h-80 bg-gradient-to-tl ${slide.accent} rounded-full mix-blend-screen filter blur-[100px] opacity-20`}></div>

            {/* Contenido principal */}
            <div className="relative z-10 w-full px-8 sm:px-16 flex justify-between items-center h-full">
              
              {/* Lado del Texto */}
              <div className="max-w-xl">
                <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full mb-5 ${slide.badgeColor} backdrop-blur-md`}>
                  {slide.badge}
                </span>
                
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                  {slide.titulo}
                </h2>
                
                <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-md">
                  {slide.descripcion}
                </p>
              </div>

              {/* Lado del Icono Flotante (Oculto en móviles pequeños) */}
              <div className="hidden md:flex relative justify-center items-center h-full w-64">
                <div className={`absolute inset-0 bg-gradient-to-tr ${slide.accent} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700`}></div>
                <span className="relative text-8xl drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] transform group-hover:-translate-y-4 transition-transform duration-700 ease-out">
                  {slide.icon}
                </span>
              </div>
              
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores Estilizados (Barras en lugar de puntos) */}
      <div className="absolute bottom-6 left-8 sm:left-16 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-500 h-1.5 rounded-full ${
              currentSlide === index ? "w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "w-4 bg-white/20 hover:bg-white/50"
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
      
    </div>
  );
}