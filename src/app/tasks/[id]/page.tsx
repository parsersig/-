
// src/app/tasks/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Eye, MapPin, MessageSquare, UserCircle, Loader2, AlertCircle, Users } from "lucide-react";
import type { StoredTask, ResponseData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import type { User } from "firebase/auth";

const formatDate = (date: any): string => {
  if (!date) return "Дата не указана";
  // Проверяем, является ли date объектом Timestamp из Firebase
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  }
  // Если это уже строка (например, из localStorage или после предыдущего форматирования)
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
    }
  }
  // Если это число (мс с эпохи)
  if (typeof date === 'number') {
    return new Date(date).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  }
  return "Неверный формат даты";
};

const formatResponseDate = (date: any): string => {
  if (!date) return 'неизвестно';
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'неверный формат';
};


export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = params.id as string;
  const [task, setTask] = useState<StoredTask | null | undefined>(undefined); // undefined - загрузка, null - не найдено
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  const [taskResponses, setTaskResponses] = useState<ResponseData[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

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
        // Обновляем состояние локально, чтобы не перезапрашивать все задание
        setTask((prev) => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    }
  }, []);

  // Fetch task details
  useEffect(() => {
    if (taskId && db) {
      setIsLoading(true);
      const fetchTask = async () => {
        try {
          const taskRef = doc(db, "tasks", taskId);
          const taskSnap = await getDoc(taskRef);

          if (taskSnap.exists()) {
            const taskData = taskSnap.data() as Omit<StoredTask, 'id' | 'postedDate'> & { postedDate: Timestamp };
            const fetchedTask = {
              id: taskSnap.id,
              ...taskData,
              postedDate: formatDate(taskData.postedDate),
            } as StoredTask;
            setTask(fetchedTask);
            await incrementViewCount(taskId);
          } else {
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
    }
  }, [taskId, incrementViewCount, toast]);

  // Fetch responses if current user is the task owner OR check if current user has responded
  useEffect(() => {
    if (!task || !db || !currentUser) { // Добавил !currentUser, чтобы не запускать без пользователя
        if (task === null) setIsLoadingResponses(false); // Если задание не найдено, отклики тоже не грузим
        return;
    }

    // Check if current user has already responded to this task
    const checkResponseStatus = async () => {
      const responsesRef = collection(db, "responses");
      const q = query(responsesRef, where("taskId", "==", task.id), where("responderId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      setHasResponded(!querySnapshot.empty);
    };
    checkResponseStatus();


    // If current user is the task owner, fetch all responses for this task
    if (task.userId === currentUser.uid) {
      setIsLoadingResponses(true);
      const responsesQuery = query(
        collection(db, "responses"),
        where("taskId", "==", task.id),
        orderBy("respondedAt", "desc")
      );
      const unsubscribeResponses = onSnapshot(responsesQuery, (snapshot) => {
        const responses: ResponseData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          responses.push({
            id: docSnap.id,
            ...data,
            respondedAt: formatResponseDate(data.respondedAt),
            firestoreRespondedAt: data.respondedAt,
          } as ResponseData);
        });
        setTaskResponses(responses);
        setIsLoadingResponses(false);
      }, (error) => {
        console.error("Error fetching task responses:", error);
        toast({ title: "Ошибка", description: "Не удалось загрузить отклики на задание.", variant: "destructive" });
        setIsLoadingResponses(false);
      });
      return () => unsubscribeResponses();
    } else {
        // If not owner, no need to load all responses, just ensure loading state is false
        setIsLoadingResponses(false);
    }
  }, [task, currentUser, db, toast]);


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
        variant: "destructive", // или "default"
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
      const responseData = {
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category, // Добавлено
        taskOwnerId: task.userId || "unknown_owner", // Добавлено
        responderId: currentUser.uid,
        responderName: currentUser.displayName || "Анонимный исполнитель",
        responderPhotoURL: currentUser.photoURL || null,
        respondedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "responses"), responseData);

      toast({
        title: "Отлично!",
        description: `Ваш отклик на задание "${task.title}" успешно отправлен и сохранен в базе данных!`,
        variant: "default",
        duration: 7000,
      });
      setHasResponded(true); // Устанавливаем, что пользователь откликнулся
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

  if (!task) { // Дополнительная проверка на случай, если task еще undefined
    return null; // или другой индикатор загрузки/ошибки
  }
  
  const isOwner = currentUser?.uid === task.userId;

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
        {!isOwner && (
          <CardFooter className="pt-5 sm:pt-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">Готовы взяться за это задание или есть вопросы?</p>
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale"
              onClick={handleRespond}
              disabled={!currentUser || isResponding || hasResponded}
            >
              {isResponding ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-5 w-5" />
              )}
              {currentUser
                ? hasResponded
                  ? "Вы уже откликнулись"
                  : isResponding
                  ? "Отправка..."
                  : "Откликнуться"
                : "Войдите, чтобы откликнуться"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {isOwner && (
        <Card className="mt-6 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Users className="h-6 w-6 mr-3 text-accent" />
              Отклики на ваше задание
            </CardTitle>
            <CardDescription>Список исполнителей, которые откликнулись.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingResponses && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 text-accent animate-spin mr-2" />
                <p className="text-muted-foreground">Загрузка откликов...</p>
              </div>
            )}
            {!isLoadingResponses && taskResponses.length === 0 && (
              <p className="text-muted-foreground py-4 text-center">На это задание пока нет откликов.</p>
            )}
            {!isLoadingResponses && taskResponses.length > 0 && (
              <ul className="space-y-4">
                {taskResponses.map((response) => (
                  <li key={response.id} className="p-4 border rounded-lg bg-muted/30 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={response.responderPhotoURL || undefined} alt={response.responderName || "User"} data-ai-hint="user avatar" />
                        <AvatarFallback>
                          {response.responderName ? response.responderName.substring(0, 1).toUpperCase() : <UserCircle />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{response.responderName || "Анонимный исполнитель"}</p>
                        <p className="text-xs text-muted-foreground">Откликнулся: {response.respondedAt}</p>
                      </div>
                    </div>
                    {/* TODO: Можно добавить кнопку "Связаться" или "Принять отклик" */}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

