"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ListFilter, Search, Briefcase, MapPin, DollarSign } from 'lucide-react';
import type { TaskFormValues } from '@/lib/schemas'; 
import { taskCategories } from '@/lib/schemas';

// Placeholder tasks
const placeholderTasks: (Omit<TaskFormValues, 'contactInfo' | 'isNegotiable'> & { id: string, postedDate: string, city: string, views?: number })[] = [
  {
    id: '1',
    title: 'Починить протекающий кран на кухне',
    description: 'Нужен сантехник для срочного ремонта кухонного смесителя. Капает вода, нужно заменить прокладки или картридж.',
    category: 'Ремонт и строительство',
    budget: 1500,
    postedDate: '2024-07-28',
    city: 'Ирбит',
    views: 15,
  },
  {
    id: '2',
    title: 'Генеральная уборка двухкомнатной квартиры',
    description: 'Требуется полная уборка квартиры (50 кв.м) после выезда жильцов. Мытье окон, полов, санузла, кухни.',
    category: 'Уборка и помощь по хозяйству',
    budget: 3000,
    postedDate: '2024-07-27',
    city: 'Ирбит',
    views: 32,
  },
  {
    id: '3',
    title: 'Доставить документы из центра в Зайково',
    description: 'Срочно нужно передать пакет документов (небольшой конверт) из офиса на ул. Ленина в п. Зайково. Оплата сразу.',
    category: 'Курьерские услуги',
    budget: 500,
    postedDate: '2024-07-28',
    city: 'Ирбит',
    views: 8,
  },
  {
    id: '4',
    title: 'Помощь в настройке Wi-Fi роутера',
    description: 'Купил новый роутер, не могу подключить интернет и настроить Wi-Fi. Нужна помощь специалиста на дому.',
    category: 'Компьютерная помощь',
    // budget: undefined, // Example of negotiable price
    postedDate: '2024-07-26',
    city: 'Ирбит',
    views: 22,
  },
];

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [filteredTasks, setFilteredTasks] = useState(placeholderTasks);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      let tasks = placeholderTasks;
      if (searchTerm) {
        tasks = tasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (selectedCategory) {
        tasks = tasks.filter(task => task.category === selectedCategory);
      }
      setFilteredTasks(tasks);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedCategory]);
  
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? undefined : value);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Актуальные задания в Ирбите</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Найдите подходящую работу или исполнителя для ваших задач.
        </p>
      </div>

      <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">
            <div className="md:col-span-2 lg:col-span-2 space-y-2">
              <label htmlFor="search" className="text-sm font-medium">Поиск по ключевым словам</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Например, 'уборка' или 'ремонт компьютера'"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Категория</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" className="h-12">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {taskCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12 w-full md:w-auto hover-scale" size="lg">
              <ListFilter className="mr-2 h-5 w-5" />
              Применить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="flex flex-col shadow-lg hover:shadow-primary/30 transition-shadow duration-300 hover-lift">
              <CardHeader>
                <CardTitle className="text-xl hover:text-primary transition-colors">
                  <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground flex items-center pt-1">
                  <Briefcase className="h-4 w-4 mr-1.5" /> {task.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
                 <div className="mt-3 text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-primary/70" /> {task.city}
                  </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center">
                   <DollarSign className="h-5 w-5 text-green-500 mr-1.5" />
                  <span className="text-lg font-semibold text-foreground">
                    {task.budget ? `${task.budget.toLocaleString()} ₽` : 'Договорная'}
                  </span>
                </div>
                <Button asChild variant="default" size="sm" className="hover-scale">
                  <Link href={`/tasks/${task.id}`}>Откликнуться</Link>
                </Button>
              </CardFooter>
               <div className="px-6 pb-4 text-xs text-muted-foreground flex justify-between">
                <span>Опубликовано: {new Date(task.postedDate).toLocaleDateString('ru-RU')}</span>
                <span>Просмотров: {task.views || 0}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Задания не найдены</h3>
          <p className="text-muted-foreground mt-2">
            Попробуйте изменить критерии поиска или загляните позже.
          </p>
          <Button asChild className="mt-6 hover-scale">
            <Link href="/create-task">Создать новое задание</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
