// src/app/tasks/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Eye, MapPin, MessageSquare, UserCircle, Loader2, AlertCircle } from "lucide-react";
import type { StoredTask, ResponseData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";

const formatDate = (date: any): string => {
  if (!date) return "Дата не указана";
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
    }
  }
  return "Неверный формат даты";
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = params.id as string;
  const [task, setTask] = useState<StoredTask | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }
  }, []);

  const incrementViewCount = useCallback(async (currentTaskId: string) => {
    if (!db) {
      console.warn("Firestore not initialized, cannot increment view count.");
      return;
    }
    const viewedTasksKey = `viewedTask_${currentTaskId}`;
    if (!sessionStorage.getItem(viewedTasksKey)) {
      try {
        const taskRef = doc(db, "tasks", currentTaskId);
        await updateDoc(taskRef, {
          views: increment(1),
        });
        sessionStorage.setItem(viewedTasksKey, "true");
        console.log("View count incremented for task:", currentTaskId);
        setTask((prev) => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    } else {
      console.log("Task already viewed in this session:", currentTaskId);
    }
  }, []);

  useEffect(() => {
    if (taskId && db) {
      setIsLoading(true);
      const fetchTask = async () => {
        try {
          console.log(`Fetching task with ID: ${taskId}`);
          const taskRef = doc(db!, "tasks", taskId);
          const taskSnap = await getDoc(taskRef);

          if (taskSnap.exists()) {
            const taskData = taskSnap.data();
            const fetchedTask = {
              id: taskSnap.id,
              ...taskData,
              postedDate: formatDate(taskData.postedDate),
            } as StoredTask;
            setTask(fetchedTask);
            await incrementViewCount(taskId);
          } else {
            console.log("No such document!");
            setTask(null);
          }
        } catch (error) {
          console.error("Error fetching task from Firestore:", error);
          setTask(null);
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить детали задания. Попробуйте позже.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchTask();
    } else if (!db) {
      console.warn("Firestore (db) is not initialized. Cannot fetch task.");
      setIsLoading(false);
      setTask(null);
      toast({
        title: "Ошибка конфигурации",
        description: "База данных не доступна. Проверьте настройки Firebase.",
        variant: "destructive",
      });
    }
  }, [taskId, incrementViewCount, toast]);

  useEffect(() => {
    if (currentUser && task && db) {
      const checkResponseStatus = async () => {
        const responsesRef = collection(db!, "responses");
        const q = query(responsesRef, where("taskId", "==", task.id), where("responderId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setHasResponded(!querySnapshot.empty);
      };
      checkResponseStatus();
    }
  }, [currentUser, task, db]);

  const handleRespond = async () => {
    if (!task || !db) return;
    if (!currentUser) {
      toast({
        title: "Требуется вход",
        description: "Пожалуйста, войдите в систему, чтобы откликнуться на задание.",
        variant: "destructive",
      });
      return;
    }

    if (task.userId === currentUser.uid) {
      toast({
        title: "Невозможно откликнуться",
        description: "Вы не можете откликнуться на собственное задание.",
        variant: "destructive",
      });
      return;
    }

    if (hasResponded) {
      toast({
        title: "Вы уже откликались",
        description: "Вы уже отправляли отклик на это задание.",
        variant: "default",
      });
      return;
    }

    setIsResponding(true);
    try {
      console.log("Attempting to save response to Firestore. Task:", task, "User:", currentUser);
      const responseData: Omit<ResponseData, "id" | "respondedAt" | "firestoreRespondedAt"> = {
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category,
        taskOwnerId: task.userId || "unknown_owner",
        responderId: currentUser.uid,
        responderName: currentUser.displayName || "Анонимный исполнитель",
        responderPhotoURL: currentUser.photoURL || null,
      };

      await addDoc(collection(db!, "responses"), {
        ...responseData,
        respondedAt: serverTimestamp(),
      });

      toast({
        title: "Отлично!",
        description: `Ваш отклик на задание "${task.title}" успешно отправлен и сохранен в базе данных!`,
        variant: "default",
        duration: 7000,
      });
      setHasResponded(true);
    } catch (error) {
      console.error("Failed to save response to Firestore", error);
      toast({
        title: "Ошибка сохранения отклика",
        description: `Не удалось сохранить ваш отклик. ${error instanceof Error ? error.message : "Пожалуйста, попробуйте еще раз."}`,
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent animate-spin" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка деталей задания...</p>
        </div>
      </div>
    );
  }

  if (task === null) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Задание не найдено</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">
          Возможно, задание было удалено или ссылка некорректна.
        </p>
        <Button asChild className="mt-6 hover-scale text-base sm:text-lg px-6 py-3">
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Вернуться ко всем заданиям
          </Link>
        </Button>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 sm:mb-6 hover-scale hover:border-accent hover:text-accent text-sm sm:text-base">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к списку заданий
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold leading-tight">{task.title}</CardTitle>
              <CardDescription className="text-sm sm:text-md text-muted-foreground pt-2 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-accent" />
                {task.category}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0 md:text-right shrink-0">
              <div className="flex items-center text-lg sm:text-xl font-semibold text-accent">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5" />
                {task.budget ? `${task.budget.toLocaleString()} ₽` : task.isNegotiable ? "Цена договорная" : "Бюджет не указан"}
              </div>
              {task.isNegotiable && task.budget && <p className="text-xs text-muted-foreground">(также возможен торг)</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 py-5 sm:py-6 border-t border-b px-4 sm:px-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Описание задания:</h3>
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 text-sm">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" />
              <div>
                <span className="text-foreground/90 font-medium">Город:</span>
                <span className="ml-1.5 text-muted-foreground">{task.city}</span>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" />
              <div>
                <span className="text-foreground/90 font-medium">Опубликовано:</span>
                <span className="ml-1.5 text-muted-foreground">{task.postedDate}</span>
              </div>
            </div>
            <div className="flex items-center sm:col-span-2">
              <UserCircle className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" />
              <div>
                <span className="text-foreground/90 font-medium">Контакты для связи:</span>
                <span className="ml-1.5 text-muted-foreground">{task.contactInfo}</span>
              </div>
            </div>
            <div className="flex items-center">
              <Eye className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" />
              <div>
                <span className="text-foreground/90 font-medium">Просмотров:</span>
                <span className="ml-1.5 text-muted-foreground">{task.views || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-5 sm:pt-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">Готовы взяться за это задание или есть вопросы?</p>
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale"
            onClick={handleRespond}
            disabled={!currentUser || isResponding || task.userId === currentUser?.uid || hasResponded}
          >
            {isResponding ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-5 w-5" />
            )}
            {currentUser
              ? task.userId === currentUser.uid
                ? "Это ваше задание"
                : hasResponded
                ? "Вы уже откликнулись"
                : isResponding
                ? "Отправка..."
                : "Откликнуться"
              : "Войдите, чтобы откликнуться"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}