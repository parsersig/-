
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Briefcase, CalendarDays, Coins, Eye, MapPin, MessageSquare, UserCircle, Loader2, AlertCircle, Users, Check, X, ThumbsUp, ThumbsDown, User, PlayCircle } from "lucide-react";
import type { StoredTask, ResponseData, UserProfile, ChatData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, increment, Timestamp,
  collection, addDoc, serverTimestamp, query, where,
  orderBy, onSnapshot, getDocs, setDoc, // Added setDoc
  type QuerySnapshot, type QueryDocumentSnapshot, type FirestoreError, type Firestore
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { initiateChat } from "@/lib/chatUtils"; // Added import
import RespondModal from "@/components/tasks/RespondModal"; // Import RespondModal

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
  if (isNaN(d.getTime())) return 'Неверный формат даты';
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatStartedDate = (date: any): string => {
  if (!date) return "не указана";
  let d: Date;
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else {
    return 'неверный формат';
  }
  if (isNaN(d.getTime())) return 'Неверный формат даты';
  return d.toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
  const [isProcessingAction, setIsProcessingAction] = useState(false); 
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [isExecutor, setIsExecutor] = useState(false); 
  
  const [taskResponses, setTaskResponses] = useState<ResponseData[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false); // State for modal


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
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    }
  }, []); 

  useEffect(() => {
    if (taskId && db) {
      setIsLoading(true);
      const firestore = db as Firestore;
      const fetchTask = async () => {
        try {
          const taskRef = doc(firestore, "tasks", taskId);
          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const taskData = taskSnap.data() as StoredTask; // Assuming StoredTask has all needed fields
            const fetchedTask = {
              ...taskData,
              id: taskSnap.id,
              postedDate: formatDate(taskData.postedDate as Timestamp),
              firestorePostedDate: taskData.postedDate as Timestamp,
              startedAt: taskData.startedAt ? formatStartedDate(taskData.startedAt as Timestamp) : undefined,
              firestoreStartedAt: taskData.startedAt as Timestamp | undefined,
            } as StoredTask;
            setTask(fetchedTask);

            if (fetchedTask.userId) {
              setIsLoadingOwner(true);
              try {
                const ownerRef = doc(firestore, "userProfiles", fetchedTask.userId);
                const ownerSnap = await getDoc(ownerRef);
                if (ownerSnap.exists()) {
                  setTaskOwner(ownerSnap.data() as UserProfile);
                } else {
                  setTaskOwner(null);
                }
              } catch (ownerError) {
                console.error("Error fetching task owner profile:", ownerError);
                setTaskOwner(null);
              } finally {
                setIsLoadingOwner(false);
              }
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
  }, [taskId, incrementViewCount, toast]);

 useEffect(() => {
    if (!db || !task || !currentUser || task.userId !== currentUser.uid) {
      setTaskResponses([]); 
      setIsLoadingResponses(false);
      return;
    }
    
    setIsLoadingResponses(true);
    const firestore = db as Firestore;
    const responsesCollectionRef = collection(firestore, "responses");
    const responsesQuery = query(
      responsesCollectionRef,
      where("taskId", "==", task.id),
      orderBy("respondedAt", "desc")
    );

    const unsubscribeResponses = onSnapshot(responsesQuery, 
      (snapshot: QuerySnapshot) => {
        const responses: ResponseData[] = [];
        snapshot.forEach((docSnap: QueryDocumentSnapshot) => {
          const data = docSnap.data();
          responses.push({
            id: docSnap.id,
            ...data,
            respondedAt: formatResponseDate(data.respondedAt as Timestamp),
            firestoreRespondedAt: data.respondedAt as Timestamp,
          } as ResponseData);
        });
        setTaskResponses(responses);
        setIsLoadingResponses(false);
      }, 
      (error: FirestoreError) => {
        console.error("Error fetching task responses:", error);
        if (error.code === 'failed-precondition' && error.message.includes("index")) {
           toast({
            title: "Ошибка базы данных",
            description: `Для отображения откликов требуется создание индекса в Firestore. ${error.message}`,
            variant: "destructive",
            duration: 15000,
          });
        } else {
          toast({ title: "Ошибка откликов", description: `Не удалось загрузить отклики: ${error.message}`, variant: "destructive" });
        }
        setTaskResponses([]);
        setIsLoadingResponses(false);
      }
    );
    return () => unsubscribeResponses();
  }, [task, currentUser, toast]);

   useEffect(() => {
    if (!db || !task || !currentUser ) {
      setHasResponded(false);
      setIsExecutor(false);
      return;
    }
    
    if (task.executorId === currentUser.uid) {
      setIsExecutor(true);
      setHasResponded(true); 
      return; 
    } else {
      setIsExecutor(false);
    }
    
    if (task.userId === currentUser.uid) { // Автор не может откликаться и быть исполнителем через отклик
        setHasResponded(false);
        return;
    }

    const firestore = db as Firestore;
    const responsesRef = collection(firestore, "responses");
    const q = query(responsesRef, where("taskId", "==", task.id), where("responderId", "==", currentUser.uid));
    
    getDocs(q).then(querySnapshot => {
      setHasResponded(!querySnapshot.empty);
    }).catch(err => {
      console.error("Error checking response status", err);
      toast({title: "Ошибка проверки отклика", description: (err as Error).message, variant: "destructive"});
    });
  }, [task, currentUser, toast]);

  const handleSubmitResponse = async (message: string) => {
    if (!db || !task) {
      toast({ title: "Ошибка", description: "Данные задания или база данных недоступны.", variant: "destructive"});
      // setIsResponding(false); // Ensure loader stops if early exit
      return;
    }
    if (!currentUser) {
      toast({ title: "Требуется вход", description: "Пожалуйста, войдите, чтобы откликнуться.", variant: "destructive" });
      // setIsResponding(false);
      return;
    }
    if (task.userId === currentUser.uid) {
      toast({ title: "Это ваше задание", description: "Вы не можете откликнуться на собственное задание.", variant: "default" });
      // setIsResponding(false);
      return;
    }
    // This check is also present in button's disabled state, but good for robustness
    if (hasResponded && !isExecutor) { 
      toast({ title: "Вы уже откликались", description: "Вы уже отправляли отклик на это задание.", variant: "default" });
      // setIsResponding(false);
      return;
    }
     if (task.status !== 'open') {
      toast({ title: "Задание неактивно", description: "Это задание уже не принимает отклики.", variant: "default" });
      // setIsResponding(false);
      return;
    }

    setIsResponding(true); // Indicates submission is in progress
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
        message: message, // Include the message from the modal
        respondedAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, "responses"), responseData);
      toast({ 
        title: "Отлично!", 
        description: `Ваш отклик на задание «${task.title}» успешно отправлен!`, 
        duration: 7000 
      });
      setHasResponded(true);
      setIsRespondModalOpen(false); // Close modal on success
    } catch (error: any) {
      console.error("Failed to save response to Firestore", error);
      toast({ title: "Ошибка сохранения отклика", description: `Не удалось сохранить ваш отклик. ${error.message || "Пожалуйста, попробуйте еще раз."}`, variant: "destructive" });
      // Modal remains open for user to try again or cancel
    } finally {
      setIsResponding(false);
    }
  };

  const handleStartTask = async () => {
    if (!db || !task || !currentUser) {
      toast({ title: "Ошибка", description: "Необходимые данные отсутствуют.", variant: "destructive" });
      return;
    }
    if (task.status !== 'open' || task.userId === currentUser.uid || !hasResponded) {
      toast({ title: "Действие недоступно", description: "Невозможно приступить к выполнению этого задания.", variant: "default" });
      return;
    }

    setIsProcessingAction(true);
    try {
      const firestore = db as Firestore;
      const taskRef = doc(firestore, "tasks", task.id);
      await updateDoc(taskRef, {
        status: 'in_progress',
        executorId: currentUser.uid,
        startedAt: serverTimestamp(),
      });
      
      setTask(prev => prev ? ({ 
        ...prev, 
        status: 'in_progress', 
        executorId: currentUser.uid, 
        startedAt: formatStartedDate(new Date()) 
      }) : null);
      setIsExecutor(true); 

      toast({ title: "Работа начата!", description: `Вы приступили к выполнению задания «${task.title}».`, duration: 5000 });
    } catch (error: any) {
      console.error("Error starting task:", error);
      toast({ title: "Ошибка", description: `Не удалось начать выполнение задания: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleInitiateChat = async (otherUserId: string, otherUserName: string | null, otherUserPhotoURL: string | null) => {
    if (!db || !currentUser || !task) {
        toast({ title: "Ошибка", description: "Необходимые данные для начала чата отсутствуют.", variant: "destructive" });
        return;
    }
    setIsInitiatingChat(true);
    const firestore = db as Firestore;
    // Формируем уникальный ID для чата, сортируя ID участников
    const participantsArray = [currentUser.uid, otherUserId].sort();
    const generatedChatId = participantsArray.join('_'); // Простой способ генерации ID

    try {
        const chatRef = doc(firestore, "chats", generatedChatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            // Чат не существует, создаем новый
            const newChatData: Partial<ChatData> = { // Используем Partial, т.к. id будет у документа
                participants: participantsArray,
                participantNames: {
                    [currentUser.uid]: currentUser.displayName || "Текущий Пользователь",
                    [otherUserId]: otherUserName || "Другой Пользователь",
                },
                participantPhotoURLs: {
                    [currentUser.uid]: currentUser.photoURL || null,
                    [otherUserId]: otherUserPhotoURL || null,
                },
                taskId: task.id,
                taskTitle: task.title,
                lastMessageText: "",
                lastMessageAt: null, // Будет обновляться при первом сообщении
                createdAt: serverTimestamp() as Timestamp,
            };
            await setDoc(chatRef, newChatData);
            console.log("New chat created with ID:", generatedChatId);
        } else {
            console.log("Chat already exists with ID:", generatedChatId);
        }
        router.push(`/messages?chatId=${generatedChatId}`);
    } catch (error: any) {
        console.error("Error initiating chat:", error);
        toast({ title: "Ошибка чата", description: `Не удалось начать чат: ${error.message}`, variant: "destructive" });
    } finally {
        // This state update will be handled in the calling component after awaiting initiateChat
        // setIsInitiatingChat(false); 
    }
  };

  // This local handleInitiateChat function will be removed.
  // Calls will be made directly to the imported initiateChat utility.

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
                <Coins className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5" />
                {task.budget ? `до ${task.budget.toLocaleString()} ₽` : task.isNegotiable ? "Цена договорная" : "Бюджет не указан"}
              </div>
              {task.isNegotiable && task.budget && <p className="text-xs text-muted-foreground">(также возможен торг)</p>}
            </div>
          </div>
           {task.status === 'in_progress' && (
            <Badge variant="secondary" className="mt-3 bg-yellow-500/20 text-yellow-300 border-yellow-500/40">В процессе выполнения</Badge>
          )}
          {task.status === 'completed' && (
            <Badge variant="secondary" className="mt-3 bg-green-500/20 text-green-400 border-green-500/40">Выполнено</Badge>
          )}
           {task.status === 'cancelled' && (
            <Badge variant="destructive" className="mt-3">Отменено</Badge>
          )}
        </CardHeader>
        
        <CardContent className="py-5 sm:py-6 border-t px-4 sm:px-6">
          {task.userId && (
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Детали заказчика:</h3>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                {isLoadingOwner ? (
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                ) : taskOwner ? (
                  <>
                    <Link href={`/profile/${taskOwner.uid}`} className="flex items-center space-x-3 group mr-auto">
                      <Avatar className="h-10 w-10 group-hover:ring-2 group-hover:ring-accent/70 transition-all duration-150 ease-in-out">
                        <AvatarImage src={taskOwner.photoURL || undefined} alt={taskOwner.displayName || "Заказчик"} />
                        <AvatarFallback>{taskOwner.displayName ? taskOwner.displayName.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-accent transition-colors duration-150 ease-in-out">{taskOwner.displayName || "Заказчик"}</p>
                         <div className="flex items-center space-x-2 text-xs mt-0.5" title="Отзывы о заказчике (демо)">
                          <ThumbsUp className="h-3.5 w-3.5 text-green-500"/> <span className="text-green-400">15</span>
                          <ThumbsDown className="h-3.5 w-3.5 text-red-500"/> <span className="text-red-400">2</span>
                        </div>
                      </div>
                    </Link>
                    {!isOwner && currentUser && taskOwner && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              if (!currentUser || !taskOwner || !db) return;
                              setIsInitiatingChat(true);
                              await initiateChat({
                                currentUser,
                                otherUserId: taskOwner.uid,
                                otherUserName: taskOwner.displayName || null,
                                otherUserPhotoURL: taskOwner.photoURL || null,
                                firestore: db as Firestore,
                                router,
                                toast,
                                taskInfo: { taskId: task.id, taskTitle: task.title }
                              });
                              setIsInitiatingChat(false);
                            }}
                            disabled={isInitiatingChat}
                            className="text-xs flex-shrink-0" // Ensure button does not cause overflow
                        >
                            {isInitiatingChat ? <Loader2 className="h-4 w-4 animate-spin mr-1.5"/> : <MessageSquare className="h-4 w-4 mr-1.5"/>}
                            Написать автору
                        </Button>
                    )}
                  </>
                ) : (
                  <p>Информация о заказчике не найдена.</p>
                )}
              </div>
            </div>
          )}

          <div className="mb-6 border-t pt-5">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Описание задания:</h3>
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">{task.description}</p>
          </div>
          
          {task.status === 'in_progress' && task.executorId && (
            <div className="mb-6 border-t pt-5">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground/90">Исполнение:</h3>
              {isExecutor ? (
                <p className="text-green-400">Вы выполняете это задание. Начато: {task.startedAt || 'Недавно'}.</p>
              ) : (
                <p className="text-yellow-400">Задание выполняется другим исполнителем. Начато: {task.startedAt || 'Недавно'}.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 text-sm border-t pt-5">
            <div className="flex items-center"><MapPin className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Город:</span><span className="ml-1.5 text-muted-foreground">{task.city}</span></div></div>
            <div className="flex items-center"><CalendarDays className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Опубликовано:</span><span className="ml-1.5 text-muted-foreground">{task.postedDate}</span></div></div>
            <div className="flex items-center sm:col-span-2"><UserCircle className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Контакты:</span><span className="ml-1.5 text-muted-foreground">{task.contactInfo}</span></div></div>
            <div className="flex items-center"><Eye className="h-5 w-5 mr-2 sm:mr-3 text-accent/80 shrink-0" /><div><span className="text-foreground/90 font-medium">Просмотров:</span><span className="ml-1.5 text-muted-foreground">{task.views || 0}</span></div></div>
          </div>
        </CardContent>

        <CardFooter className="pt-5 sm:pt-6 px-4 sm:px-6 border-t flex flex-col sm:flex-row gap-3 items-center">
          {!isOwner && task.status === 'open' && !hasResponded && !task.executorId && currentUser && (
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale" 
              onClick={() => setIsRespondModalOpen(true)} 
              disabled={isResponding || hasResponded || task.status !== 'open'}
            >
              {hasResponded ? <Check className="mr-2 h-5 w-5 text-green-400" /> : <MessageSquare className="mr-2 h-5 w-5" />}
              {hasResponded ? "Вы уже откликнулись" : "Откликнуться на задание"}
            </Button>
          )}
           {!isOwner && task.status === 'open' && !currentUser && (
             <p className="text-sm text-muted-foreground"> <Link href="/" className="text-accent hover:underline">Войдите</Link>, чтобы откликнуться или написать автору.</p>
           )}

          {!isOwner && task.status === 'open' && hasResponded && !isExecutor && !task.executorId && currentUser && (
            <Button 
              size="lg" 
              variant="default"
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale" 
              onClick={handleStartTask}
              disabled={isProcessingAction}
            >
              {isProcessingAction ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
              Приступить к выполнению
            </Button>
          )}
           {!isOwner && task.status === 'open' && hasResponded && isExecutor && ( 
            <p className="text-sm text-green-400">Вы уже приступили к этому заданию (ожидает обновления статуса).</p>
          )}
          {!isOwner && task.status === 'in_progress' && isExecutor && (
            <p className="text-sm text-green-400">Вы выполняете это задание. Начато: {task.startedAt || 'Недавно'}.</p>
          )}
           {!isOwner && task.status === 'in_progress' && !isExecutor && task.executorId && (
            <p className="text-sm text-yellow-400">Задание уже выполняется другим исполнителем.</p>
          )}
          {!isOwner && (task.status === 'completed' || task.status === 'cancelled') && (
             <p className="text-sm text-muted-foreground">Задание завершено или отменено. Отклики больше не принимаются.</p>
          )}
           {!isOwner && hasResponded && task.status === 'open' && !isExecutor && task.executorId && ( 
            <p className="text-sm text-muted-foreground">Задание уже взято другим исполнителем.</p>
          )}
        </CardFooter>
      </Card>

      {task && (
        <RespondModal
          isOpen={isRespondModalOpen}
          onClose={() => setIsRespondModalOpen(false)}
          onSubmitResponse={handleSubmitResponse}
          taskTitle={task.title}
          isSubmitting={isResponding}
        />
      )}

      {isOwner && (
        <Card className="mt-6 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Users className="h-6 w-6 mr-3 text-accent" />Отклики на ваше задание ({taskResponses.length})</CardTitle>
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
                    <div className="flex items-start space-x-4">
                      {response.responderId ? (
                        <Link href={`/profile/${response.responderId}`} className="group flex-shrink-0">
                          <Avatar className="h-11 w-11 border group-hover:ring-2 group-hover:ring-accent/70 transition-all duration-150 ease-in-out">
                            <AvatarImage src={response.responderPhotoURL || undefined} alt={response.responderName || "User"} />
                            <AvatarFallback className="text-lg">
                                {response.responderName ? response.responderName.substring(0, 1).toUpperCase() : <UserCircle size={24}/>}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="h-11 w-11 border">
                          <AvatarImage src={response.responderPhotoURL || undefined} alt={response.responderName || "User"} />
                          <AvatarFallback className="text-lg">
                              {response.responderName ? response.responderName.substring(0, 1).toUpperCase() : <UserCircle size={24}/>}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0"> {/* Added min-w-0 for better truncation */}
                        {response.responderId ? (
                          <Link href={`/profile/${response.responderId}`} className="group">
                            <p className="font-semibold text-foreground group-hover:text-accent transition-colors duration-150 ease-in-out truncate" title={response.responderName || "Анонимный исполнитель"}>
                              {response.responderName || "Анонимный исполнитель"}
                            </p>
                          </Link>
                        ) : (
                          <p className="font-semibold text-foreground truncate" title={response.responderName || "Анонимный исполнитель"}>
                            {response.responderName || "Анонимный исполнитель"}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Откликнулся: {response.respondedAt}</p>
                        {response.message && (
                          <p className="text-sm mt-2 italic whitespace-pre-line break-words bg-background/50 p-3 rounded-md shadow-sm border border-border/50">
                            "{response.message}"
                          </p>
                        )}
                      </div>
                       {currentUser && response.responderId && (
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              if (!currentUser || !response.responderId || !db) return;
                              setIsInitiatingChat(true);
                              await initiateChat({
                                currentUser,
                                otherUserId: response.responderId,
                                otherUserName: response.responderName || null,
                                otherUserPhotoURL: response.responderPhotoURL || null,
                                firestore: db as Firestore,
                                router,
                                toast,
                                taskInfo: { taskId: task.id, taskTitle: task.title }
                              });
                              setIsInitiatingChat(false);
                            }}
                            disabled={isInitiatingChat}
                            className="ml-auto text-xs flex-shrink-0" // Added flex-shrink-0
                            title={`Написать ${response.responderName || 'исполнителю'}`}
                          >
                            {isInitiatingChat ? <Loader2 className="h-4 w-4 animate-spin"/> : <MessageSquare className="h-4 w-4"/>}
                            <span className="hidden sm:inline ml-1.5">Написать</span>
                          </Button>
                       )}
                    </div>
                    {/* В будущем здесь будут кнопки "Принять отклик" / "Отклонить отклик", если задание еще не в работе */}
                    {task.status === 'open' && !task.executorId && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-xs hover:border-red-500/50 hover:text-red-500" onClick={() => console.log("Отклонить (демо)", response.id)}>
                            <X className="h-4 w-4 mr-1.5" /> Отклонить (демо)
                          </Button>
                          <Button variant="default" size="sm" className="text-xs hover:bg-green-500/90" onClick={() => console.log("Принять (демо)", response.id)}>
                            <Check className="h-4 w-4 mr-1.5" /> Принять (демо)
                          </Button>
                        </div>
                    )}
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

