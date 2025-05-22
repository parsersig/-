
// src/app/tasks/tasks-client-content.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, Coins, Eye, Search, ListChecks, User, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'; // Добавлены User, ThumbsUp, ThumbsDown, MessageCircle, Coins
import { taskCategories, type StoredTask, type UserProfile } from '@/lib/schemas';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";

const formatDate = (date: any): string => {
  if (!date) return 'Дата не указана';
  let d: Date;
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else {
    return 'Неверный формат даты';
  }
  if (isNaN(d.getTime())) return 'Неверный формат даты';
  return d.toLocaleDateString('ru-RU');
};

export default function TasksClientContent() {
  const searchParams = useSearchParams();
  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [taskOwners, setTaskOwners] = useState<{ [userId: string]: UserProfile | null }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const taskOwnersRef = useRef(taskOwners);

  useEffect(() => {
    taskOwnersRef.current = taskOwners;
  }, [taskOwners]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && taskCategories.includes(categoryFromUrl as typeof taskCategories[number])) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const fetchOwnerDetails = useCallback(async (userId: string) => {
    if (!db || taskOwners[userId] !== undefined) return; // Не загружать, если уже есть или db нет
    try {
      const userRef = doc(db, "userProfiles", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setTaskOwners(prev => ({ ...prev, [userId]: userSnap.data() as UserProfile }));
      } else {
        setTaskOwners(prev => ({ ...prev, [userId]: null })); // Пользователь не найден
      }
    } catch (error) {
      console.error("Error fetching owner details for", userId, error);
      setTaskOwners(prev => ({ ...prev, [userId]: null })); // Ошибка загрузки
    }
  }, [taskOwners]); // Зависимость от taskOwners, чтобы избежать повторных запросов

  useEffect(() => {
    if (!db) {
      console.error("Firestore DB instance is not available.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const tasksCollectionRef = collection(db, "tasks");
    const q = query(tasksCollectionRef, orderBy("postedDate", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksFromFirestore: StoredTask[] = [];
      const ownerIdsToFetch = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const taskItem: StoredTask = {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          budget: data.budget,
          isNegotiable: data.isNegotiable,
          contactInfo: data.contactInfo,
          postedDate: formatDate(data.postedDate),
          firestorePostedDate: data.postedDate,
          city: data.city,
          views: data.views,
          userId: data.userId,
          status: data.status,
          // ownerDisplayName будет загружен отдельно
        };
        tasksFromFirestore.push(taskItem);
          if (data.userId && taskOwnersRef.current[data.userId] === undefined) {
          ownerIdsToFetch.add(data.userId);
        }
      });
      setAllTasks(tasksFromFirestore);
      setIsLoading(false);

      ownerIdsToFetch.forEach(userId => fetchOwnerDetails(userId));

    }, (error) => {
      console.error("Error fetching tasks from Firestore: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, fetchOwnerDetails]); // Добавили db и fetchOwnerDetails в зависимости

  const filteredTasks = useMemo(() => {
    let tasksToFilter = [...allTasks];
    if (searchTerm) {
      tasksToFilter = tasksToFilter.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      tasksToFilter = tasksToFilter.filter(task => task.category === selectedCategory);
    }
    return tasksToFilter;
  }, [searchTerm, selectedCategory, allTasks]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? undefined : value);
  };

  const debouncedSetSearchTerm = (() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSearchTerm(value);
      }, 300);
    };
  })();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <ListChecks className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-muted-foreground">Загрузка заданий...</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">
          Пожалуйста, подождите.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Актуальные задания в Ирбите</h1>
        <p className="mt-2 sm:mt-3 text-base sm:text-lg text-muted-foreground">
          Найдите подходящую работу или исполнителя для ваших задач.
        </p>
      </div>
      <Card className="shadow-lg bg-card/70 backdrop-blur-sm sticky top-16 sm:top-20 z-40">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 items-end">
            <div className="md:col-span-3 lg:col-span-2 space-y-1.5">
              <label htmlFor="search" className="text-xs sm:text-sm font-medium text-muted-foreground">Поиск по ключевым словам</label>
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Например, 'уборка' или 'ремонт компьютера'"
                  defaultValue={searchTerm}
                  onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs sm:text-sm font-medium text-muted-foreground">Категория</label>
              <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" className="h-10 sm:h-12 text-sm sm:text-base">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm sm:text-base">Все категории</SelectItem>
                  {taskCategories.map(category => (
                    <SelectItem key={category} value={category} className="text-sm sm:text-base">{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {filteredTasks.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
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
              <CardContent className="flex-grow py-1 sm:py-2 space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5 text-accent/70" /> {task.city}
                </div>
                {task.userId && (
                  <div className="text-xs sm:text-sm text-muted-foreground flex items-center pt-1">
                    <User className="h-4 w-4 mr-1.5 text-accent/70" />
                    {taskOwners[task.userId]?.displayName || taskOwners[task.userId] === null ? (taskOwners[task.userId]?.displayName || "Заказчик") : "Загрузка..."}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-3 sm:pt-4 mt-auto gap-2">
                <div className="flex items-center">
                  <Coins className="h-5 w-5 text-accent mr-1.5" /> {/* Изменено с DollarSign на Coins */}
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {task.budget ? `до ${task.budget.toLocaleString()} ₽` : (task.isNegotiable ? 'Договорная' : 'Не указан')}
                  </span>
                </div>
                <Button asChild variant="default" size="sm" className="hover-scale w-full sm:w-auto text-sm px-4">
                  <Link href={`/tasks/${task.id}`}>Подробнее</Link>
                </Button>
              </CardFooter>
              <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
                <span>Опубликовано: {task.postedDate}</span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1 text-accent/70" /> {task.views || 0}
                </span>
                <div className="flex items-center space-x-2 text-accent/90" title="Отзывы о заказчике (демо)">
                  <ThumbsUp className="h-3.5 w-3.5"/> <span className="text-xs">15</span>
                  <ThumbsDown className="h-3.5 w-3.5"/> <span className="text-xs">2</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-12">
          <MessageCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold">Задания не найдены</h3>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Попробуйте изменить критерии поиска или создайте новое задание.
          </p>
          <Button asChild className="mt-4 sm:mt-6 hover-scale text-sm sm:text-base px-5 py-2.5">
            <Link href="/create-task">Создать новое задание</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
