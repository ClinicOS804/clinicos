import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { template: '%s | ClinicOS AI', default: 'ClinicOS AI — Smart Clinic Management' },
  description: 'AI-powered clinic management with WhatsApp receptionist, appointment booking, and patient management.',
  metadataBase: new URL('https://clinicos.workee.online'),
  icons: { icon: '/favicon.svg' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-app">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600' } }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
