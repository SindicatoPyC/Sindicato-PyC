'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../../components/Navbar'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith('/dashboard/admin');

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fb] text-slate-900">
      {!isAdminArea && <Navbar />}
      
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}