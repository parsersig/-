import type { Metadata } from 'next';
// import { GeistSans } from 'geist/font/sans'; // Keep commented for now
// import { GeistMono } from 'geist/font/mono'; // Keep commented for now
import './globals.css';
import Header from '@/components/layout/header'; // Restore Header import
import { Toaster } from '@/components/ui/toaster'; // Restore Toaster import

export const metadata: Metadata = { // Restore metadata
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
      {/* <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased flex flex-col min-h-screen`}> */}
      <body className="antialiased flex flex-col min-h-screen bg-background text-foreground"> {/* Restore basic body classes */}
        <Header /> {/* Restore Header usage */}
        <main className="flex-grow container mx-auto px-4 py-8"> {/* Restore main classes */}
          {children}
        </main>
        <Toaster /> {/* Restore Toaster usage */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t"> {/* Restore original footer */}
          © {new Date().getFullYear()} Фриланс Ирбит. Все права защищены.
        </footer>
      </body>
    </html>
  );
}
