import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google'; // Fonts commented out
// import './globals.css'; // Still imported, but globals.css is now empty
// import { Toaster } from "@/components/ui/toaster"; // Toaster commented out
// import Header from '@/components/layout/header'; // Header commented out

/*
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
*/

export const metadata: Metadata = {
  title: 'Фриланс Ирбит - Найди исполнителя или работу в Ирбите',
  description: 'Платформа для заказчиков и исполнителей в городе Ирбит. Фриланс Ирбит - размещайте и находите задания легко!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* All classNames removed from body */}
      <body>
        {/* Header component is commented out */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        {/* Toaster component is commented out */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Фриланс Ирбит. Все права защищены.
        </footer>
      </body>
    </html>
  );
}
