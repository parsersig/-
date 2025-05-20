// src/app/tasks/tasks-client-content.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, DollarSign, Eye, Search } from 'lucide-react';
import { taskCategories, type StoredTask } from '@/lib/schemas';
import { useSearchParams, useRouter } from 'next/navigation';

const LOCAL_STORAGE_TASKS_KEY = 'irbit-freelance-tasks';

// Placeholder tasks - теперь они соответствуют типу StoredTask
const placeholderTasks: StoredTask[] = [
  {
    id: 'placeholder-1',
    title: 'Починить протекающий кран на кухне',
    description: 'Нужен сантехник для срочного ремонта кухонного смесителя. Капает вода, нужно заменить прокладки или картридж.',
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
    description: 'Требуется полная уборка квартиры (50 кв.м) после выезда жильцов. Мытье окон, полов, санузла, кухни.',
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
    description: 'Срочно нужно передать пакет документов (небольшой конверт) из офиса на ул. Ленина в п. Зайково. Оплата сразу.',
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
    description: 'Купил новый роутер, не могу подключить интернет и настроить Wi-Fi. Нужна помощь специалиста на дому.',
    category: 'Компьютерная помощь',
    budget: undefined, // Бюджет не указан
    isNegotiable: true, // Значит цена договорная
    contactInfo: 'Писать в ЛС',
    postedDate: '2024-07-26',
    city: 'Ирбит',
    views: 22,
  },
];

export default function TasksClientContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Not used currently but good to have for future programmatic navigation

  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<StoredTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);


  // Set initial category from URL query parameter if present
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && taskCategories.includes(categoryFromUrl as typeof taskCategories[number])) {
      setSelectedCategory(categoryFromUrl);
    }
    // Simulate loading completion after initial setup
    // In a real app, this would depend on data fetching
    setIsLoading(false); 
  }, [searchParams]);

  // Load tasks from localStorage and placeholders on mount
  useEffect(() => {
    setIsLoading(true);
    let initialTasks: StoredTask[] = [...placeholderTasks];
    const storedTasksRaw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);

    if (storedTasksRaw) {
      try {
        const userTasks: StoredTask[] = JSON.parse(storedTasksRaw);
        initialTasks = [
          ...userTasks,
          ...placeholderTasks.filter(pt => !userTasks.some(ut => ut.id === pt.id))
        ];
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e);
      }
    }
    // Sort tasks by postedDate in descending order (newest first)
    initialTasks.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    setAllTasks(initialTasks);
    setIsLoading(false);
  }, []);

  // Filter tasks when searchTerm, selectedCategory, or allTasks change
  useEffect(() => {
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
    setFilteredTasks(tasksToFilter);
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
  
  if (isLoading && !searchParams.get('category')) { // Show main loader only if not directly navigating with category
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Briefcase className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
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

      <Card className="shadow-lg bg-card/70 backdrop-blur-sm sticky top-16 sm:top-20 z-40"> {/* Adjusted sticky top */}
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
