
// src/app/my-responses/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, LogIn, UserCircle } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyResponsesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (!auth) { // Check if Firebase auth is even configured/available
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
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Проверка аутентификации...</p>
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
              <CardTitle className="text-2xl sm:text-3xl font-bold">Войдите, чтобы видеть ваши отклики</CardTitle>
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
        <CardHeader>
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Мои отклики</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Здесь будут отображаться ваши отклики на задания других пользователей.</p>
          <p className="text-muted-foreground mt-2">Эта функциональность находится в разработке.</p>
          {/* TODO: Implement logic to show user's responses to tasks */}
        </CardContent>
      </Card>
    </div>
  );
}
