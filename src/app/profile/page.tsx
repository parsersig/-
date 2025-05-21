// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="items-center text-center border-b pb-6">
          <div className="relative">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 mb-4 border-4 border-accent shadow-lg">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-4xl sm:text-5xl bg-muted/50">
                {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : <UserCircle />}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="icon" className="absolute bottom-4 right-0 h-9 w-9 rounded-full bg-background hover:bg-accent/10 border-accent text-accent hover:text-accent shadow-md">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактировать фото</span>
            </Button>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || "Пользователь"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">Ирбит, Россия</CardDescription> 
          {/* Добавим пример тегов или статуса */}
          <div className="flex gap-2 mt-3">
            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Исполнитель</span>
            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">Проверен</span>
          </div>
        </CardHeader>
        <CardContent className="mt-6 space-y-4">
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-3 text-accent/80" />
            <span className="text-muted-foreground">Email: {user.email || "Не указан"}</span>
            {user.emailVerified && <ShieldCheck className="h-5 w-5 ml-2 text-green-500" title="Email подтвержден" />}
          </div>
          <div className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-3 text-accent/80" />
            <span className="text-muted-foreground">Дата регистрации: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ru-RU') : "Неизвестно"}</span>
          </div>
          
          {/* TODO: Добавить поля для редактирования: О себе, Специализации, Портфолио */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90">О себе (в разработке)</h3>
            <p className="text-muted-foreground text-sm">Здесь будет ваше описание, навыки и опыт. Вы сможете отредактировать эту информацию позже.</p>
          </div>
           <div className="pt-4">
            <h3 className="text-lg font-semibold mb-2 text-foreground/90">Специализации (в разработке)</h3>
            <p className="text-muted-foreground text-sm">Укажите категории услуг, которые вы предоставляете.</p>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button className="w-full hover-scale">
                <Edit className="h-4 w-4 mr-2" /> Редактировать профиль (в разработке)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
