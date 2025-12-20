import { Inter } from 'next/font/google';
import './globals.css';
import SidebarWrapper from '@/components/SidebarWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Vakya | Secure Messaging',
  description: 'Ultra-modern encrypted communication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* We use a separate Wrapper component to handle Auth logic */}
        <SidebarWrapper>
          {children}
        </SidebarWrapper>
      </body>
    </html>
  );
}