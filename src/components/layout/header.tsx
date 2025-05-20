import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Briefcase className="h-7 w-7 text-accent" />
          <span className="font-bold text-xl sm:inline-block">Фриланс Ирбит</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-2 sm:space-x-4 lg:space-x-6">
          <Button variant="ghost" asChild>
            <Link href="/tasks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-2 sm:px-3">
              Найти задания
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/create-task" className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-2 sm:px-3">
              Создать задание
            </Link>
          </Button>
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* TODO: Auth buttons will go here later */}
          <Button variant="outline" size="sm" className="hover:border-accent hover:text-accent">Войти</Button>
          <Button size="sm">Регистрация</Button>
        </div>
      </div>
    </header>
  );
}
