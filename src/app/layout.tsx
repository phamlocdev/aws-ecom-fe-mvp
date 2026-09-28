import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { AppProviders } from '@/providers/app-providers'
import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "PhuLoc's Ecommerce - Version 2.0",
  description:
    'A modern e-commerce platform built with Next.js and AWS services, such as S3, CloudFront, and DynamoDB. This platform provides a seamless shopping experience with a focus on performance, scalability, and security.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='vi' className={`${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full bg-background text-foreground'>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <Toaster position='bottom-right' />
        </AppProviders>
      </body>
    </html>
  )
}
