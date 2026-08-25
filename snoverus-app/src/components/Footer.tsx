import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0B1121] border-t border-slate-800 text-slate-400 py-12 px-6 lg:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Identidad de Marca */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-white">
              <img src="/logopyf.jpeg" alt="Logo Sindicato PYC" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-wide">SINDICATO PYC</h3>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Trabajadores Unidos</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-4">
            Trabajando unidos por el bienestar, la transparencia y los derechos de todos nuestros socios. Tu voz es el motor de nuestra organización.
          </p>
        </div>

        {/* Enlaces Rápidos */}
        <div>
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">🔗 Enlaces Rápidos</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/dashboard" className="hover:text-blue-400 transition-colors">• Inicio del Portal</a></li>
            <li><a href="/dashboard/beneficios" className="hover:text-blue-400 transition-colors">• Catálogo de Beneficios</a></li>
            <li><a href="/dashboard/legal" className="hover:text-blue-400 transition-colors">• Asesoría Legal</a></li>
            <li><a href="/dashboard/actas" className="hover:text-blue-400 transition-colors">• Transparencia y Actas</a></li>
            <li><a href="/dashboard/soporte" className="hover:text-blue-400 transition-colors">• Soporte Técnico</a></li>
          </ul>
        </div>

        {/* Contacto Directo */}
        <div>
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">📞 Contacto Directo</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-400">📍</span>
              <span>Av. Pajaritos 1234, Oficina 502,<br/>Maipú, Santiago, Chile.</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400">📱</span>
              <span>+56 2 2345 6789</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-400">✉️</span>
              <a href="mailto:contacto@sindicatopyc.cl" className="hover:text-white transition-colors">contacto@sindicatopyc.cl</a>
            </li>
          </ul>
        </div>

        {/* Mapa */}
        <div>
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">🗺️ Nuestra Ubicación</h4>
          <div className="w-full h-32 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <iframe 
              title="Mapa Ubicación Sindicato PYC"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26620.1504953322!2d-70.7818788!3d-33.5135242!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662c2df9e8e2c0b%3A0x6b4a520ccdc27b3b!2zTWFpcMO6LCBSZWdpw7NuIE1ldHJvcG9saXRhbmE!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>© 2026 Sindicato de Trabajadores PYC. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
          <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
        </div>
      </div>
    </footer>
  );
}