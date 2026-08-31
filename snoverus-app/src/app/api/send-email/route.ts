import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Inicializa SendGrid con tu clave secreta del archivo .env.local
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json();

    // Preparamos el paquete de datos para SendGrid
    const msg = {
      to: to, // El correo real del socio
      from: 'pycsindicato@gmail.com', // TU correo verificado en SendGrid
      subject: subject,
      text: message,
    };

    // Disparamos el envío
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