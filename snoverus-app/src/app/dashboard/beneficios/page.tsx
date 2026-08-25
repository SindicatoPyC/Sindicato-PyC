"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import emailjs from "@emailjs/browser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Beneficio {
  id: number | string;
  titulo: string;
  categoria: string;
  ubicacion: string;
  descripcion: string;
  asesor: string;
  icono: string;
}

export default function BeneficiosPage() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // Estados para el Modal CRUD
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [beneficioActual, setBeneficioActual] = useState<Beneficio>({
    id: "",
    titulo: "",
    categoria: "Salud",
    ubicacion: "",
    descripcion: "",
    asesor: "",
    icono: "✨"
  });

  // Estados para el Modal de Uso de Beneficio y EmailJS
  const [modalUsoAbierto, setModalUsoAbierto] = useState(false);
  const [beneficioSeleccionado, setBeneficioSeleccionado] = useState<Beneficio | null>(null);
  const [correoSocio, setCorreoSocio] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [exitoEnvio, setExitoEnvio] = useState(false);

  useEffect(() => {
    cargarBeneficios();
  }, []);

  const cargarBeneficios = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.from("beneficios").select("*").order("id", { ascending: false });
      if (error) throw error;
      if (data) setBeneficios(data);
    } catch (error) {
      console.error("Error al cargar beneficios:", error);
    } finally {
      setCargando(false);
    }
  };

  const beneficiosFiltrados = beneficios.filter(b => {
    const coincideFiltro = filtro === "Todos" || b.categoria?.toLowerCase() === filtro.toLowerCase();
    const coincideBusqueda = b.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || b.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setBeneficioActual({ id: "", titulo: "", categoria: "Salud", ubicacion: "", descripcion: "", asesor: "", icono: "💡" });
    setModalAbierto(true);
  };

  const abrirModalEditar = (beneficio: Beneficio) => {
    setModoEdicion(true);
    setBeneficioActual(beneficio);
    setModalAbierto(true);
  };

  const guardarBeneficio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        const { error } = await supabase
          .from("beneficios")
          .update({
            titulo: beneficioActual.titulo,
            categoria: beneficioActual.categoria,
            ubicacion: beneficioActual.ubicacion,
            descripcion: beneficioActual.descripcion,
            asesor: beneficioActual.asesor,
            icono: beneficioActual.icono
          })
          .eq("id", beneficioActual.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("beneficios")
          .insert([{
            titulo: beneficioActual.titulo,
            categoria: beneficioActual.categoria,
            ubicacion: beneficioActual.ubicacion,
            descripcion: beneficioActual.descripcion,
            asesor: beneficioActual.asesor,
            icono: beneficioActual.icono
          }]);
        if (error) throw error;
      }
      setModalAbierto(false);
      cargarBeneficios();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el beneficio.");
    }
  };

  const eliminarBeneficio = async (id: number | string) => {
    if (confirm("¿Estás seguro de eliminar este convenio institucional?")) {
      try {
        const { error } = await supabase.from("beneficios").delete().eq("id", id);
        if (error) throw error;
        cargarBeneficios();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const abrirUsoBeneficio = (beneficio: Beneficio) => {
    setBeneficioSeleccionado(beneficio);
    setCorreoSocio("");
    setExitoEnvio(false);
    setModalUsoAbierto(true);
  };

  // Enviar Correo de forma automática usando EmailJS corregido
  const enviarCorreoBeneficio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficioSeleccionado) return;

    setEnviandoCorreo(true);

    try {
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
      const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

      // Parámetros completos mapeando los nombres estándar que acepta EmailJS
      const templateParams = {
        to_email: correoSocio,
        email: correoSocio,
        user_email: correoSocio,
        titulo: beneficioSeleccionado.titulo,
        categoria: beneficioSeleccionado.categoria,
        ubicacion: beneficioSeleccionado.ubicacion,
        descripcion: beneficioSeleccionado.descripcion,
        asesor: beneficioSeleccionado.asesor,
        message: `Convenio: ${beneficioSeleccionado.titulo}. Detalle: ${beneficioSeleccionado.descripcion}. Asesor a cargo: ${beneficioSeleccionado.asesor}`
      };

      await emailjs.send(serviceID, templateID, templateParams, publicKey);

      setEnviandoCorreo(false);
      setExitoEnvio(true);
      
      setTimeout(() => {
        setModalUsoAbierto(false);
        setExitoEnvio(false);
      }, 3000);

    } catch (error) {
      console.error("Error al enviar el correo automático:", error);
      setEnviandoCorreo(false);
      alert("Hubo un error al despachar el correo. Revisa tus credenciales en el archivo .env.local");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-6 md:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              <span>🛡️ Sindicato PYC - Convenios Activos</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo de Convenios y Beneficios</h1>
            <p className="text-slate-500 text-sm max-w-2xl">
              Aprovecha la red de descuentos exclusivos. Selecciona un beneficio para utilizarlo y recibir el comprobante detallado en tu correo institucional.
            </p>
          </div>
          
          <button 
            onClick={abrirModalCrear}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <span>✨ Nuevo Convenio</span>
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">🔍</span>
            <input 
              type="text"
              placeholder="Buscar por nombre o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 font-medium transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {["Todos", "Salud", "Educación", "Recreación", "Comercio"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  filtro === cat 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Beneficios */}
        {cargando ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-slate-500 text-sm mt-3 font-semibold">Cargando convenios desde Supabase...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosFiltrados.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-slate-400 font-semibold">No se encontraron convenios registrados.</p>
              </div>
            ) : (
              beneficiosFiltrados.map((b) => (
                <div key={b.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-200/80 flex flex-col justify-between relative group hover:border-blue-300 transition-all">
                  
                  {/* Botones Admin */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-100/90 backdrop-blur p-1 rounded-xl border border-slate-200 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => abrirModalEditar(b)} title="Editar" className="p-2 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg text-xs font-bold transition">✏️</button>
                    <button onClick={() => eliminarBeneficio(b.id)} title="Eliminar" className="p-2 hover:bg-white text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition">🗑️</button>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-4 pr-16">
                      <div className="w-12 h-12 bg-blue-50 text-2xl rounded-2xl flex items-center justify-center shadow-inner">
                        {b.icono || "💡"}
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        {b.categoria}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mb-1">{b.titulo}</h3>
                    <p className="text-xs font-semibold text-blue-600 mb-3 flex items-center gap-1">
                      <span>📍</span> {b.ubicacion}
                    </p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">
                      {b.descripcion}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Asesor a cargo</span>
                      <span className="text-xs font-extrabold text-slate-800">{b.asesor}</span>
                    </div>
                    <button 
                      onClick={() => abrirUsoBeneficio(b)}
                      className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Usar Beneficio
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* MODAL USAR BENEFICIO (CORREO AUTOMÁTICO EMAILJS) */}
      {modalUsoAbierto && beneficioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">📧 Solicitar Convenio</h2>
              <button 
                onClick={() => setModalUsoAbierto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {exitoEnvio ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500 text-white text-2xl rounded-full flex items-center justify-center mx-auto shadow-md">✓</div>
                <h3 className="text-base font-black text-emerald-900">¡Correo enviado con éxito!</h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Se ha enviado el detalle del convenio y el contacto de tu asesor <strong>{beneficioSeleccionado.asesor}</strong> a <strong>{correoSocio}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={enviarCorreoBeneficio} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Beneficio Seleccionado</span>
                  <h4 className="text-sm font-black text-slate-900">{beneficioSeleccionado.titulo}</h4>
                  <p className="text-xs text-slate-500">{beneficioSeleccionado.descripcion}</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Correo electrónico del socio</label>
                  <input 
                    type="email" 
                    required
                    value={correoSocio}
                    onChange={(e) => setCorreoSocio(e.target.value)}
                    placeholder="socio@sindicatopyc.cl"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Recibirás el comprobante oficial en tu bandeja de entrada.</p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setModalUsoAbierto(false)}
                    className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={enviandoCorreo}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    {enviandoCorreo ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Comprobante 📤</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">
                {modoEdicion ? "✏️ Editar Convenio" : "✨ Registrar Nuevo Convenio"}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition">✕</button>
            </div>

            <form onSubmit={guardarBeneficio} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Título del Convenio</label>
                <input type="text" required value={beneficioActual.titulo} onChange={(e) => setBeneficioActual({...beneficioActual, titulo: e.target.value})} placeholder="Ej: Clínica Dental" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Categoría</label>
                  <select value={beneficioActual.categoria} onChange={(e) => setBeneficioActual({...beneficioActual, categoria: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                    <option value="Salud">Salud</option>
                    <option value="Educación">Educación</option>
                    <option value="Recreación">Recreación</option>
                    <option value="Comercio">Comercio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Ubicación</label>
                  <input type="text" required value={beneficioActual.ubicacion} onChange={(e) => setBeneficioActual({...beneficioActual, ubicacion: e.target.value})} placeholder="Ej: RM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Descripción</label>
                <textarea required rows={3} value={beneficioActual.descripcion} onChange={(e) => setBeneficioActual({...beneficioActual, descripcion: e.target.value})} placeholder="Detalles..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Asesor a Cargo</label>
                  <input type="text" required value={beneficioActual.asesor} onChange={(e) => setBeneficioActual({...beneficioActual, asesor: e.target.value})} placeholder="Nombre" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Icono (Emoji)</label>
                  <input type="text" required value={beneficioActual.icono} onChange={(e) => setBeneficioActual({...beneficioActual, icono: e.target.value})} placeholder="💡" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-center text-lg" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/30">{modoEdicion ? "Guardar Cambios" : "Crear Convenio"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}