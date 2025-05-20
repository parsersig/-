// import type { Metadata } from 'next'; // Metadata удалена для теста

// export const metadata: Metadata = { // Metadata удалена для теста
//   title: 'Фриланс Ирбит - Найди исполнителя или работу в Ирбите',
//   description: 'Платформа для заказчиков и исполнителей в городе Ирбит. Фриланс Ирбит - размещайте и находите задания легко!',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* Все классы удалены */}
      <body>
        {/* Header и Toaster закомментированы */}
        {/* <Header /> */}
        {/* <main className="flex-grow container mx-auto px-4 py-8"> */}
        <main> {/* Классы удалены для теста */}
          {children}
        </main>
        {/* <Toaster /> */}
        {/* Футер максимально упрощен и стилизован инлайн */}
        <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #cccccc', fontSize: '12px', marginTop: '30px' }}>
          © 2024 Фриланс Ирбит. Все права защищены. (Ультра-минимальный тест)
        </footer>
      </body>
    </html>
  );
}
