
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Users, Search, FileText, CheckCircle, ArrowRight, TrendingUp, UsersRound, MapPin } from 'lucide-react';

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
    "Мероприятия и промоакции",
    "Фото и видеосъемка",
  ];

  const stats = [
    {
      icon: <TrendingUp className="h-8 w-8 text-accent mb-2" />,
      value: "150+",
      label: "Активных заданий",
    },
    {
      icon: <UsersRound className="h-8 w-8 text-accent mb-2" />,
      value: "300+",
      label: "Пользователей в Ирбите",
    },
    {
      icon: <MapPin className="h-8 w-8 text-accent mb-2" />,
      value: "100%",
      label: "Фокус на нашем городе",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-accent/5 to-background text-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6">
            <Briefcase className="h-16 w-16 sm:h-20 sm:w-20 text-accent" />
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              Фриланс Ирбит
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
              Ваша новая фриланс-площадка для поиска исполнителей и размещения заданий в городе Ирбит.
              Быстро, удобно и всегда под рукой для местных нужд.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Button asChild size="lg" className="shadow-lg hover-scale text-lg px-8 py-6">
                <Link href="/tasks">Смотреть задания</Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="shadow-lg hover-scale hover:bg-accent/10 hover:border-accent hover:text-accent text-lg px-8 py-6"
              >
                <Link href="/create-task">Разместить задание</Link>
              </Button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
              {stats.map((stat, index) => (
                <div key={index} className="p-6 bg-card/60 backdrop-blur-sm rounded-xl shadow-lg text-center hover-lift transition-all duration-300 hover:shadow-accent/20">
                  {stat.icon}
                  <div className="text-3xl font-bold text-accent">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Ключевые преимущества</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Почему выбирают нас?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Мы создали удобный инструмент для жителей Ирбита, чтобы упростить поиск помощи и подработки.
            </p>
          </div>
          <div className="mx-auto grid items-start gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-5xl">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/70 backdrop-blur-sm">
                {feature.icon}
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section id="categories" className="w-full py-12 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Популярные категории заданий</h2>
             <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Найдите помощь или предложите свои услуги в одной из множества категорий.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link key={category} href={`/tasks?category=${encodeURIComponent(category)}`} passHref legacyBehavior>
                <a className="block p-4 rounded-lg border bg-card hover:bg-accent/10 hover:border-accent text-card-foreground shadow-sm hover:shadow-md hover:shadow-accent/30 transition-all duration-300 hover-lift cursor-pointer group">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">{category}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Найти задания в этой категории</p>
                </a>
              </Link>
            ))}
             <Link href="/tasks" passHref legacyBehavior>
                <a className="block p-4 rounded-lg border bg-secondary hover:bg-accent/20 hover:border-accent text-secondary-foreground shadow-sm hover:shadow-md hover:shadow-accent/30 transition-all duration-300 hover-lift cursor-pointer group flex flex-col items-center justify-center text-center sm:col-span-2 md:col-span-1 lg:col-span-full min-h-[100px]"> {/* Changed to lg:col-span-full for better mobile stacking then full width */}
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors flex items-center">
                    Все категории <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Посмотреть все доступные задания</p>
                </a>
              </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Как это работает?</h2>
          <div className="grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2">
            <Card className="p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Для заказчиков</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p><strong>1. Опубликуйте задание:</strong> Опишите, что нужно сделать, укажите бюджет.</p>
                <p><strong>2. Получайте отклики:</strong> Исполнители из Ирбита предложат свои услуги.</p>
                <p><strong>3. Выберите лучшего:</strong> Свяжитесь с подходящим исполнителем и договоритесь о деталях.</p>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/70 backdrop-blur-sm">
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
    
