import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'fishLab - 3D Akvaryum Ekosistem Simülasyonu',
  description: '3D Akvaryum Ekosistem Simülasyonu ve E-Ticaret Platformu',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#060d18' }}>
      <body
        className="bg-[#060d18] text-slate-100 antialiased overflow-hidden"
        style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#060d18', color: '#f1f5f9' }}
      >
        {children}
      </body>
    </html>
  );
}
