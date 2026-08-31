'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import emailjs from '@emailjs/browser';
import Link from 'next/link';

// Datos de prueba premium (Fallback)
const conveniosIniciales = [
  { id: 1, titulo: 'Clínica Dental Sonrisas', descripcion: 'Atención dental con copago cero en tapaduras y 40% de descuento en ortodoncia para cargas familiares registradas.', categoria: 'Salud', descuento: 'Hasta 40%', imagen_url: '' },
  { id: 2, titulo: 'Farmacias Cruz Verde', descripcion: 'Descuento exclusivo todos los lunes y jueves en medicamentos recetados y genéricos presentando tu RUT sindical.', categoria: 'Salud', descuento: '20% OFF', imagen_url: '' },
  { id: 3, titulo: 'Cinepolis - Entradas', descripcion: 'Entradas 2D a precio preferencial de lunes a domingo. Máximo 4 entradas mensuales por socio activo.', categoria: 'Recreación', descuento: 'Ticket a $3.500', imagen_url: '' }
];

export default function BeneficiosSmartPage() {
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  
  // 🛡️ Control de Roles
  const [isAdmin, setIsAdmin] = useState(false);
  const [socioInfo, setSocioInfo] = useState({ rut: '---', nombre: 'Socio Activo' });
  const [procesandoUso, setProcesandoUso] = useState<number | null>(null);
  
  // Estados para el Modal (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Campos del Formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Salud');
  const [descuento, setDescuento] = useState('');
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenUrlActual, setImagenUrlActual] = useState('');

  const categoriasFiltro = ['Todos', 'Salud', 'Recreación', 'Deporte', 'Educación', 'Hogar', 'Otros'];
  const categoriasForm = ['Salud', 'Recreación', 'Deporte', 'Educación', 'Hogar', 'Otros'];

  useEffect(() => {
    // 1. Identificar al usuario (Socio o Admin)
    const cookies = document.cookie.split(';');
    const rolCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-rol='));
    const sessionCookie = cookies.find(c => c.trim().startsWith('sb-sindicato-session='));
    
    if (rolCookie) {
      const rol = rolCookie.split('=')[1].toLowerCase();
      if (['admin', 'administrador', 'directiva'].includes(rol)) {
        setIsAdmin(true);
      }
    }

    if (sessionCookie) {
      setSocioInfo(prev => ({ ...prev, rut: sessionCookie.split('=')[1] }));
    }

    fetchBeneficios();
  }, []);

  const fetchBeneficios = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('beneficios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) setBeneficios(data);
      else setBeneficios(conveniosIniciales);
    } catch (err) {
      setBeneficios(conveniosIniciales);
    } finally {
      setLoading(false);
    }
  };

  const beneficiosFiltrados = filtroActivo === 'Todos' 
    ? beneficios 
    : beneficios.filter(b => b.categoria === filtroActivo || b.categoria_nombre === filtroActivo);

  // === FUNCIÓN DE SOCIO: USAR BENEFICIO CON EMAILJS ===
  const handleUsarBeneficio = async (beneficio: any) => {
    const correoDestino = prompt(
      `🎟️ ¿Deseas reclamar y utilizar el beneficio "${beneficio.titulo}"?\n\nConfirma tu correo electrónico para recibir el comprobante:`,
      'contacto@sindicatopyc.cl'
    );

    if (!correoDestino || !correoDestino.trim()) return;

    setProcesandoUso(beneficio.id);

    try {
      const templateParams = {
        to_email: correoDestino.trim(),
        socio_rut: socioInfo.rut,
        beneficio_titulo: beneficio.titulo,
        beneficio_descuento: beneficio.descuento,
        beneficio_categoria: beneficio.categoria,
        beneficio_descripcion: beneficio.descripcion,
        message: `El socio con RUT ${socioInfo.rut} ha solicitado el convenio ${beneficio.titulo} (${beneficio.descuento}).`
      };

      await emailjs.send(
        'service_thw7gfn',  // Service ID real
        'template_ot9airk', // Template ID real
        templateParams,
        'GG3tS19diXKenuD_-' // Public Key real
      );

      alert(`✅ ¡Beneficio canjeado con éxito!\n\nHemos enviado un correo de confirmación y comprobante a: ${correoDestino}`);
    } catch (err: any) {
      alert(`❌ Fallo al enviar el correo. Revisa la consola.`);
      console.error("Detalle EmailJS:", err);
    } finally {
      setProcesandoUso(null);
    }
  };

  // === FUNCIONES ADMIN ===
  const abrirModalNuevo = () => {
    setIsEditing(false); setCurrentId(null); setTitulo(''); setDescripcion('');
    setCategoria('Salud'); setDescuento(''); setImagenArchivo(null);
    setImagenUrlActual(''); setIsModalOpen(true);
  };

  const abrirModalEditar = (beneficio: any) => {
    setIsEditing(true); setCurrentId(beneficio.id); setTitulo(beneficio.titulo || '');
    setDescripcion(beneficio.descripcion || ''); setCategoria(beneficio.categoria || 'Salud');
    setDescuento(beneficio.descuento || ''); setImagenArchivo(null);
    setImagenUrlActual(beneficio.imagen_url || ''); setIsModalOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const supabase = createClient();
      let urlFinalImagen = imagenUrlActual;

      if (imagenArchivo) {
        const fileExt = imagenArchivo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('beneficios').upload(fileName, imagenArchivo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('beneficios').getPublicUrl(fileName);
        urlFinalImagen = publicUrl;
      }

      const datosBeneficio = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria.trim(),
        descuento: descuento.trim(),
        imagen_url: urlFinalImagen
      };

      if (isEditing && currentId) {
        const { error } = await supabase.from('beneficios').update(datosBeneficio).eq('id', currentId);
        if (error) throw error;
        alert('✅ Beneficio actualizado.');
      } else {
        const { error } = await supabase.from('beneficios').insert([datosBeneficio]);
        if (error) throw error;
        alert('✨ Nuevo beneficio publicado.');
      }
      setIsModalOpen(false);
      fetchBeneficios(); 
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("⚠️ ¿Eliminar convenio?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('beneficios').delete().eq('id', id);
      if (error) throw error;
      alert('🗑️ Eliminado.');
      fetchBeneficios();
    } catch(err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-950 font-sans text-slate-100 min-h-screen relative w-full pb-24 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* ========================================================================= */}
        {/* ========================= VISTA SOCIO (DEFAULT) ========================= */}
        {/* ========================================================================= */}
        {!isAdmin && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-blue-400 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
                  ✨ Mi Portal
                </div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Mis Beneficios</h1>
              </div>

              {/* Miní Credencial del Socio para Reclamar Beneficios */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 w-full md:w-auto shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/10">👷🏽‍♂️</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Socio Activo</p>
                  <p className="font-bold text-white text-sm">{socioInfo.rut}</p>
                </div>
              </div>
            </div>

            <p className="text-slate-400 mb-8 max-w-2xl">Muestra tu RUT en caja o ingresa tu código en línea para hacer válidos estos convenios exclusivos.</p>

            {/* Filtros Básicos Socio */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-8 hide-scrollbar">
              {categoriasFiltro.map(cat => (
                <button key={cat} onClick={() => setFiltroActivo(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filtroActivo === cat ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista Visual Socio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beneficiosFiltrados.map(b => (
                <div key={b.id} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col">
                  <div className="h-40 bg-slate-800 relative">
                    {b.imagen_url ? <img src={b.imagen_url} className="w-full h-full object-cover" alt={b.titulo}/> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🎁</div>}
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{b.categoria}</div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">{b.titulo}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4">{b.descripcion}</p>
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-800/50">
                      <span className="text-emerald-400 font-black text-xs bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{b.descuento}</span>
                      <button 
                        onClick={() => handleUsarBeneficio(b)}
                        disabled={procesandoUso === b.id}
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
                      >
                        {procesandoUso === b.id ? 'Procesando...' : 'Usar 🎟️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {/* ========================================================================= */}
        {/* ========================== VISTA ADMINISTRADOR ========================== */}
        {/* ========================================================================= */}
        {isAdmin && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-red-900/30 pb-8">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <Link href="/dashboard/admin" className="text-slate-400 hover:text-white transition-colors font-bold text-sm bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">← Volver al Admin</Link>
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Módulo Gestor</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Convenios</h1>
              </div>
              <button onClick={abrirModalNuevo} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-2">
                <span className="text-xl">+</span> Crear Nuevo Convenio
              </button>
            </div>

            {/* Formato Tabla para Administrador */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-5 pl-8">Convenio</th>
                    <th className="p-5">Detalle</th>
                    <th className="p-5 text-center">Descuento</th>
                    <th className="p-5 pr-8 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {beneficios.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                            {b.imagen_url ? <img src={b.imagen_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xl">🎁</div>}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{b.titulo}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{b.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-xs text-slate-400 font-medium max-w-xs truncate">{b.descripcion}</td>
                      <td className="p-5 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-md border border-emerald-500/20">{b.descuento}</span>
                      </td>
                      <td className="p-5 pr-8">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => abrirModalEditar(b)} className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors">✏️</button>
                          <button onClick={() => handleEliminar(b.id)} className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* MODAL CREAR/EDITAR (SOLO ADMIN) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-700 my-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">{isEditing ? 'Editar Convenio' : 'Nuevo Convenio'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleGuardar} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Empresa / Título</label>
                  <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none">
                    {categoriasForm.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descuento</label>
                  <input type="text" required value={descuento} onChange={(e) => setDescuento(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</label>
                  <textarea required rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none resize-none"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Imagen (Opcional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setImagenArchivo(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white bg-slate-950 border border-slate-700 rounded-xl p-1 outline-none" />
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-red-900/20 text-sm">{guardando ? 'Guardando...' : 'Guardar Beneficio'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}