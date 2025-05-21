
// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, MessageSquare } from "lucide-react";
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
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
          <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || "Пользователь"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">Ирбит, Россия (заглушка)</CardDescription> 
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Исполнитель (заглушка)</Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Проверен (заглушка)</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center"><UserCircle className="h-5 w-5 mr-2 text-accent/80"/>Основная информация</h3>
            <div className="space-y-1.5 text-sm text-muted-foreground pl-7">
              <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-accent/70" />Email: {user.email || "Не указан"} {user.emailVerified && <ShieldCheck className="h-4 w-4 ml-1.5 text-green-500" title="Email подтвержден" />}</p>
              <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-accent/70" />Дата регистрации: {registrationDate}</p>
              <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-accent/70" />Был(а) на сайте: Сегодня (заглушка)</p>
            </div>
          </div>

           <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-accent/80"/>Статистика (заглушка)</h3>
            <div className="grid grid-cols-2 gap-4 text-center pl-7">
                <Card className="p-3 bg-muted/30">
                    <p className="text-2xl font-bold text-accent">12</p>
                    <p className="text-xs text-muted-foreground">Заданий создано</p>
                </Card>
                <Card className="p-3 bg-muted/30">
                    <p className="text-2xl font-bold text-accent">5</p>
                    <p className="text-xs text-muted-foreground">Заданий выполнено</p>
                </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center"><Star className="h-5 w-5 mr-2 text-accent/80"/>Рейтинг и Отзывы (заглушка)</h3>
            <div className="pl-7 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                </div>
                <span className="text-muted-foreground text-sm">5.0 (8 отзывов)</span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" className="text-xs">Положительные (8)</Button>
                <Button variant="outline" size="sm" className="text-xs">Отрицательные (0)</Button>
              </div>
              <Card className="p-3 bg-muted/30">
                <p className="text-sm font-semibold">Задание «Сделать макеты» выполнено</p>
                <p className="text-xs text-muted-foreground mb-1">Катерина С. • 2 апреля 2025</p>
                <p className="text-sm italic">"Отличный заказчик, четкое ТЗ, быстрая оплата!"</p>
              </Card>
            </div>
          </div>
          
          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-accent/80"/>О себе (в разработке)</h3>
            <p className="text-sm text-muted-foreground pl-7">Здесь будет ваше описание, навыки и опыт. Вы сможете отредактировать эту информацию позже.</p>
          </div>

           <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-accent/80"/>Специализации (в разработке)</h3>
            <p className="text-sm text-muted-foreground pl-7">Укажите категории услуг, которые вы предоставляете.</p>
          </div>

        </CardContent>
        <CardFooter className="border-t p-6 sm:p-8">
            <Button className="w-full hover-scale">
                <Edit className="h-4 w-4 mr-2" /> Редактировать профиль (в разработке)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    