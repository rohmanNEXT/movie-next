import type {Metadata} from 'next';
import './globals.css';
import AppToaster from '@/components/AppToaster';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Netflix Clone',
  description: 'A Netflix clone built with React.js',
};

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-brand-dark text-white antialiased selection:bg-purple-500/30">
        <div className="relative min-h-screen mx-auto max-w-[1920px]">
            <AppToaster />
            {children}
        </div>
      </body>
       </html>
  );
};

export default RootLayout;
