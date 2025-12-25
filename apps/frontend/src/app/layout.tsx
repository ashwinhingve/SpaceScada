import { Inter } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebSCADA System',
  description: 'Industrial monitoring and control system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
