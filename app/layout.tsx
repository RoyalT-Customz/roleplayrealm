import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Roleplay Realm - FiveM Community Hub',
  description: 'Connect with FiveM servers, share RP content, discover scripts, and join events',
  openGraph: {
    title: 'Roleplay Realm - FiveM Community Hub',
    description: 'Connect with FiveM servers, share RP content, discover scripts, and join events',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.variable}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}

