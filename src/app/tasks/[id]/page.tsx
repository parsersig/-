// src/app/tasks/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Eye, MapPin, MessageSquare, UserCircle } from 'lucide-react';
import type { StoredTask } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_TASKS_KEY = 'irbit-freelance-tasks';

// Placeholder tasks (должны быть идентичны тем, что в /tasks/page.tsx для консистентности)
const placeholderTasks: StoredTask[] = [
  {
    id: 'placeholder-1',
    title: 'Починить протекающий кран на кухне',
    description: 'Нужен сантехник для срочного ремонта кухонного смесителя. Капает вода, нужно заменить прокладки или картридж. Желательно сегодня или завтра утром. Инструменты ваши.',
    category: 'Ремонт и строительство',
    budget: 1500,
    isNegotiable: false,
    contactInfo: 'Телефон: 8-XXX-XXX-XX-XX',
    postedDate: '2024-07-28',
    city: 'Ирбит',
    views: 15,
  },
  {
    id: 'placeholder-2',
    title: 'Генеральная уборка двухкомнатной квартиры',
    description: 'Требуется полная уборка квартиры (50 кв.м) после выезда жильцов. Мытье окон, полов, санузла, кухни. Чистящие средства ваши или по договоренности.',
    category: 'Уборка и помощь по хозяйству',
    budget: 3000,
    isNegotiable: false,
    contactInfo: 'Telegram: @username',
    postedDate: '2024-07-27',
    city: 'Ирбит',
    views: 32,
  },
  {
    id: 'placeholder-3',
    title: 'Доставить документы из центра в Зайково',
    description: 'Срочно нужно передать пакет документов (небольшой конверт) из офиса на ул. Ленина в п. Зайково. Оплата сразу. Вес до 1 кг.',
    category: 'Курьерские услуги',
    budget: 500,
    isNegotiable: false,
    contactInfo: 'Звонить по номеру...',
    postedDate: '2024-07-28',
    city: 'Ирбит',
    views: 8,
  },
  {
    id: 'placeholder-4',
    title: 'Помощь в настройке Wi-Fi роутера',
    description: 'Купил новый роутер TP-Link, не могу подключить интернет и настроить Wi-Fi. Нужна помощь специалиста на дому. Район мотозавода.',
    category: 'Компьютерная помощь',
    budget: undefined,
    isNegotiable: true,
    contactInfo: 'Писать в ЛС',
    postedDate: '2024-07-26',
    city: 'Ирбит',
    views: 22,
  },
];


export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = params.id as string;
  const [task, setTask] = useState<StoredTask | null | undefined>(undefined); // undefined - loading, null - not found

  useEffect(() => {
    if (taskId) {
      let allTasks: StoredTask[] = [...placeholderTasks];
      const storedTasksRaw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasksRaw) {
        try {
          const userTasks: StoredTask[] = JSON.parse(storedTasksRaw);
          // Combine and remove duplicates, giving preference to user tasks if IDs match
          const taskMap = new Map<string, StoredTask>();
          placeholderTasks.forEach(pt => taskMap.set(pt.id, pt));
          userTasks.forEach(ut => taskMap.set(ut.id, ut)); // User tasks overwrite placeholders
          allTasks = Array.from(taskMap.values());
        } catch (e) {
          console.error("Failed to parse tasks from localStorage", e);
        }
      }
      
      // Sort tasks by postedDate in descending order (newest first)
      allTasks.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      
      const foundTask = allTasks.find(t => t.id === taskId);
      
      if (foundTask) {
        const updatedViews = (foundTask.views || 0) + 1;
        const updatedTask = { ...foundTask, views: updatedViews };
        setTask(updatedTask);

        if (storedTasksRaw) {
            try {
                const userTasks: StoredTask[] = JSON.parse(storedTasksRaw);
                const taskIndex = userTasks.findIndex(ut => ut.id === taskId);
                if (taskIndex > -1) {
                    userTasks[taskIndex].views = updatedViews;
                    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(userTasks));
                }
            } catch(e) {
                console.error("Error updating views in localStorage", e);
            }
        }
      } else {
        setTask(null); 
      }
    }
  }, [taskId]);

  const handleRespond = () => {
    toast({
      title: "Отклик отправлен (демо)",
      description: "Ваш отклик на задание успешно зарегистрирован (это демонстрационное сообщение).",
      variant: "default",
    });
  };

  if (task === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Briefcase className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка деталей задания...</p>
        </div>
      </div>
    );
  }

  if (task === null) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center p-4">
        <Briefcase className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-4" />
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
                <Briefcase className="h-5 w-5 mr-2 text-accent" /> {task.category}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0 md:text-right shrink-0">
                <div className="flex items-center text-lg sm:text-xl font-semibold text-accent">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5" />
                  {task.budget ? `${task.budget.toLocaleString()} ₽` : (task.isNegotiable ? 'Цена договорная' : 'Бюджет не указан')}
                </div>
                {task.isNegotiable && task.budget && (
                   <p className="text-xs text-muted-foreground">(также возможен торг)</p>
                )}
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
                <span className="ml-1.5 text-muted-foreground">{new Date(task.postedDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
              <span className="ml-1.5 text-muted-foreground">{task.views}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-5 sm:pt-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
           <p className="text-sm text-muted-foreground text-center sm:text-left">Готовы взяться за это задание или есть вопросы?</p>
          <Button size="lg" className="w-full sm:w-auto min-w-[200px] sm:min-w-[250px] text-md sm:text-lg h-12 sm:h-14 shadow-lg hover-scale" onClick={handleRespond}>
            <MessageSquare className="mr-2 h-5 w-5" />
            Откликнуться
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
