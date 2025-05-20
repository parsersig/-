
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // Рекомендуется для разработки
  // typescript: {
  //   ignoreBuildErrors: true, // Временно закомментировано для выявления всех ошибок
  // },
  // eslint: {
  //   ignoreDuringBuilds: true, // Временно закомментировано
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
      // Например, для аватаров Google:
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  experimental: {
    // Настройка для разрешения запросов от Firebase Studio / IDX
    // Замените '*' на более конкретные домены, если известны и постоянны,
    // но для отладки '*' может помочь.
    // Для продакшена эту настройку следует тщательно проверить.
    allowedDevOrigins: [
        '*.cloudworkstations.dev', // Общий шаблон для ваших cloudworkstations
        // Вы также можете добавить более конкретные:
        // '9000-firebase-studio-1747720126707.cluster-jbb3mjctu5cbgsi6hwq6u4btwe.cloudworkstations.dev',
        // '6000-firebase-studio-1747720126707.cluster-jbb3mjctu5cbgsi6hwq6u4btwe.cloudworkstations.dev'
    ],
  },
};

export default nextConfig;
