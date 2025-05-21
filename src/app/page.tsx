// src/app/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Убедимся, что CardFooter импортирован
import { Briefcase, Users, Search, FileText, CheckCircle, ArrowRight, TrendingUp, UsersRound, MapPin, Star, Clock, Shield, LogIn } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, type UserCredential, getAdditionalUserInfo } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [animatedStats, setAnimatedStats] = useState([
    { value: 0, target: 150 },
    { value: 0, target: 300 },
    { value: 0, target: 100 },
  ]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => 
        prev.map(stat => ({
          ...stat,
          value: stat.value < stat.target 
                 ? Math.min(stat.value + Math.ceil(stat.target / 30), stat.target)
                 : stat.target
        }))
      );
    }, 50); 

    const allTargetsReached = animatedStats.every(stat => stat.value === stat.target);
    if (allTargetsReached) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [animatedStats]);

  const handleLogin = useCallback(async () => {
    if (!auth) {
      toast({ title: "Ошибка", description: "Сервис аутентификации недоступен.", variant: "destructive" });
      return;
    }
    try {
      const result: UserCredential = await signInWithPopup(auth, new GoogleAuthProvider());
      const additionalInfo = getAdditionalUserInfo(result);
      toast({ title: "Вход выполнен", description: "Вы успешно вошли в систему." });
      if (additionalInfo?.isNewUser) {
         router.push('/post-registration');
      }
    } catch (error: any) {
      console.error("Firebase login error on HomePage:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Не удалось войти через Google. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  }, [toast, router]);

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
    { name: "Ремонт и строительство", icon: <Briefcase className="h-5 w-5" /> },
    { name: "Уборка и помощь по хозяйству", icon: <CheckCircle className="h-5 w-5" /> },
    { name: "Курьерские услуги", icon: <MapPin className="h-5 w-5" /> },
    { name: "Компьютерная помощь", icon: <FileText className="h-5 w-5" /> },
    { name: "Репетиторство и обучение", icon: <Users className="h-5 w-5" /> },
    { name: "Красота и здоровье", icon: <Star className="h-5 w-5" /> },
    { name: "Мероприятия и промоакции", icon: <UsersRound className="h-5 w-5" /> },
    { name: "Фото и видеосъемка", icon: <Search className="h-5 w-5" /> },
  ];

  const stats = [
    {
      icon: <TrendingUp className="h-8 w-8 text-accent mb-2" />,
      value: Math.round(animatedStats[0].value) + "+",
      label: "Активных заданий",
    },
    {
      icon: <UsersRound className="h-8 w-8 text-accent mb-2" />,
      value: Math.round(animatedStats[1].value) + "+",
      label: "Пользователей в Ирбите",
    },
    {
      icon: <MapPin className="h-8 w-8 text-accent mb-2" />,
      value: Math.round(animatedStats[2].value) + "%",
      label: "Фокус на нашем городе",
    },
  ];

  const testimonials = [
    {
      text: "Нашел отличного мастера для ремонта квартиры всего за пару часов. Очень удобный сервис!",
      author: "Александр К.",
      role: "Заказчик"
    },
    {
      text: "Благодаря этой платформе я нашла дополнительный заработок рядом с домом. Теперь регулярно беру заказы на уборку.",
      author: "Елена М.",
      role: "Исполнитель"
    },
    {
      text: "Искал курьера срочно доставить документы. Через 15 минут после размещения задания уже нашелся исполнитель!",
      author: "Дмитрий В.",
      role: "Заказчик"
    }
  ];

  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-accent/5 to-background text-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Briefcase className="h-16 w-16 sm:h-20 sm:w-20 text-accent animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Новое</div>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              Фриланс <span className="text-accent">Ирбит</span>
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
              Ваша новая фриланс-площадка для поиска исполнителей и размещения заданий в городе Ирбит.
              Быстро, удобно и всегда под рукой для местных нужд.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Button asChild size="lg" className="shadow-lg hover:scale-105 transition-transform text-lg px-8 py-6">
                <Link href="/tasks">Смотреть задания</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="shadow-lg hover:scale-105 transition-transform hover:bg-accent/10 hover:border-accent hover:text-accent text-lg px-8 py-6"
              >
                <Link href="/create-task">Разместить задание</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
              {stats.map((stat, index) => (
                <div key={index} className="p-6 bg-card/60 backdrop-blur-sm rounded-xl shadow-lg text-center hover:scale-105 transition-all duration-300 hover:shadow-accent/20">
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
              <Card key={index} className="text-center p-6 shadow-lg hover:shadow-accent/30 transition-all duration-300 hover:scale-105 bg-card/70 backdrop-blur-sm">
                <CardHeader className="p-0 mb-2">
                  {feature.icon}
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
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
              <Link
                key={category.name}
                href={`/tasks?category=${encodeURIComponent(category.name)}`}
                className="block p-4 rounded-lg border bg-card hover:bg-accent/10 hover:border-accent text-card-foreground shadow-sm hover:shadow-md hover:shadow-accent/30 transition-all duration-300 hover-scale-105 cursor-pointer group"
              >
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-accent/10 text-accent mr-3">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">{category.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Найти задания в этой категории</p>
              </Link>
            ))}
             <Link
                href="/tasks"
                className="block p-4 rounded-lg border bg-secondary hover:bg-accent/20 hover:border-accent text-secondary-foreground shadow-sm hover:shadow-md hover:shadow-accent/30 transition-all duration-300 hover:scale-105 cursor-pointer group flex flex-col items-center justify-center text-center sm:col-span-2 md:col-span-1 lg:col-span-full min-h-[100px]"
             >
                <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors flex items-center">
                  Все категории <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Посмотреть все доступные задания</p>
              </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Как это работает?</h2>
          <div className="grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2">
            <Card className="p-6 sm:p-8 shadow-xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105 bg-card/70 backdrop-blur-sm">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-accent/10 text-accent mr-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl">Для заказчиков</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-muted-foreground">
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">1</span> <span><strong>Опубликуйте задание:</strong> Подробно опишите вашу задачу, чтобы исполнители поняли объем работ, укажите бюджет.</span></p>
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">2</span> <span><strong>Получайте отклики:</strong> Заинтересованные специалисты из Ирбита предложат свои услуги.</span></p>
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">3</span> <span><strong>Выберите лучшего:</strong> Ознакомьтесь с предложениями, свяжитесь с подходящим исполнителем и договоритесь о деталях.</span></p>
                <Button asChild size="lg" className="mt-6 w-full hover-scale">
                  <Link href="/create-task">Разместить задание</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="p-6 sm:p-8 shadow-xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105 bg-card/70 backdrop-blur-sm">
              <CardHeader className="p-0 mb-4">
                 <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-accent/10 text-accent mr-4">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl">Для исполнителей</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-muted-foreground">
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">1</span> <span><strong>Найдите задания:</strong> Просматривайте новые заказы в Ирбите по вашей специализации.</span></p>
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">2</span> <span><strong>Предложите услуги:</strong> Откликайтесь на интересные задания, указывайте свою цену и условия.</span></p>
                <p className="flex items-start"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground mr-3 text-md font-bold shrink-0">3</span> <span><strong>Выполняйте и зарабатывайте:</strong> Договаривайтесь с заказчиками напрямую и получайте оплату за качественно выполненную работу.</span></p>
                <Button asChild size="lg" className="mt-6 w-full hover-scale">
                  <Link href="/tasks">Найти задания</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="testimonials" className="w-full py-12 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Отзывы</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Что говорят пользователи</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Реальные истории успеха от жителей Ирбита
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 shadow-lg hover:shadow-accent/30 transition-all duration-300 hover:scale-105 bg-card/70 backdrop-blur-sm flex flex-col">
                <CardContent className="pt-6 flex-grow">
                  <div className="mb-4 flex justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic mb-4 text-sm">"{testimonial.text}"</p>
                </CardContent>
                <CardFooter className="pt-4 border-t mt-auto">
                  <div className="text-left w-full">
                    <div className="text-sm font-semibold">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-16 bg-accent/10">
        <div className="container px-4 md:px-6 text-center">
          <div className="flex flex-col items-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Готовы начать?</h2>
            <p className="text-muted-foreground mb-8 md:text-lg">
              Присоединяйтесь к растущему сообществу фрилансеров и заказчиков в Ирбите уже сегодня!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleLogin} size="lg" className="shadow-lg hover:scale-105 transition-transform">
                 <LogIn className="mr-2 h-5 w-5" /> Зарегистрироваться / Войти
              </Button>
              <Button asChild variant="outline" size="lg" className="shadow-lg hover:scale-105 transition-transform">
                <Link href="/tasks">Посмотреть задания</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Безопасные сделки</h3>
              <p className="text-sm text-muted-foreground">
                Проверенные исполнители и заказчики. Система рейтингов и отзывов.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Только местные</h3>
              <p className="text-sm text-muted-foreground">
                Все исполнители из Ирбита. Никаких лишних поездок и дополнительных расходов.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Быстрый отклик</h3>
              <p className="text-sm text-muted-foreground">
                Получайте отклики на ваши задания в течение нескольких часов или даже минут.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
