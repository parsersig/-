
// src/app/my-responses/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, LogIn, UserCircle, ListFilter, Briefcase, CalendarCheck2, ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase'; // Ensure db is imported
import type { User } from 'firebase/auth';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ResponseData } from "@/lib/schemas"; // Import ResponseData type
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

const formatDate = (date: any): string => {
  if (!date) return 'Дата не указана';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'Неверный формат даты';
};

export default function MyResponsesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userResponses, setUserResponses] = useState<ResponseData[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoadingAuth(false);
      setIsLoadingResponses(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      if (currentUser && db) {
        fetchUserResponses(currentUser.uid);
      } else {
        setUserResponses([]);
        setIsLoadingResponses(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserResponses = async (userId: string) => {
    if (!db) {
      console.error("Firestore (db) is not initialized. Cannot fetch responses.");
      setIsLoadingResponses(false);
      return;
    }
    setIsLoadingResponses(true);
    try {
      const responsesRef = collection(db, "responses");
      const q = query(responsesRef, where("responderId", "==", userId), orderBy("respondedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const responses: ResponseData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        responses.push({
          id: doc.id,
          ...data,
          respondedAt: formatDate(data.respondedAt),
          firestoreRespondedAt: data.respondedAt, // keep original timestamp if needed for sorting
        } as ResponseData);
      });
      setUserResponses(responses);
    } catch (error) {
      console.error("Error fetching user responses:", error);
      // Optionally, show a toast to the user
    } finally {
      setIsLoadingResponses(false);
    }
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

  if (isLoadingResponses) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent animate-spin" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка ваших откликов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center justify-center sm:justify-start">
            <FileText className="h-8 w-8 mr-3 text-accent" />
            Мои отклики
        </h1>
        <p className="mt-2 text-md text-muted-foreground">Здесь отображаются задания, на которые вы откликнулись.</p>
      </div>

      {userResponses.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {userResponses.map((response) => (
            <Card key={response.id} className="shadow-lg hover:shadow-accent/30 transition-shadow duration-300 hover-lift bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <Link href={`/tasks/${response.taskId}`} className="hover:text-accent transition-colors">
                  <CardTitle className="text-lg sm:text-xl">{response.taskTitle}</CardTitle>
                </Link>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground flex items-center pt-1">
                  <Briefcase className="h-4 w-4 mr-1.5 text-accent/80" /> Категория: {response.taskCategory}
                </CardDescription>
              </CardHeader>
              <CardFooter className="text-xs sm:text-sm text-muted-foreground border-t pt-3 pb-4 px-4 sm:px-6 flex justify-between items-center">
                <span className="flex items-center">
                  <CalendarCheck2 className="h-4 w-4 mr-1.5 text-accent/70" />
                  Отклик оставлен: {response.respondedAt}
                </span>
                <Button variant="outline" size="sm" asChild className="hover-scale text-xs px-3">
                  <Link href={`/tasks/${response.taskId}`}>
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    К заданию
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8 text-center">
           <ListFilter className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl sm:text-2xl font-semibold mb-2">У вас пока нет откликов</h3>
          <p className="text-muted-foreground mb-6">Найдите интересные задания и откликайтесь на них!</p>
          <Button size="lg" asChild className="hover-scale">
            <Link href="/tasks">Найти задания</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
