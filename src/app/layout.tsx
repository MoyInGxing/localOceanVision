import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Footer from './components/Footer'
import { AuthProvider } from './context/AuthContext'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智慧海洋牧场可视化系统',
  description: '智能化海洋养殖管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
            <main className="min-h-screen">
              {children}
            </main>
          </Suspense>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
