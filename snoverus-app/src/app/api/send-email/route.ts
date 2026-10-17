import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Inicializa SendGrid con tu clave secreta del archivo .env.local
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(request: Request) {
  try {
    // 1. Recibimos las variables EXACTAS que envía el panel de admin
    const { email, nombre, rut, password, sindicato } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Falta el correo de destino' }, { status: 400 });
    }

    // 2. Preparamos el paquete de datos para SendGrid con diseño HTML
    const msg = {
      to: email, 
      from: 'pycsindicato@gmail.com', // IMPORTANTE: Este correo DEBE estar verificado en tu cuenta de SendGrid
      subject: `¡Bienvenido al ${sindicato}! - Credenciales de acceso`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">¡Hola ${nombre}! 🎉</h2>
          <p>Tu postulación ha sido aprobada con éxito. Bienvenido/a de manera oficial al <strong>${sindicato}</strong>.</p>
          <p>Aquí tienes tus credenciales seguras para acceder al Portal de Socios:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>RUT:</strong> ${rut}</p>
            <p style="margin: 0;"><strong>Contraseña Temporal:</strong> <span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</span></p>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">⚠️ <em>Te recomendamos iniciar sesión y cambiar esta contraseña lo antes posible.</em></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático de la plataforma Sindicato PYC. Por favor no respondas a este correo.</p>
        </div>
      `,
    };

    // 3. Disparamos el envío
    await sgMail.send(msg);

    return NextResponse.json({ success: true, message: 'Correo enviado por SendGrid' }, { status: 200 });
  } catch (error: any) {
    console.error("Fallo el envío por SendGrid:", error);
    
    if (error.response) {
      console.error(error.response.body);
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}