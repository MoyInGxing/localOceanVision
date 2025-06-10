'use client';

import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import { AuthProvider } from '../context/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
        <main className="min-h-screen pt-20">
          {children}
        </main>
      </Suspense>
      <Footer />
    </AuthProvider>
  );
} 