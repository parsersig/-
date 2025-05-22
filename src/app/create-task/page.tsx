// src/app/create-task/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { taskSchema, type TaskFormValues, taskCategories } from "@/lib/schemas";
import { FileText, DollarSign, ListChecks, UserCircle, Edit3, ExternalLink, LogIn } from 'lucide-react'; // Added LogIn
import { auth, db } from "@/lib/firebase";
import { useState, useEffect, useCallback } from "react"; // Added useCallback
import type { User, UserCredential } from "firebase/auth"; // Added UserCredential
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Added GoogleAuthProvider, signInWithPopup
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation'; // Added useRouter

export default function CreateTaskPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(user => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }
  }, []);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      budget: undefined,
      isNegotiable: false,
      contactInfo: "",
    },
  });

  const handleLogin = useCallback(async () => {
    if (!auth) {
      toast({ title: "Ошибка", description: "Сервис аутентификации недоступен.", variant: "destructive" });
      return;
    }
    try {
      const result: UserCredential = await signInWithPopup(auth, new GoogleAuthProvider());
      toast({ title: "Вход выполнен", description: "Вы успешно вошли в систему." });
      // Пользователь будет перенаправлен или состояние обновится, и форма станет доступной
      // Если это новый пользователь, можно перенаправить на /post-registration
      // @ts-ignore firebase-9-compat
      if (result.additionalUserInfo?.isNewUser || result._tokenResponse?.isNewUser) {
         router.push('/post-registration');
      }
    } catch (error: any) {
      console.error("Firebase login error on CreateTaskPage:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Не удалось войти через Google. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  }, [toast, router]);

  async function onSubmit(data: TaskFormValues) {
    setIsSubmitting(true);
    if (!auth || !currentUser) {
      toast({
        title: "Требуется вход",
        description: "Пожалуйста, войдите в систему, чтобы опубликовать задание.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!db) {
        toast({
            title: "Ошибка конфигурации",
            description: "База данных Firestore не инициализирована. Проверьте настройки Firebase.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }

    try {
      if (currentUser && currentUser.uid) {
        console.log("Saving task with userId:", currentUser.uid);
      } else {
        console.error("currentUser.uid is undefined or null, cannot save task");
        toast({
          title: "Ошибка пользователя",
          description: "Не удалось определить ID пользователя. Попробуйте войти заново.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const docRef = await addDoc(collection(db, "tasks"), {
        ...data,
        userId: currentUser.uid,
        postedDate: serverTimestamp(),
        city: "Ирбит", 
        views: 0,
        status: 'open', // Default status
      });
      console.log("Task saved to Firestore with ID:", docRef.id);

      if (db) { // Check if db is available for notifications
        try {
          await addDoc(collection(db, "notifications"), {
            taskId: docRef.id,
            taskTitle: data.title,
            message: `Новое задание опубликовано: &quot;${data.title}&quot;`,
            createdAt: serverTimestamp(),
            read: false, 
            type: "new_task", 
          });
          console.log("Notification entry created for new task ID:", docRef.id);
        } catch (notifError) {
          console.error("Failed to create notification entry:", notifError);
        }
      }

      toast({
        title: "Задание успешно опубликовано в облаке!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Ваше задание «{data.title}» сохранено и теперь доступно для просмотра всеми пользователями.</p>
            {currentUser && <p className="text-xs text-muted-foreground">Оно будет видно в разделе &quot;Мои задания&quot;.</p>}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks/${docRef.id}`} className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Посмотреть задание
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/tasks">Все задания</Link>
              </Button>
            </div>
          </div>
        ),
        duration: 8000,
      });
      form.reset();
    } catch (error) {
      console.error("Failed to save task to Firestore", error);
      toast({
        title: "Ошибка сохранения в Firestore",
        description: `Не удалось сохранить задание в облачной базе данных. ${error instanceof Error ? error.message : 'Пожалуйста, попробуйте еще раз.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Создать новое задание</CardTitle>
              <CardDescription className="text-sm sm:text-md text-muted-foreground pt-1">
                Опишите вашу задачу, и найдутся исполнители в Ирбите!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 sm:pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md sm:text-lg flex items-center"><FileText className="h-5 w-5 mr-2 text-accent/80" />Название задания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, &apos;Нужен ремонт стиральной машины&apos;" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Кратко и понятно опишите суть задачи.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md sm:text-lg">Подробное описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите все детали: что нужно сделать, какие материалы использовать, сроки, особые требования и т.д."
                        className="min-h-[120px] sm:min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Чем подробнее описание, тем быстрее найдется подходящий исполнитель.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md sm:text-lg flex items-center"><ListChecks className="h-5 w-5 mr-2 text-accent/80" />Категория задания</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskCategories.map((category) => (
                          <SelectItem key={category} value={category} className="text-base">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 sm:gap-y-8 items-start">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md sm:text-lg flex items-center"><DollarSign className="h-5 w-5 mr-2 text-accent/80" />Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Например, 1500" {...field}
                          className="h-12 text-base"
                          disabled={form.watch("isNegotiable")}
                          onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">Укажите примерный бюджет или оставьте пустым, если цена договорная.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isNegotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4 shadow-sm bg-muted/30 mt-6 md:mt-10">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("budget", undefined, { shouldValidate: true });
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm sm:text-base">
                          Цена договорная
                        </FormLabel>
                        <FormDescription className="text-xs sm:text-sm">
                          Если бюджет будет обсуждаться с исполнителем.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md sm:text-lg flex items-center"><UserCircle className="h-5 w-5 mr-2 text-accent/80" />Контактная информация</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваш телефон, Telegram или другой способ связи" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Как исполнители смогут с вами связаться. {currentUser && `(Можно использовать email: ${currentUser.email})`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Условное отображение кнопки отправки или сообщения о необходимости входа */}
              {!currentUser ? (
                <div className="text-center space-y-3 pt-4">
                  <p className="text-sm text-destructive">Для публикации задания необходимо войти в систему.</p>
                  <Button type="button" onClick={handleLogin} className="w-full md:w-auto min-w-[180px] sm:min-w-[200px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale">
                    <LogIn className="mr-2 h-5 w-5" /> Войти / Зарегистрироваться
                  </Button>
                </div>
              ) : (
                <Button type="submit" size="lg" className="w-full md:w-auto min-w-[180px] sm:min-w-[200px] text-md sm:text-lg h-12 sm:h-14 mt-6 sm:mt-8 shadow-lg hover-scale" disabled={isSubmitting}>
                  {isSubmitting ? "Публикация..." : "Опубликовать задание"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
