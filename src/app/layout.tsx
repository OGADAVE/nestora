import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { siteUrl } from '@/lib/format';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Nestora | Buy. Rent. Invest.', template: '%s | Nestora' },
  description: 'Verified homes, land, shortlets and vehicles across Nigeria. Search with plain English, talk to verified agents, and invest with confidence.',
  openGraph: { siteName: 'Nestora', type: 'website', locale: 'en_NG' },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#0b1426', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
