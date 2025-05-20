
// src/app/tasks/tasks-client-content.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, DollarSign, Eye, Search, ListChecks } from 'lucide-react';
import { taskCategories, type StoredTask } from '@/lib/schemas';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";

// Helper function to convert Firestore Timestamp to string or return existing string
const formatDate = (date: any): string => {
  if (!date) return 'Дата не указана';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('ru-RU');
  }
  if (typeof date === 'string') {
    // Попытка распарсить строку, если это ISO или другой формат
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('ru-RU');
    }
  }
  return 'Неверный формат даты';
};


export default function TasksClientContent() {
  const searchParams = useSearchParams();

  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Set initial category from URL query parameter if present
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && taskCategories.includes(categoryFromUrl as typeof taskCategories[number])) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Load tasks from Firestore on mount
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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasksFromFirestore.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          budget: data.budget,
          isNegotiable: data.isNegotiable,
          contactInfo: data.contactInfo,
          postedDate: formatDate(data.postedDate), // Convert Timestamp to string
          firestorePostedDate: data.postedDate, // Store original Timestamp for sorting if needed
          city: data.city,
          views: data.views,
          userId: data.userId,
        });
      });
      setAllTasks(tasksFromFirestore);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching tasks from Firestore: ", error);
      setIsLoading(false);
      // Optionally, show a toast or error message to the user
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Filter tasks when searchTerm or selectedCategory change
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

  // Debounce search term input
  const debouncedSetSearchTerm = (() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSearchTerm(value);
      }, 300); // 300ms delay
    };
  })();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <ListChecks className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-muted-foreground">Загрузка заданий из облака...</h1>
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
              <label htmlFor="search" className="text-xs sm:text-sm font-medium">Поиск по ключевым словам</label>
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
              <label htmlFor="category" className="text-xs sm:text-sm font-medium">Категория</label>
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
                    <Link href={`/tasks/${task.id}`} legacyBehavior>{task.title}</Link>
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
                <span>Опубликовано: {task.postedDate}</span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1 text-accent/70" /> {task.views || 0}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-12">
          <Briefcase className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
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

    