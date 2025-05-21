/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Briefcase, CalendarDays, Coins, Eye, MapPin, MessageSquare, UserCircle, Loader2, AlertCircle, Users, Check, X, ThumbsUp, ThumbsDown, User } from "lucide-react"; // Добавлены Coins, ThumbsUp, ThumbsDown, User
import type { StoredTask, ResponseData, UserProfile } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { 
  doc, getDoc, updateDoc, increment, Timestamp, 
  collection, addDoc, serverTimestamp, query, where, 
  orderBy, onSnapshot, getDocs, // <--- getDocs добавлен сюда
  type QuerySnapshot, type QueryDocumentSnapshot, type FirestoreError, type Firestore 
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";


const formatDate = (date: any): string => {
  if (!date) return "Дата не указана";
  let d: Date;
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else {
    return 'Неверный формат даты';
  }
  if (isNaN(d.getTime())) return 'Неверный формат даты';
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
};

const formatResponseDate = (date: any): string => {
  if (!date) return 'неизвестно';
  let d: Date;
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else {
    return 'неверный формат';
  }
  if (isNaN(d.getTime())) return 'неверный формат';
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<StoredTask | null | undefined>(undefined);
  const [taskOwner, setTaskOwner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  
  const [isResponding, setIsResponding] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
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
    const firestore = db as Firestore;
    const viewedTasksKey = `viewedTask_${currentTaskId}`;
    if (!sessionStorage.getItem(viewedTasksKey)) {
      try {
        const taskRef = doc(firestore, "tasks", currentTaskId);
        await updateDoc(taskRef, {
          views: increment(1),
        });
        sessionStorage.setItem(viewedTasksKey, "true");
        setTask((prev) => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
        console.log("View count incremented for task:", currentTaskId);
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    }
  }, [db]);

  useEffect(() => {
    if (taskId && db) {
      setIsLoading(true);
      const firestore = db as Firestore;
      const fetchTask = async () => {
        try {
          const taskRef = doc(firestore, "tasks", taskId);
          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const taskData = taskSnap.data() as StoredTask; // Omit<StoredTask, 'id' | 'postedDate'> & { postedDate: Timestamp };
            const fetchedTask = {
              ...taskData,
              id: taskSnap.id,
              postedDate: formatDate(taskData.postedDate), // Используем уже существующее поле, если оно Timestamp
              firestorePostedDate: taskData.postedDate as Timestamp // Сохраняем оригинал
            } as StoredTask;
            setTask(fetchedTask);

            if (fetchedTask.userId) {
              setIsLoadingOwner(true);
              const ownerRef = doc(firestore, "userProfiles", fetchedTask.userId);
              const ownerSnap = await getDoc(ownerRef);
              if (ownerSnap.exists()) {
                setTaskOwner(ownerSnap.data() as UserProfile);
              } else {
                setTaskOwner(null);
              }
              setIsLoadingOwner(false);
            }

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
  }, [taskId, db, incrementViewCount, toast]);

 useEffect(() => {
    if (!currentUser || !task || task.userId !== currentUser.uid || !db) {
      if (task && currentUser && task.userId !== currentUser.uid) { 
        setIsLoadingResponses(false);
        setTaskResponses([]);
      }
      if(!db && currentUser && task) console.error("DB not available for fetching responses");
      return;
    }
    
    setIsLoadingResponses(true);
    const firestore = db as Firestore;
    const responsesCollectionRef = collection(firestore, "responses");
    const q = query(
      responsesCollectionRef,
      where("taskId", "==", task.id),
      orderBy("respondedAt", "desc")
    );

    const unsubscribeResponses = onSnapshot(q, 
      (snapshot: QuerySnapshot) => {
        const responses: ResponseData[] = [];
        snapshot.forEach((docSnap: QueryDocumentSnapshot) => {
          const data = docSnap.data();
          responses.push({
            id: docSnap.id,
            ...data,
            respondedAt: formatResponseDate(data.respondedAt),
            firestoreRespondedAt: data.respondedAt as Timestamp,
          } as ResponseData);
        });
        setTaskResponses(responses);
        setIsLoadingResponses(false);
      }, 
      (error: FirestoreError) => {
        console.error("Error fetching task responses:", error.message, error.code, error.name, error.stack);
        if (error.message.includes("index")) {
           toast({
            title: "Ошибка базы данных",
            description: `Для отображения откликов требуется конфигурация индекса в Firestore. Ссылка для создания индекса: ${error.message.substring(error.message.indexOf('https://'))}`,
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({ title: "Ошибка", description: `Не удалось загрузить отклики на задание: ${error.message}`, variant: "destructive" });
        }
        setIsLoadingResponses(false);
      }
    );
    return () => unsubscribeResponses();
  }, [task, currentUser, db, toast]);

   useEffect(() => {
    if (task && currentUser && db && task.userId !== currentUser.uid) {
      const firestore = db as Firestore;
      const responsesRef = collection(firestore, "responses");
      const q = query(responsesRef, where("taskId", "==", task.id), where("responderId", "==", currentUser.uid));
      getDocs(q).then(querySnapshot => {
        setHasResponded(!querySnapshot.empty);
      }).catch(err => {
        console.error("Error checking response status", err);
        toast({title: "Ошибка проверки отклика", description: err.message, variant: "destructive"});
      });
    } else {
      setHasResponded(false); 
    }
  }, [task, currentUser, db, toast]);


  const handleRespond = async () => {
    if (!db || !task) {
      toast({ title: "Ошибка", description: "Данные задания или база данных недоступны.", variant: "destructive"});
      return;
    }
    if (!currentUser) {
      toast({ title: "Требуется вход", description: "Пожалуйста, войдите, чтобы откликнуться.", variant: "destructive" });
      return;
    }
    if (task.userId === currentUser.uid) {
      toast({ title: "Это ваше задание", description: "Вы не можете откликнуться на собственное задание.", variant: "default" });
      return;
    }
    if (hasResponded) {
      toast({ title: "Вы уже откликались", description: "Вы уже отправляли отклик на это задание.", variant: "default" });
      return;
    }
    setIsResponding(true);
    try {
      const firestore = db as Firestore;
      const responseData = {
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category,
        taskOwnerId: task.userId || "unknown_owner",
        responderId: currentUser.uid,
        responderName: currentUser.displayName || "Анонимный исполнитель",
        responderPhotoURL: currentUser.photoURL || null,
        respondedAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, "responses"), responseData);
      toast({ 
        title: "Отлично!", 
        description: `Ваш отклик на задание «${task.title}» успешно отправлен и сохранен в базе данных!`, 
        duration: 7000 
      });
      setHasResponded(true);
    } catch (error: any) {
      console.error("Failed to save response to Firestore", error);
      toast({ title: "Ошибка сохранения отклика", description: `Не удалось сохранить ваш отклик. ${error.message || "Пожалуйста, попробуйте еще раз."}`, variant: "destructive" });
    } finally {
      setIsResponding(false);
    }
  };

  const handleResponseAction = (responseId: string, action: "accepted" | "rejected") => {
    toast({
      title: `Отклик ${action === "accepted" ? "принят" : "отклонен"} (демо)`,
      description: `Отклик (ID: ${responseId}) был помечен как ${action === "accepted" ? "принятый" : "отклоненный"}. (Реальная логика будет добавлена позже)`,
    });
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
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">Возможно, задание было удалено или ссылка некорректна.</p>
        <Button asChild className="mt-6 hover-scale text-base sm:text-lg px-6 py-3">
          <Link href="/tasks"><ArrowLeft className="mr-2 h-5 w-5" />Вернуться ко всем заданиям</Link>
        </Button>
      </div>
    );
  }
  if (!task) return null;
  
  const isOwner = currentUser?.uid === task.userId;

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0 pb-10">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 sm:mb-6 hover-scale hover:border-accent hover:text-accent text-sm sm:text-base">
        <ArrowLeft className="mr-2 h-4 w-4" />Назад к списку
      </Button>
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 md:gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold leading-tight">{task.title}</CardTitle>
              <CardDescription className="text-sm sm:text-md text-muted-foreground pt-2 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-accent" />{task.category}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0 md:text-right shrink-0">
              <div className="flex items-center text-lg sm:text-xl font-semibold text-accent">
                <Coins className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5" /> {/* Изменено */}
                {task.budget ? `до ${task.budget.toLocaleString()} ₽` : task.isNegotiable ? "Цена договорная" : "Бюджет не указан"}
              </div>
              {task.isNegotiable && task.budget && <p className="text-xs text-muted-foreground">(также возможен торг)</p>}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-5 sm:py-6 border-t px-4 sm:px-6">
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Детали заказчика:</h3>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              {isLoadingOwner ? (
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              ) : taskOwner ? (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={taskOwner.photoURL || undefined} alt={taskOwner.displayName || "Заказчик"} />
                    <AvatarFallback>{taskOwner.displayName ? taskOwner.displayName.charAt(0).toUpperCase() : <UserCircle />}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{taskOwner.displayName || "Заказчик"}</p>
                    <div className="flex items-center space-x-1 text-xs mt-0.5" title="Отзывы о заказчике (демо)">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500"/> <span>15</span>
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500"/> <span>2</span>
                    </div>
                  </div>
                </>
              ) : (
                <p>Информация о заказчике не найдена.</p>
              )}
            </div>
          </div>

          <div className="mb-6 border-t pt-5">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Описание задания:</h3>
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 text-sm border-t pt-5">
            <div className="flex items-center"><MapPin className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Город:</span><span className="ml-1.5 text-muted-foreground">{task.city}</span></div></div>
            <div className="flex items-center"><CalendarDays className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Опубликовано:</span><span className="ml-1.5 text-muted-foreground">{task.postedDate}</span></div></div>
            <div className="flex items-center sm:col-span-2"><UserCircle className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Контакты:</span><span className="ml-1.5 text-muted-foreground">{task.contactInfo}</span></div></div>
            <div className="flex items-center"><Eye className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Просмотров:</span><span className="ml-1.5 text-muted-foreground">{task.views || 0}</span></div></div>
          </div>
        </CardContent>

        {!isOwner && (
          <CardFooter className="pt-5 sm:pt-6 px-4 sm:px-6 border-t">
            <Button size="lg" className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale" onClick={handleRespond} disabled={!currentUser || isResponding || hasResponded}>
              {isResponding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageSquare className="mr-2 h-5 w-5" />}
              {currentUser ? (hasResponded ? "Вы уже откликнулись" : (isResponding ? "Отправка..." : "Откликнуться на задание")) : "Войдите, чтобы откликнуться"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {isOwner && (
        <Card className="mt-6 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Users className="h-6 w-6 mr-3 text-accent" />Отклики на ваше задание</CardTitle>
            <CardDescription>Список исполнителей, которые откликнулись.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingResponses && (
              <div className="flex justify-center items-center py-6"><Loader2 className="h-8 w-8 text-accent animate-spin mr-2" /><p className="text-muted-foreground">Загрузка откликов...</p></div>
            )}
            {!isLoadingResponses && taskResponses.length === 0 && (
              <p className="text-muted-foreground py-4 text-center">На это задание пока нет откликов.</p>
            )}
            {!isLoadingResponses && taskResponses.length > 0 && (
              <ul className="space-y-4">
                {taskResponses.map((response) => (
                  <li key={response.id} className="p-4 border rounded-lg bg-muted/30 shadow-sm hover-lift-sm transition-all">
                    <div className="flex items-start space-x-4 mb-3">
                      <Avatar className="h-11 w-11 border">
                        <AvatarImage src={response.responderPhotoURL || undefined} alt={response.responderName || "User"} data-ai-hint="user avatar small" />
                        <AvatarFallback className="text-lg">
                            {response.responderName ? response.responderName.substring(0, 1).toUpperCase() : <UserCircle size={24}/>}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{response.responderName || "Анонимный исполнитель"}</p>
                        <p className="text-xs text-muted-foreground">Откликнулся: {response.respondedAt}</p>
                        {/* Можно добавить еще детали из response.message или другие поля */}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" className="text-xs hover:border-red-500/50 hover:text-red-500" onClick={() => handleResponseAction(response.id, "rejected")}>
                        <X className="h-4 w-4 mr-1.5" /> Отклонить (демо)
                      </Button>
                      <Button variant="default" size="sm" className="text-xs hover:bg-green-500/90" onClick={() => handleResponseAction(response.id, "accepted")}>
                        <Check className="h-4 w-4 mr-1.5" /> Принять (демо)
                      </Button>
                    </div>
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