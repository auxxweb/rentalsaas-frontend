import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import GlobalSettingsProvider from '@/components/providers/GlobalSettingsProvider'
import TenantLocaleSync from '@/components/TenantLocaleSync'
import DeferredChatWidget from '@/components/DeferredChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rental Store Billing SaaS',
  description: 'Cloud-based Rental Store Billing Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var key = 'rental_saas_theme';
    var stored = localStorage.getItem(key);
    var theme = (stored === 'light' || stored === 'dark') ? stored : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <GlobalSettingsProvider>
        <TenantLocaleSync />
        <ThemeProvider>
          <QueryProvider>
            {children}
            <DeferredChatWidget />
            <ToastContainer position="top-right" autoClose={3000} />
          </QueryProvider>
        </ThemeProvider>
        </GlobalSettingsProvider>
      </body>
    </html>
  )
}
