import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aviator Simulator',
  description: 'Provably Fair crash game simulator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
