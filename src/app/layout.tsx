// src/app/layout.tsx

// import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono';
// import './globals.css'; // globals.css сейчас почти пуст
// import Header from '@/components/layout/header';
// import { Toaster } from '@/components/ui/toaster';

/* export const metadata = {
  title: 'App Title',
  description: 'App description',
}; */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased flex flex-col min-h-screen`}> */}
      <body> {/* Убраны все классы */}
        {/* <Header /> */}
        <main style={{ padding: '20px', border: '1px dashed #ccc', minHeight: '80vh' }}> {/* Минимальные инлайн-стили для main */}
          {children}
        </main>
        {/* <Toaster /> */}
        <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #ccc' }}> {/* Минимальные инлайн-стили для footer */}
          © {new Date().getFullYear()} App Footer (Minimal)
        </footer>
      </body>
    </html>
  );
}
