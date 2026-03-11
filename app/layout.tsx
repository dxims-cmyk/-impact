import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-jakarta', weight: ['400', '500', '600', '700', '800'] })

export const viewport: Viewport = {
  themeColor: '#6E0F1A',
}

export const metadata: Metadata = {
  title: ': Impact | Growth Dashboard',
  description: 'Your growth marketing command center',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: ': Impact',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans h-full antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {})
                })
              }
            `,
          }}
        />
        <Providers>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
          />
        </Providers>
      </body>
    </html>
  )
}
