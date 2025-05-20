
// src/app/my-tasks/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ListChecks, Briefcase, MapPin, DollarSign, Eye, LogIn, UserCircle } from "lucide-react";
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import type { StoredTask } from '@/lib/schemas';

const LOCAL_STORAGE_TASKS_KEY = 'irbit-freelance-tasks';

export default function MyTasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userTasks, setUserTasks] = useState<StoredTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoadingAuth(false);
        setIsLoadingTasks(false);
        return;
    }
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      if (currentUser) {
        loadUserTasks(currentUser.uid);
      } else {
        setUserTasks([]);
        setIsLoadingTasks(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserTasks = (userId: string) => {
    setIsLoadingTasks(true);
    try {
      const storedTasksRaw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasksRaw) {
        const allTasks: StoredTask[] = JSON.parse(storedTasksRaw);
        const filteredTasks = allTasks.filter(task => task.userId === userId);
        // Sort tasks by postedDate in descending order (newest first)
        filteredTasks.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        setUserTasks(filteredTasks);
      } else {
        setUserTasks([]);
      }
    } catch (e) {
      console.error("Failed to load tasks from localStorage", e);
      setUserTasks([]);
    }
    setIsLoadingTasks(false);
  };

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
              <CardTitle className="text-2xl sm:text-3xl font-bold">Войдите, чтобы видеть ваши задания</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Для доступа к этой странице необходимо войти в систему.</p>
            {/* Кнопка входа может быть добавлена здесь или пользователь воспользуется кнопкой в шапке */}
            <Button size="lg" asChild className="hover-scale">
                <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingTasks) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <ListChecks className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка ваших заданий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center justify-center sm:justify-start">
            <ListChecks className="h-8 w-8 mr-3 text-accent" />
            Мои опубликованные задания
        </h1>
        <p className="mt-2 text-md text-muted-foreground">Здесь отображаются задания, которые вы создали.</p>
      </div>

      {userTasks.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2">
          {userTasks.map((task) => (
            <Card key={task.id} className="flex flex-col shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg sm:text-xl hover:text-accent transition-colors">
                    <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground flex items-center pt-1">
                  <Briefcase className="h-4 w-4 mr-1.5 text-accent/80" /> {task.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow py-1 sm:py-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
                 <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-accent/70" /> {task.city}
                  </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-3 sm:pt-4 mt-auto">
                <div className="flex items-center mb-2 sm:mb-0">
                   <DollarSign className="h-5 w-5 text-accent mr-1.5" />
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {task.budget ? `${task.budget.toLocaleString()} ₽` : (task.isNegotiable ? 'Договорная' : 'Не указан')}
                  </span>
                </div>
                <Button asChild variant="default" size="sm" className="hover-scale w-full sm:w-auto text-sm px-4">
                  <Link href={`/tasks/${task.id}`}>Подробнее</Link>
                </Button>
              </CardFooter>
               <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs text-muted-foreground flex justify-between items-center">
                <span>Опубликовано: {new Date(task.postedDate).toLocaleDateString('ru-RU')}</span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1 text-accent/70"/> {task.views || 0}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8 text-center">
           <ListChecks className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl sm:text-2xl font-semibold mb-2">У вас пока нет опубликованных заданий</h3>
          <p className="text-muted-foreground mb-6">Создайте свое первое задание, чтобы найти исполнителей!</p>
          <Button size="lg" asChild className="hover-scale">
            <Link href="/create-task">Создать задание</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
