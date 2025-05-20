
"use client";

import Link from 'next/link';
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
  Search
} from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
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


export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Placeholder for user state - in a real app, this would come from auth context
  const user = {
    // isLoggedIn: true, // Set to true to simulate logged in state for UI dev
    isLoggedIn: false, // Set to false to simulate logged out state
    // name: "Иван П.",
    // avatarUrl: "https://placehold.co/40x40.png", // Placeholder avatar
  };

  const handleLogout = () => {
    // Simulate logout
    toast({
      title: "Выход",
      description: "Вы успешно вышли из системы (демонстрация).",
    });
    // In a real app: call your Firebase logout function, redirect, etc.
  };

  const mainNavLinks = [
    { href: "/tasks", label: "Найти задания", icon: <Search className="mr-2 h-5 w-5" /> },
    { href: "/create-task", label: "Создать задание", icon: <FilePlus2 className="mr-2 h-5 w-5" /> },
  ];

  const userMenuLinks = [
    { href: "/profile", label: "Мой профиль", icon: <UserCircle className="mr-2 h-5 w-5" /> },
    { href: "/my-tasks", label: "Мои задания", icon: <ListChecks className="mr-2 h-5 w-5" /> },
    { href: "/messages", label: "Сообщения", icon: <MessageSquare className="mr-2 h-5 w-5" /> },
    { href: "/notifications", label: "Уведомления", icon: <Bell className="mr-2 h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2">
          <Briefcase className="h-7 w-7 text-accent" />
          <span className="font-bold text-lg sm:text-xl">Фриланс Ирбит</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {mainNavLinks.map((link) => (
            <Button variant="ghost" asChild key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-3 py-2">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Profile Dropdown or Login/Register Buttons */}
        <div className="hidden md:flex items-center ml-4">
          {user.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl} alt={user.name || "User"} />
                    <AvatarFallback>
                      {user.name ? user.name.substring(0, 1).toUpperCase() : <UserCircle className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || "Пользователь"}</p>
                    {/* <p className="text-xs leading-none text-muted-foreground">
                      {user.email || "email@example.com"}
                    </p> */}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuLinks.map((link) => (
                   <DropdownMenuItem key={link.href} asChild className="cursor-pointer">
                    <Link href={link.href} className="flex items-center">
                      {link.icon}
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:!text-red-500 hover:!bg-red-500/10">
                  <LogOut className="mr-2 h-5 w-5" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-x-1 sm:space-x-2">
              <Button variant="outline" size="sm" className="hover:border-accent hover:text-accent">
                {/* TODO: Implement Login */}
                Войти
              </Button>
              <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {/* TODO: Implement Register */}
                Регистрация
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden ml-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Открыть меню">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-10 px-4">
              <nav className="flex flex-col space-y-2">
                <SheetClose asChild>
                    <Link href="/" className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50">
                        <Home className="mr-3 h-6 w-6 text-accent/80" /> Главная
                    </Link>
                </SheetClose>
                
                {mainNavLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link 
                      href={link.href} 
                      className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {React.cloneElement(link.icon, { className: "mr-3 h-6 w-6 text-accent/80"})}
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}

                <div className="my-4 border-t border-border"></div>

                {user.isLoggedIn ? (
                  <>
                    {userMenuLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link 
                          href={link.href} 
                          className="flex items-center text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {React.cloneElement(link.icon, { className: "mr-3 h-6 w-6 text-accent/80"})}
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Button 
                        variant="ghost" 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center justify-start text-lg font-medium text-red-500 hover:text-red-500 p-3 rounded-md hover:bg-red-500/10"
                      >
                        <LogOut className="mr-3 h-6 w-6 text-red-500/80" />
                        Выйти
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        className="w-full text-lg py-5"
                        onClick={() => { /* TODO: Login */ setIsMobileMenuOpen(false); }}
                      >
                        Войти
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button 
                        variant="default" 
                        className="w-full text-lg py-5 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => { /* TODO: Register */ setIsMobileMenuOpen(false); }}
                      >
                        Регистрация
                      </Button>
                    </SheetClose>
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

