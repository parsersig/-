// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, MessageSquare, Clock, ListChecks } from "lucide-react"; // Added Clock, ListChecks
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

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
            <Button size="lg" asChild className="hover-scale">
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
  
  const lastSignInDate = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "Недавно";

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
            <Button variant="outline" size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-background hover:bg-accent/10 border-accent/50 text-accent hover:text-accent shadow-md" title="Редактировать фото (в разработке)">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактировать фото</span>
            </Button>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || "Пользователь"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">Ирбит, Россия (заглушка) • 38 лет (заглушка)</CardDescription> 
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-green-600/20 text-green-400 border-green-500/40">Исполнитель (статус)</Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-blue-600/20 text-blue-400 border-blue-500/40">Проверен (статус)</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><UserCircle className="h-6 w-6 mr-2.5 text-accent"/>Основная информация</h3>
            <div className="space-y-2 text-sm text-muted-foreground pl-8">
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2.5 text-accent/80" />
                Email: <span className="ml-1 font-medium text-foreground/90">{user.email || "Не указан"}</span> 
                {user.emailVerified && (
                  <span title="Email подтвержден">
                    <ShieldCheck className="h-4 w-4 ml-2 text-green-400" aria-label="Email подтвержден" />
                  </span>
                )}
              </p>
              <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2.5 text-accent/80" />Дата регистрации: <span className="ml-1 font-medium text-foreground/90">{registrationDate}</span></p>
              <p className="flex items-center"><Clock className="h-4 w-4 mr-2.5 text-accent/80" />Был(а) на сайте: <span className="ml-1 font-medium text-foreground/90">{lastSignInDate} (реально)</span></p>
              <p className="text-xs mt-1">Подтверждения: Email, Телефон, Соцсеть (заглушка)</p>
            </div>
          </section>

           <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Статистика (заглушка)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center pl-8">
                <Card className="p-4 bg-muted/40 rounded-lg shadow">
                    <p className="text-3xl font-bold text-accent">34</p>
                    <p className="text-xs text-muted-foreground mt-1">заданий создано</p>
                </Card>
                <Card className="p-4 bg-muted/40 rounded-lg shadow">
                    <p className="text-3xl font-bold text-accent">0</p>
                    <p className="text-xs text-muted-foreground mt-1">заданий выполнено</p>
                </Card>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы (заглушка)</h3>
            <div className="pl-8 space-y-4">
              <div className="flex items-baseline space-x-2">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-current" />)}
                </div>
                <span className="text-muted-foreground text-lg font-semibold">5.0</span>
                <span className="text-sm text-muted-foreground">(8 отзывов)</span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" className="text-xs">Положительные (8)</Button>
                <Button variant="outline" size="sm" className="text-xs">Отрицательные (0)</Button>
              </div>
              <Card className="p-4 bg-muted/40 rounded-lg shadow">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-foreground/90">Задание «Сделать по образцу 4 макета для контекстной рекламы» <span className="text-green-400 font-normal">выполнено</span></p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">2 апреля 2025</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Исполнитель: Екатерина С.</p>
                <p className="text-sm italic">"Заказчик была на связи во время выполнения задания, оперативно приняла результат. Буду рада помочь еще!)"</p>
              </Card>
            </div>
          </section>
          
          <section className="border-t pt-6 mt-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Briefcase className="h-6 w-6 mr-2.5 text-accent"/>О себе (в разработке)</h3>
            <p className="text-sm text-muted-foreground pl-8">Здесь будет ваше описание, навыки и опыт. Вы сможете отредактировать эту информацию позже.</p>
          </section>

           <section className="border-t pt-6 mt-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации (в разработке)</h3>
            <p className="text-sm text-muted-foreground pl-8">Укажите категории услуг, которые вы предоставляете.</p>
          </section>

        </CardContent>
        <CardFooter className="border-t p-6 sm:p-8">
            <Button className="w-full hover-scale text-base py-3">
                <Edit className="h-5 w-5 mr-2" /> Редактировать профиль (в разработке)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}