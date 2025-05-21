"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  LogIn, 
  Edit, 
  Mail, 
  ShieldCheck, 
  CalendarDays, 
  Briefcase, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Clock,
  CheckCircle2,
  Phone,
  CircleUserRound,
  ListChecks
} from "lucide-react";
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [reviewFilter, setReviewFilter] = useState("positive");

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth instance is not available in ProfilePage.");
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <UserCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8">
          <CardHeader>
            <div className="flex flex-col items-center space-y-3">
              <LogIn className="h-12 w-12 text-accent" />
              <CardTitle className="text-2xl sm:text-3xl font-bold">Войдите, чтобы просмотреть профиль</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Для доступа к этой странице необходимо войти в систему.</p>
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
                <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const registrationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "Неизвестно";

  const mockReviews = [
    {
      id: 1,
      date: "2 апреля 2025",
      taskName: "Сделать по образцу 4 макета для контекстной рекламы",
      reviewerName: "Екатерина С.",
      comment: "Заказчик была на связи во время выполнения задания, оперативно приняла результат. Буду рада помочь еще!)",
      rating: 5,
      type: "positive"
    },
    {
      id: 2,
      date: "15 марта 2025",
      taskName: "Разработка дизайна визитки для компании",
      reviewerName: "Алексей М.",
      comment: "Четкое ТЗ, быстрая оплата, приятно сотрудничать!",
      rating: 5,
      type: "positive"
    },
    {
      id: 3,
      date: "27 февраля 2025",
      taskName: "Верстка лендинга по макету из Figma",
      reviewerName: "Сергей К.",
      comment: "Отличный заказчик, все четко и по делу. Рекомендую!",
      rating: 5,
      type: "positive"
    }
  ];

  const filteredReviews = mockReviews.filter(review => review.type === reviewFilter);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-10">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="items-center text-center border-b pb-6 bg-muted/20 p-6 sm:p-8">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-accent shadow-lg">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-4xl sm:text-5xl bg-muted/50">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle className="h-16 w-16"/>}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="icon" className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-background hover:bg-accent/10 border-accent text-accent hover:text-accent shadow-md">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактировать фото</span>
            </Button>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || "Екатерина Н."}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">38 лет, Москва</CardDescription> 
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Исполнитель</Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Проверенный аккаунт</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center">
              <p className="text-3xl font-bold text-accent">34</p>
              <p className="text-sm text-muted-foreground">заданий создано</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center">
              <p className="text-3xl font-bold text-accent">0</p>
              <p className="text-sm text-muted-foreground">заданий выполнено</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center">
                <p className="text-3xl font-bold text-accent mr-2">5.0</p>
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-sm text-muted-foreground">8 отзывов</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-accent/80"/>Основная информация
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground pl-7">
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-accent/70" />
                Email: {user.email || "example@mail.ru"} 
                {user.emailVerified && <ShieldCheck className="h-4 w-4 ml-1.5 text-green-500" title="Email подтвержден" />}
              </p>
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-accent/70" />
                Телефон: +7 (XXX) XXX-XX-XX <ShieldCheck className="h-4 w-4 ml-1.5 text-green-500" title="Телефон подтвержден" />
              </p>
              <p className="flex items-center">
                <CircleUserRound className="h-4 w-4 mr-2 text-accent/70" />
                Соцсеть: <span className="ml-1">Подтверждена</span> <ShieldCheck className="h-4 w-4 ml-1.5 text-green-500" title="Соцсеть подтверждена" />
              </p>
              <p className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-accent/70" />
                Дата регистрации: {registrationDate}
              </p>
              <p className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-accent/70" />
                Была на сайте: 21 мая 2025
              </p>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4 text-foreground/90 flex items-center">
              <Star className="h-5 w-5 mr-2 text-accent/80"/>Отзывы и рейтинг
            </h3>
            <div className="pl-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                  </div>
                  <span className="font-medium">Средняя оценка 5.0</span>
                </div>
                <Select value={reviewFilter} onValueChange={setReviewFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Фильтр отзывов" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="positive">Положительные (8)</SelectItem>
                      <SelectItem value="negative">Отрицательные (0)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(review => (
                    <Card key={review.id} className="p-4 bg-muted/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{review.date}</p>
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">Задание «{review.taskName}» выполнено</p>
                      <p className="text-sm italic mb-2">"{review.comment}"</p>
                      <p className="text-xs text-muted-foreground">Исполнитель {review.reviewerName}</p>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Отзывов данного типа пока нет</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-accent/80"/>О себе
            </h3>
            <div className="pl-7 bg-muted/20 p-4 rounded-lg">
              <p className="text-sm">
                Опыт работы в графическом дизайне более 10 лет. Специализируюсь на создании рекламных 
                материалов, логотипов и брендбуков. Работаю быстро и качественно, всегда соблюдаю дедлайны. 
                Готова к сотрудничеству как с частными лицами, так и с компаниями.
              </p>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center">
              <ListChecks className="h-5 w-5 mr-2 text-accent/80"/>Специализации
            </h3>
            <div className="pl-7 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-muted/20">Графический дизайн</Badge>
              <Badge variant="outline" className="bg-muted/20">Разработка логотипов</Badge>
              <Badge variant="outline" className="bg-muted/20">Брендинг</Badge>
              <Badge variant="outline" className="bg-muted/20">Дизайн рекламы</Badge>
              <Badge variant="outline" className="bg-muted/20">Веб-дизайн</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t p-6 sm:p-8">
            <Button className="w-full hover:scale-105 transition-transform">
                <Edit className="h-4 w-4 mr-2" /> Редактировать профиль
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}