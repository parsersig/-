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
import { taskSchema, type TaskFormValues, taskCategories } from "@/lib/schemas";
import { FileText, DollarSign, ListChecks, UserCircle } from 'lucide-react';

export default function CreateTaskPage() {
  const { toast } = useToast();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined, // Or a default category from taskCategories[0]
      budget: undefined,
      isNegotiable: false,
      contactInfo: "",
    },
  });

  async function onSubmit(data: TaskFormValues) {
    // TODO: Implement actual task submission logic (e.g., API call)
    console.log("Task data:", data);
    toast({
      title: "Задание создано (демо)",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
    form.reset(); // Reset form after submission
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Создать новое задание</CardTitle>
              <CardDescription className="text-md text-muted-foreground pt-1">
                Опишите вашу задачу, и найдутся исполнители в Ирбите!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg flex items-center"><FileText className="h-5 w-5 mr-2 text-primary/80"/>Название задания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, 'Нужен ремонт стиральной машины'" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel className="text-lg">Подробное описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите все детали: что нужно сделать, какие материалы использовать, сроки, особые требования и т.д."
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
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
                    <FormLabel className="text-lg flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary/80"/>Категория задания</FormLabel>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg flex items-center"><DollarSign className="h-5 w-5 mr-2 text-primary/80"/>Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Например, 1500" {...field} 
                          className="h-12 text-base"
                          disabled={form.watch("isNegotiable")}
                          onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                         />
                      </FormControl>
                      <FormDescription>Укажите примерный бюджет или оставьте пустым, если цена договорная.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="isNegotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30 mt-6 md:mt-12">
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
                        <FormLabel>
                          Цена договорная
                        </FormLabel>
                        <FormDescription>
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
                    <FormLabel className="text-lg flex items-center"><UserCircle className="h-5 w-5 mr-2 text-primary/80"/>Контактная информация</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваш телефон, Telegram или другой способ связи" {...field} className="h-12 text-base" />
                    </FormControl>
                     <FormDescription>
                      Как исполнители смогут с вами связаться. Эта информация будет видна только выбранному исполнителю (в будущих версиях).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* TODO: Add location field if not restricted to Irbit, or for more specific addresses */}
              {/* TODO: Add fields for deadlines, attachments, etc. */}

              <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px] text-lg h-14 mt-8 shadow-lg">
                Опубликовать задание
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
