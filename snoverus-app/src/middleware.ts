import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  const sessionCookie = request.cookies.get('sb-sindicato-session')?.value;
  const rolCookie = request.cookies.get('sb-sindicato-rol')?.value;

  const isLoginPage = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdminArea = pathname.startsWith('/dashboard/admin');

  // 🛡️ 1. Si va al dashboard sin sesión -> Al login
  if (isDashboard && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 🛡️ 2. Si está en el login y YA tiene sesión -> Al dashboard
  if (isLoginPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🛡️ 3. Protección del panel de administración
  if (isAdminArea && rolCookie !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}