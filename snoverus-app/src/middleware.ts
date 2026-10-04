import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  const sessionCookie = request.cookies.get('sb-sindicato-session')?.value;
  // Convertimos a minúsculas y limpiamos espacios para evitar bloqueos tontos
  const rolCookie = request.cookies.get('sb-sindicato-rol')?.value?.toLowerCase()?.trim();

  const isLoginPage = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdminArea = pathname.startsWith('/dashboard/admin');
  
  // 🎯 NUEVO: Detectar si el usuario intenta entrar a una ruta de asistencia por QR
  const isAsistenciaPage = pathname.startsWith('/asistencia/');

  // 🛡️ 1. Si va al dashboard sin sesión -> Al login
  if (isDashboard && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 🎯 1.1 NUEVO: Si va a una ruta de asistencia por QR sin sesión -> Al login con el parámetro redirect
  if (isAsistenciaPage && !sessionCookie) {
    const loginUrl = new URL('/', request.url);
    // Guardamos la ruta exacta del QR para que el login te devuelva aquí tras entrar
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ 2. Si está en el login y YA tiene sesión -> Al dashboard (A menos que traiga un redirect pendiente de QR)
  if (isLoginPage && sessionCookie) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    if (redirectParam) {
      // Si venía de un QR, dejamos que pase al login para que consuma el redirect tras autenticar
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🛡️ 3. Protección del panel de administración
  if (isAdminArea) {
    // Si NO eres ninguno de estos 3, te expulsa al dashboard
    if (rolCookie !== 'admin' && rolCookie !== 'administrador' && rolCookie !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}