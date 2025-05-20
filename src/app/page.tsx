"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Users, Search, FileText, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const features = [
    {
      icon: <Search className="h-10 w-10 text-accent mb-4" />,
      title: "Находите задания",
      description: "Просматривайте сотни актуальных заданий в Ирбите по различным категориям.",
    },
    {
      icon: <FileText className="h-10 w-10 text-accent mb-4" />,
      title: "Размещайте заказы",
      description: "Легко создавайте задания, описывайте детали и находите подходящих исполнителей.",
    },
    {
      icon: <Users className="h-10 w-10 text-accent mb-4" />,
      title: "Для исполнителей и заказчиков",
      description: "Наша платформа соединяет тех, кто ищет помощь, с теми, кто готов ее предоставить.",
    },
     {
      icon: <CheckCircle className="h-10 w-10 text-accent mb-4" />,
      title: "Только Ирбит",
      description: "Все задания и исполнители находятся в вашем городе, что обеспечивает быстрое и удобное взаимодействие.",
    },
  ];

  const categories = [
    "Ремонт и строительство",
    "Уборка и помощь по хозяйству",
    "Курьерские услуги",
    "Компьютерная помощь",
    "Репетиторство и обучение",
    "Красота и здоровье",
  ];

  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-accent/10 via-background to-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  <Briefcase className="inline-block h-10 w-10 mr-2 text-accent" />
                  Фриланс Ирбит
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Ваша новая фриланс-площадка для поиска исполнителей и размещения заданий в городе Ирбит.
                  Быстро, удобно, локально.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="shadow-lg hover-scale">
                  <Link href="/tasks">Смотреть задания</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-lg hover-scale hover:border-accent hover:text-accent">
                  <Link href="/create-task">Разместить задание</Link>
                </Button>
              </div>
            </div>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Иллюстрация фриланс-сервиса"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-xl"
              data-ai-hint="freelance community collaboration"
            />
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Ключевые преимущества</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Почему выбирают нас?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Мы создали удобный инструмент для жителей Ирбита, чтобы упростить поиск помощи и подработки.
            </p>
          </div>
          <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift">
                {feature.icon}
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section id="categories" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Популярные категории заданий</h2>
             <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Найдите помощь или предложите свои услуги в одной из множества категорий.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Button key={category} variant="outline" className="h-auto py-3 shadow hover:shadow-md hover:border-accent hover:text-accent transition-all duration-300 hover-lift-sm" asChild>
                <Link href={`/tasks?category=${encodeURIComponent(category)}`}>
                  {category}
                </Link>
              </Button>
            ))}
             <Button variant="secondary" className="h-auto py-3 shadow hover:shadow-md transition-all duration-300 hover-lift-sm" asChild>
                <Link href="/tasks">
                  Все категории
                </Link>
              </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Как это работает?</h2>
          <div className="grid gap-10 md:grid-cols-2">
            <Card className="p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl">Для заказчиков</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p><strong>1. Опубликуйте задание:</strong> Опишите, что нужно сделать, укажите бюджет.</p>
                <p><strong>2. Получайте отклики:</strong> Исполнители из Ирбита предложат свои услуги.</p>
                <p><strong>3. Выберите лучшего:</strong> Свяжитесь с подходящим исполнителем и договоритесь о деталях.</p>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl">Для исполнителей</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p><strong>1. Найдите задания:</strong> Просматривайте новые заказы в Ирбите по вашей специализации.</p>
                <p><strong>2. Предложите услуги:</strong> Откликайтесь на интересные задания, указывайте свою цену.</p>
                <p><strong>3. Выполняйте и зарабатывайте:</strong> Договаривайтесь с заказчиками и получайте оплату.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
