import './globals.css';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppToaster from '@/components/AppToaster';

export const metadata: Metadata = {
  title: 'Netflix Clone',
  description: 'A Netflix clone built with next.js',
};

const RootLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className="bg-brand-dark text-white antialiased selection:bg-purple-500/30"
        suppressHydrationWarning
      >
        <div className="relative min-h-screen mx-auto max-w-480">
          <Suspense fallback={null}>
            <AppToaster />
            {children}
          </Suspense>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
