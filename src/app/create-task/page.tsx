// src/app/create-task/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { taskSchema, type TaskFormValues, taskCategories, type StoredTask } from "@/lib/schemas";
import { FileText, DollarSign, ListChecks, UserCircle, Edit3 } from 'lucide-react';

const LOCAL_STORAGE_TASKS_KEY = 'irbit-freelance-tasks';

export default function CreateTaskPage() {
  const { toast } = useToast();
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

  async function onSubmit(data: TaskFormValues) {
    const newTask: StoredTask = {
      ...data,
      id: `task-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      postedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      city: "Ирбит",
      views: 0,
    };

    try {
      const existingTasksRaw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      const existingTasks: StoredTask[] = existingTasksRaw ? JSON.parse(existingTasksRaw) : [];
      existingTasks.unshift(newTask); // Add new task to the beginning
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(existingTasks));

      toast({
        title: "Задание успешно создано!",
        description: (
          <div className="text-sm">
            <p>Ваше задание "{newTask.title}" сохранено локально.</p>
            <p>Оно будет отображаться на странице просмотра заданий.</p>
          </div>
        ),
        variant: "default", // 'default' is usually for success, shadcn might use different variants
      });
      form.reset(); 
    } catch (error) {
      console.error("Failed to save task to localStorage", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить задание локально. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto"> {/* Slightly reduced max-width for better form appearance */}
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
        <CardContent className="pt-2 sm:pt-4"> {/* Adjusted padding */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md sm:text-lg flex items-center"><FileText className="h-5 w-5 mr-2 text-accent/80"/>Название задания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, 'Нужен ремонт стиральной машины'" {...field} className="h-12 text-base" />
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
                    <FormLabel className="text-md sm:text-lg flex items-center"><ListChecks className="h-5 w-5 mr-2 text-accent/80"/>Категория задания</FormLabel>
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
                      <FormLabel className="text-md sm:text-lg flex items-center"><DollarSign className="h-5 w-5 mr-2 text-accent/80"/>Бюджет (₽)</FormLabel>
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4 shadow-sm bg-muted/30 mt-6 md:mt-10"> {/* Adjusted mt */}
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
                    <FormLabel className="text-md sm:text-lg flex items-center"><UserCircle className="h-5 w-5 mr-2 text-accent/80"/>Контактная информация</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваш телефон, Telegram или другой способ связи" {...field} className="h-12 text-base" />
                    </FormControl>
                     <FormDescription className="text-xs sm:text-sm">
                      Как исполнители смогут с вами связаться.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" size="lg" className="w-full md:w-auto min-w-[180px] sm:min-w-[200px] text-md sm:text-lg h-12 sm:h-14 mt-6 sm:mt-8 shadow-lg hover-scale">
                Опубликовать задание
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
