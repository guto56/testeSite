import type { Metadata, Viewport } from 'next';
import { Italiana, Jost } from 'next/font/google';
import './globals.css';
import { project } from '@/data/project';

const italiana = Italiana({ variable: '--font-italiana', weight: '400', subsets: ['latin'], display: 'swap' });
const jost = Jost({ variable: '--font-jost', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: `${project.name} — lançamento`,
  description: `${project.tagline} ${project.intro}`,
  openGraph: {
    title: project.name,
    description: project.tagline,
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#161c2a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${italiana.variable} ${jost.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
