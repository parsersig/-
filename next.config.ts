
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // Рекомендуется для разработки
  // typescript: {
  //   ignoreBuildErrors: true, // Раскомментируйте, если нужно временно игнорировать ошибки TS при сборке
  // },
  // eslint: {
  //   ignoreDuringBuilds: true, // Раскомментируйте, если нужно временно игнорировать ошибки ESLint при сборке
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Добавьте сюда другие хосты для изображений, если они есть в вашем рабочем проекте
      // Например, для аватаров Google, если вы используете Firebase Auth:
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
      // Если ваш рабочий проект использует другие домены для изображений,
      // их нужно будет добавить сюда.
    ],
  },
  experimental: {
    // Настройка для разрешения запросов от Firebase Studio / IDX
    // Замените '*.cloudworkstations.dev' на более конкретные домены, если известны и постоянны,
    // но для отладки этот шаблон может помочь.
    // Для продакшена эту настройку следует тщательно проверить.
    allowedDevOrigins: [
        '*.cloudworkstations.dev', // Общий шаблон для ваших cloudworkstations
        // Вы можете также добавить более конкретные URL, если они известны:
        // '9000-firebase-studio-YOUR_SPECIFIC_HASH.cloudworkstations.dev',
        // '6000-firebase-studio-YOUR_SPECIFIC_HASH.cloudworkstations.dev'
    ],
  },
  // Здесь могут быть другие ваши конфигурации из рабочего next.config.ts
  // Убедитесь, что они сохранены или объединены с этим.
};

export default nextConfig;
