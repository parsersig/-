
// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCircle, LogIn } from "lucide-react";
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
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 border-2 border-accent shadow-lg">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-4xl sm:text-5xl">
              {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{user.displayName || "Пользователь"}</CardTitle>
          {user.email && <CardDescription className="text-md text-muted-foreground pt-1">{user.email}</CardDescription>}
        </CardHeader>
        <CardContent className="mt-4">
          <p className="text-muted-foreground text-center">Здесь будет дополнительная информация о вашем профиле, настройки и другие персональные данные.</p>
          <p className="text-muted-foreground text-center mt-2">Эта функциональность находится в разработке.</p>
          {/* TODO: Add profile editing form, user details etc. */}
        </CardContent>
      </Card>
    </div>
  );
}
