
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, Menu } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2"> {/* Pusher to the right */}
          <Briefcase className="h-7 w-7 text-accent" />
          <span className="font-bold text-lg sm:text-xl">Фриланс Ирбит</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/tasks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-3 py-2">
              Найти задания
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/create-task" className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent px-3 py-2">
              Создать задание
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden ml-2"> {/* Ensure some space if other elements are to its left */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Открыть меню">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-12 px-6">
              <nav className="flex flex-col space-y-5">
                <SheetClose asChild>
                  <Link 
                    href="/tasks" 
                    className="text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Найти задания
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link 
                    href="/create-task" 
                    className="text-lg font-medium text-foreground transition-colors hover:text-accent p-3 rounded-md hover:bg-muted/50 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Создать задание
                  </Link>
                </SheetClose>
                {/* Placeholder for future links like "Profile", "My Tasks" etc. */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
