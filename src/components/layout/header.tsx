// src/components/layout/header.tsx
"use client";
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Импортируем useRouter
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Menu,
  UserCircle,
  ListChecks,
  MessageSquare,
  Bell,
  LogOut,
  Home,
  FilePlus2,
  Search,
  LogIn,
  UserPlus,
  FileTextIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth, db } from '@/lib/firebase'; // Убедимся, что db импортирован, если нужен для других целей
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNavLinks: NavLink[] = [
  { href: "/tasks", label: "Найти задания", icon: Search },
  { href: "/create-task", label: "Создать задание", icon: FilePlus2 },
];

const userMenuLinks: NavLink[] = [
  { href: "/profile", label: "Мой профиль", icon: UserCircle },
  { href: "/my-tasks", label: "Мои задания", icon: ListChecks },
  { href: "/my-responses", label: "Мои отклики", icon: FileTextIcon },
  { href: "/messages", label: "Сообщения", icon: MessageSquare },
  { href: "/notifications", label: "Уведомления", icon: Bell },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter(); // Инициализируем router

  useEffect(() => {
    if (!auth) {
      console.warn("[Header Auth] Firebase Auth service is not available.");
      setIsLoadingAuth(false);
      return;
    }
    console.log("[Header Auth] Auth service available. Subscribing to auth state changes.");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      console.log("[Header Auth] Auth state changed. User:", currentUser ? currentUser.uid : null, ". isLoadingAuth set to false.");
    });
    return () => {
      console.log("[Header Auth] Unsubscribing from auth state changes.");
      unsubscribe();
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!auth) {
      toast({ title: "Ошибка", description: "Сервис аутентификации недоступен.", variant: "destructive" });
      return;
    }
    setIsLoadingAuth(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      toast({ title: "Вход выполнен", description: "Вы успешно вошли в систему." });
      setIsMobileMenuOpen(false);
      // Проверяем, новый ли это пользователь
      if (result.additionalUserInfo?.isNewUser) {
        router.push('/post-registration'); // Перенаправляем на новую страницу
      }
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({
        title: "Ошибка входа",
        description: error.message || "Не удалось войти через Google. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      // setIsLoadingAuth(false); // Это уже делается в onAuthStateChanged
    }
  }, [toast, router]);

  const handleLogout = useCallback(async () => {
    if (!auth) {
      toast({ title: "Ошибка", description: "Сервис аутентификации недоступен.", variant: "destructive" });
      return;
    }
    // setIsLoadingAuth(true); // Не обязательно здесь, т.к. onAuthStateChanged отреагирует
    try {
      await signOut(auth);
      toast({ title: "Выход выполнен", description: "Вы успешно вышли из системы." });
      setIsMobileMenuOpen(false);
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({
        title: "Ошибка выхода",
        description: error.message || "Не удалось выйти из системы.",
        variant: "destructive",
      });
    } finally {
      // setIsLoadingAuth(false); // Это уже делается в onAuthStateChanged
    }
  }, [toast]);
  
  if (isLoadingAuth) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <div className="mr-auto flex items-center space-x-2">
            <Briefcase className="h-7 w-7 text-accent animate-pulse" />
            <span className="font-bold text-lg sm:text-xl">Фриланс Ирбит</span>
          </div>
          <div className="h-9 w-24 bg-muted/50 rounded animate-pulse ml-auto"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2">
          <span className="flex items-center space-x-2">
            <Briefcase className="h-7 w-7 text-accent" />
            <span className="font-bold text-lg sm:text-xl">Фриланс Ирбит</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {mainNavLinks.map((link) => (
            <Button variant="ghost" asChild key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-3 py-2">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="hidden md:flex items-center ml-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Меню пользователя">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                      {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : <UserCircle className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "Пользователь"}</p>
                    {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                      <Link href={link.href} className="flex items-center">
                        <IconComponent className="mr-2 h-5 w-5" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:!text-red-500 hover:!bg-red-500/10">
                  <LogOut className="mr-2 h-5 w-5" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-x-1 sm:space-x-2">
              {auth ? (
                <>
                  <Button variant="outline" size="sm" className="hover:border-accent hover:text-accent" onClick={handleLogin}>
                    <LogIn className="mr-2 h-4 w-4" /> Войти
                  </Button>
                  <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleLogin}>
                    <UserPlus className="mr-2 h-4 w-4" /> Регистрация
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Сервис входа недоступен</p>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden ml-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Открыть меню">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] sm:w-[320px] pt-10 px-4"
              aria-labelledby="mobile-menu-title"
              aria-describedby="mobile-menu-description"
            >
              <SheetHeader>
                <VisuallyHidden>
                  <SheetTitle id="mobile-menu-title">Главное меню навигации</SheetTitle>
                  <SheetDescription id="mobile-menu-description">Выберите раздел сайта Фриланс Ирбит.</SheetDescription>
                </VisuallyHidden>
              </SheetHeader>
              <nav className="flex flex-col space-y-2 mt-4"> {/* Добавлен mt-4 для отступа от скрытого заголовка */}
                <SheetClose asChild>
                  <Link 
                    href="/"
                    className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="mr-3 h-6 w-6 text-accent/80" /> Главная
                  </Link>
                </SheetClose>

                {mainNavLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <SheetClose asChild key={link.href}>
                      <Link 
                        href={link.href}
                        className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent className="mr-3 h-6 w-6 text-accent/80" />
                        {link.label}
                      </Link>
                    </SheetClose>
                  );
                })}

                <div className="my-4 border-t border-border"></div>

                {user ? (
                  <>
                    {userMenuLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <SheetClose asChild key={link.href}>
                          <Link 
                            href={link.href}
                            className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <IconComponent className="mr-3 h-6 w-6 text-accent/80" />
                            {link.label}
                          </Link>
                        </SheetClose>
                      );
                    })}

                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-start text-lg font-medium text-red-500 hover:text-red-500 p-3 rounded-md hover:bg-red-500/10"
                      >
                        <LogOut className="mr-3 h-6 w-6 text-red-500/80" />
                        Выйти
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    {auth ? (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            className="w-full text-lg py-5"
                            onClick={handleLogin}
                          >
                            <LogIn className="mr-2 h-5 w-5" /> Войти
                          </Button>
                        </SheetClose>
                        
                        <SheetClose asChild>
                          <Button
                            variant="default"
                            className="w-full text-lg py-5 bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={handleLogin}
                          >
                            <UserPlus className="mr-2 h-5 w-5" /> Регистрация
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <p className="p-3 text-center text-muted-foreground">Сервис входа недоступен</p>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
