'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const sindicalSlides = [
  {
    icon: "✊",
    title: "Juntos somos más fuertes",
    description: "Este espacio fue diseñado para mantenernos conectados, informados y respaldados. Accede a tus beneficios, votaciones, actas y canales de asesoría en un solo lugar."
  },
  {
    icon: "🎁",
    title: "Beneficios Exclusivos",
    description: "Descubre convenios en salud, educación, recreación y comercio pensados especialmente para ti y tu grupo familiar."
  },
  {
    icon: "⚖️",
    title: "Asesoría Legal Transparente",
    description: "Cuenta con respaldo jurídico profesional y acceso directo a actas, acuerdos y asambleas de manera abierta y segura."
  }
];

function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [planAnual, setPlanAnual] = useState(false); // Antonino
  const [modalPlan, setModalPlan] = useState<string | null>(null); // Antonino
  const [modalCiclo, setModalCiclo] = useState<'mensual' | 'anual'>('mensual'); // Antonino
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectDestino = searchParams.get('redirect');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sindicalSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    try {
      const supabase = createClient();

      const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_por_rut', { 
        p_rut: cleanRut 
      });

      if (rpcError || !realEmail) {
        throw new Error('No encontramos una cuenta asociada a este RUT.');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: realEmail,
        password,
      });

      if (authError) throw new Error('RUT o contraseña incorrectos.');

      if (authData.session) {
        document.cookie = `sb-sindicato-session=${authData.user.email}; path=/; max-age=86400`;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          throw new Error('Error al obtener los permisos del usuario.');
        }

        document.cookie = `sb-sindicato-rol=${profileData.role}; path=/; max-age=86400`;

        // REDIRECCIÓN INTELIGENTE CON MEMORIA DE QR
        const urlParams = new URLSearchParams(window.location.search);
        const redirectDestinoReal = urlParams.get('redirect');

        if (redirectDestinoReal) {
          window.location.href = redirectDestinoReal; 
        } else {
          const rolUsuario = String(profileData.role || '').trim().toLowerCase();
          if (rolUsuario === 'superadmin') {
            window.location.href = '/superadmin';
          } else if (rolUsuario === 'admin' || rolUsuario === 'administrador') {
            window.location.href = '/dashboard/admin';
          } else {
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión. Por favor, verifica tus datos.');
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-200 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative selection:bg-cyan-600 selection:text-white">
      
      {/* --- COLUMNA IZQUIERDA: HERO Y CARRUSEL --- */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 relative z-10 bg-gradient-to-br from-[#040814] via-[#09152b] to-[#041224] text-white shadow-2xl overflow-hidden border-r border-white/5">
        {/* Orbes de luz ambientales */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.25rem] bg-white/[0.03] border border-cyan-500/20 backdrop-blur-xl flex items-center justify-center text-cyan-400 text-2xl font-black shadow-lg shadow-cyan-500/10">
            PYC
          </div>
          <div>
            <span className="text-[10px] font-black tracking-[0.25em] text-cyan-500 uppercase block mb-1">Organización Gremial</span>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">Sindicato <span className="text-cyan-400">PYC</span></h1>
          </div>
        </div>

        <div className="space-y-6 my-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative p-8 sm:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-2xl shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl text-white mb-6 shadow-xl shadow-cyan-500/20">
                {sindicalSlides[currentSlide].icon}
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-4 leading-tight">{sindicalSlides[currentSlide].title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium min-h-[80px]">{sindicalSlides[currentSlide].description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Indicadores del Carrusel */}
          <div className="flex gap-2 pl-2">
            {sindicalSlides.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
        </div>
        
        <div className="text-xs text-slate-500 font-medium relative z-10">© 2026 Sindicato PYC. Todos los derechos reservados.</div>
      </div>

      {/* --- COLUMNA DERECHA: FORMULARIO Y POSTULACIÓN --- */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-[#020617]">
        {/* Luz sutil de fondo para el form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/[0.02] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl relative z-10"
        >
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase shadow-inner">✨ Portal de Socios</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Bienvenido</h2>
            <p className="text-slate-400 text-sm font-medium">{redirectDestino ? 'Inicia sesión para registrar tu asistencia al instante.' : 'Ingresa tus credenciales para continuar.'}</p>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-3 shadow-inner">
              <span className="text-lg">⚠️</span> <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 group-focus-within:text-cyan-400 transition-colors">RUT del Socio</label>
              <input 
                type="text" 
                required 
                value={rut} 
                onChange={(e) => setRut(e.target.value)} 
                placeholder="Ej: 11111111-1" 
                className="w-full bg-[#0a0f1e] border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all text-sm font-medium shadow-inner" 
              />
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-cyan-400 transition-colors">Contraseña</label>
                <Link href="/forgot-password" className="text-slate-500 hover:text-cyan-400 text-[10px] font-bold tracking-widest uppercase transition-colors">¿Olvidaste tu clave?</Link>
              </div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••••••" 
                className="w-full bg-[#0a0f1e] border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all text-sm font-medium shadow-inner" 
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-[0_10px_20px_rgba(8,145,178,0.2)] hover:shadow-[0_10px_25px_rgba(8,145,178,0.4)] transform hover:-translate-y-0.5 text-xs uppercase tracking-widest flex justify-center items-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verificando...
                </span>
              ) : (redirectDestino ? 'Ingresar y Confirmar Asistencia' : 'Ingresar al Portal')}
            </button>
          </form>

          {/* --- RESTAURADO: SECCIÓN DE POSTULACIÓN --- */}
          <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-5">
            <p className="text-slate-400 text-xs font-medium">¿Aún no eres parte de la organización?</p>
            <Link 
              href="/postular" 
              className="block w-full py-4 px-8 rounded-2xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
            >
              <span>📝</span> Postular al Sindicato
            </Link>
          </div>

        </motion.div>
      </div>
        </div>
  

    {/* SECCIÓN DE PLANES */}
    <div className="w-full bg-[#020617] py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">

        {/* Título */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase mb-6">
            💼 Planes y Precios
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Elige el plan ideal para <span className="text-cyan-400">tu organización</span>
          </h2>
          <p className="text-slate-400 text-base font-medium max-w-xl mx-auto">
            Digitaliza tu sindicato desde el primer día. Sin contratos largos, sin letra chica.
          </p>
        </div>

                    </div>

        {/* Banner prueba gratis */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 rounded-full text-cyan-400 text-xs font-black tracking-widest uppercase">
            🎁 Plan Starter incluye 30 días gratis — sin tarjeta de crédito
          </div>
        </div>

        {/* Tarjetas de planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* STARTER */}
          <div className="relative flex flex-col p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="mb-6">
              <span className="text-2xl mb-4 block">🌱</span>
              <h3 className="text-xl font-black text-white mb-1">Starter</h3>
              <p className="text-slate-500 text-xs font-medium">Para sindicatos que recién digitalizan</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  ${planAnual ? '4.158' : '4.990'}
                </span>
                <span className="text-slate-500 text-sm font-medium mb-1">CLP/mes</span>
              </div>
              {planAnual && <p className="text-cyan-400 text-xs font-bold mt-1">Pagado anualmente</p>}
              <p className="text-emerald-400 text-xs font-black mt-2">✓ 30 días gratis, sin tarjeta</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['Hasta 30 socios', 'Dashboard y comunicados', 'Beneficios y credencial digital', 'Tickets de soporte', 'Chat Legal IA', 'Libro de actas'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="text-cyan-400 text-xs">✓</span> {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setModalPlan('Starter')}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-white font-black text-xs uppercase tracking-widest transition-all">
              Comenzar gratis
            </button>
          </div>

          {/* PROFESIONAL */}
          <div className="relative flex flex-col p-8 rounded-[2rem] bg-gradient-to-b from-cyan-500/10 to-blue-600/5 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.1)] scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                ⭐ Más popular
              </span>
            </div>
            <div className="mb-6">
              <span className="text-2xl mb-4 block">🚀</span>
              <h3 className="text-xl font-black text-white mb-1">Profesional</h3>
              <p className="text-slate-500 text-xs font-medium">Para organizaciones en crecimiento</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  ${planAnual ? '8.325' : '9.990'}
                </span>
                <span className="text-slate-500 text-sm font-medium mb-1">CLP/mes</span>
              </div>
              {planAnual && <p className="text-cyan-400 text-xs font-bold mt-1">Pagado anualmente</p>}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['Hasta 150 socios', 'Todo lo del Starter', 'Asambleas virtuales', 'Votaciones y encuestas', 'Fondo solidario', 'Soporte prioritario'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="text-cyan-400 text-xs">✓</span> {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setModalPlan('Profesional')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(8,145,178,0.2)] hover:shadow-[0_10px_25px_rgba(8,145,178,0.5)] transform hover:-translate-y-0.5">
              Contratar ahora
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="relative flex flex-col p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <div className="mb-6">
              <span className="text-2xl mb-4 block">🏢</span>
              <h3 className="text-xl font-black text-white mb-1">Enterprise</h3>
              <p className="text-slate-500 text-xs font-medium">Para grandes organizaciones sindicales</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  ${planAnual ? '12.492' : '14.990'}
                </span>
                <span className="text-slate-500 text-sm font-medium mb-1">CLP/mes</span>
              </div>
              {planAnual && <p className="text-cyan-400 text-xs font-bold mt-1">Pagado anualmente</p>}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['Socios ilimitados', 'Todo lo del Profesional', 'Negociación colectiva', 'Personalización de marca', 'Múltiples administradores', 'Soporte dedicado 24/7'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="text-purple-400 text-xs">✓</span> {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setModalPlan('Enterprise')}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 text-white font-black text-xs uppercase tracking-widest transition-all">
              Contratar ahora
            </button>
          </div>

        </div>
      </div>

    {/* MODAL DE CONTRATACIÓN */}
    {modalPlan && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Plan seleccionado</p>
              <h3 className="text-2xl font-black text-white">{modalPlan}</h3>
            </div>
            <button
              onClick={() => setModalPlan(null)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm"
            >
              ✕
            </button>
          </div>

          {/* Opciones de ciclo */}
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Elige tu ciclo de pago</p>
          <div className="space-y-3 mb-8">

            {/* Opción mensual */}
            <button
              onClick={() => setModalCiclo('mensual')}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                modalCiclo === 'mensual'
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  modalCiclo === 'mensual' ? 'border-cyan-400' : 'border-slate-600'
                }`}>
                  {modalCiclo === 'mensual' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-black">Mensual</p>
                  <p className="text-slate-500 text-xs">Cancela cuando quieras</p>
                </div>
              </div>
              <span className="text-white font-black text-sm">
                ${modalPlan === 'Starter' ? '4.990' : modalPlan === 'Profesional' ? '9.990' : '14.990'} CLP/mes
              </span>
            </button>

            {/* Opción anual */}
            <button
              onClick={() => setModalCiclo('anual')}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                modalCiclo === 'anual'
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  modalCiclo === 'anual' ? 'border-cyan-400' : 'border-slate-600'
                }`}>
                  {modalCiclo === 'anual' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-black">Anual <span className="text-cyan-400 text-xs ml-1">2 meses gratis</span></p>
                  <p className="text-slate-500 text-xs">Un solo pago al año</p>
                </div>
              </div>
              <span className="text-white font-black text-sm">
                ${modalPlan === 'Starter' ? '4.158' : modalPlan === 'Profesional' ? '8.325' : '12.492'} CLP/mes
              </span>
            </button>

          </div>

          {/* Botón contratar */}
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(8,145,178,0.2)] hover:shadow-[0_10px_25px_rgba(8,145,178,0.4)] transform hover:-translate-y-0.5">
            Contratar {modalPlan} {modalCiclo === 'anual' ? 'Anual' : 'Mensual'}
          </button>

          {modalPlan === 'Starter' && (
            <p className="text-center text-emerald-400 text-xs font-black mt-4">✓ Incluye 30 días gratis, sin tarjeta de crédito</p>
          )}

        </motion.div>
      </div>
    )}
    
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}