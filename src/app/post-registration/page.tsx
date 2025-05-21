// src/app/post-registration/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilePlus2, Search, UserCheck } from 'lucide-react';
import Image from 'next/image';

export default function PostRegistrationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6">
            <Image
              src="https://placehold.co/200x150.png" // Замените на подходящую иллюстрацию
              alt="Приветственная иллюстрация"
              width={200}
              height={150}
              className="rounded-lg"
              data-ai-hint="welcome celebration"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Спасибо за регистрацию!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Что хотите сделать дальше?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild size="lg" className="w-full hover-scale">
            <Link href="/create-task" className="flex items-center justify-center">
              <FilePlus2 className="h-5 w-5 mr-2" />
              Создать задание
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full hover-scale hover:border-accent hover:text-accent">
            <Link href="/profile" className="flex items-center justify-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Стать исполнителем (перейти в профиль)
            </Link>
          </Button>
          <div className="text-center mt-4">
            <Link href="/tasks" className="text-sm text-accent hover:underline flex items-center justify-center">
              <Search className="h-4 w-4 mr-1.5" />
              Посмотреть примеры заданий
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
