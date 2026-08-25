import os
import uuid  # <-- NUEVO: Para generar IDs únicos para las reuniones
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

app = FastAPI()

# Configurar CORS para que Next.js pueda comunicarse con Python sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODELOS DE DATOS (Pydantic)
# ==========================================
class PreguntaRequest(BaseModel):
    pregunta: str

class ReunionRequest(BaseModel):  # <-- NUEVO: Modelo para recibir los datos de la reunión
    tema: str

# Variable global para guardar el texto extraído del PDF
texto_pdf_global = ""

# ==========================================
# INICIO DEL SERVIDOR Y CARGA DE MEMORIA
# ==========================================
@app.on_event("startup")
def cargar_pdf():
    global texto_pdf_global
    pdf_path = "contrato.pdf"
    
    if os.path.exists(pdf_path):
        try:
            reader = PdfReader(pdf_path)
            texto_extraido = ""
            for i, page in enumerate(reader.pages):
                texto_extraido += f"\n--- Página {i+1} ---\n" + page.extract_text()
            
            texto_pdf_global = texto_extraido
            print(f"✅ Documento '{pdf_path}' cargado y leído exitosamente en la memoria local (Modo Gratis).")
        except Exception as e:
            print(f"❌ Error al leer el PDF: {e}")
    else:
        print(f"⚠️ Advertencia: No se encontró el archivo '{pdf_path}' en la carpeta.")

# ==========================================
# ENDPOINT 1: ASISTENTE LEGAL INTELIGENTE (RAG)
# ==========================================
@app.post("/api/chat-legal")
def responder_pregunta(data: PreguntaRequest):
    global texto_pdf_global
    pregunta = data.pregunta.lower()

    if not texto_pdf_global:
        raise HTTPException(status_code=500, detail="El documento PDF no está cargado en el servidor.")

    # Buscador inteligente local basado en palabras clave dentro del PDF
    lineas = texto_pdf_global.split('\n')
    resultados_relevantes = []

    # Extraer palabras clave de la pregunta del usuario (ignorando palabras vacías)
    palabras_clave = [p for p in pregunta.split() if len(p) > 3]

    for linea in lineas:
        # Si alguna palabra clave de la pregunta aparece en la línea del PDF, la guardamos
        if any(palabra in linea.lower() for palabra in palabras_clave):
            resultados_relevantes.append(linea)

    # Si encontramos coincidencias directas, armamos la respuesta concisa
    if resultados_relevantes:
        extracto_unido = "\n".join([f"• {linea.strip()}" for linea in resultados_relevantes[:3] if len(linea.strip()) > 5])
        respuesta_texto = (
            f"Respecto a su consulta sobre \"{data.pregunta}\", el contrato colectivo establece lo siguiente:\n\n"
            f"{extracto_unido}"
        )
        fuente = "contrato.pdf (Base Documental Oficial)"
    else:
        # Respuesta corta, directa y sin rodeos
        respuesta_texto = (
            f"No se encontró una cláusula exacta para \"{data.pregunta}\". "
            f"Por favor, intente buscar con términos más específicos (ej: 'bono', 'vacaciones', 'permisos')."
        )
        fuente = "contrato.pdf (Búsqueda general)"

    return {
        "respuesta": respuesta_texto,
        "fuente": fuente
    }

# ==========================================
# ENDPOINT 2: ASAMBLEAS VIRTUALES (JITSI) <-- ¡NUEVO!
# ==========================================
@app.post("/api/reuniones/nueva")
def crear_reunion(reunion: ReunionRequest):
    # Generamos un ID único, corto y seguro para la sala de la asamblea
    codigo_unico = uuid.uuid4().hex[:8]
    sala_id = f"SindicatoPYC-{codigo_unico}"
    
    # Aquí puedes enviar un log a consola para verificar cuando un directivo crea una sala
    print(f"📹 Nueva sala de asamblea creada: {sala_id} - Tema: {reunion.tema}")
    
    return {
        "mensaje": "Sala virtual generada con éxito",
        "tema": reunion.tema,
        "sala_id": sala_id,
        "url_publica": f"https://meet.jit.si/{sala_id}"
    }