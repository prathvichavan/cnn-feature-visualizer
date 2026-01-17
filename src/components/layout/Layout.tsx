import { ReactNode } from 'react';
import Navbar from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      {/* Add padding top to account for fixed navbar */}
      <main className="flex-1 pt-20 pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
