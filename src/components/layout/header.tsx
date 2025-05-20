
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, LogIn, LogOut, UserPlus, UserCircle, Settings, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; 
import { Skeleton } from '@/components/ui/skeleton';


export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    if (auth) { // Check if auth was initialized
      setFirebaseInitialized(true);
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoadingAuth(false);
      });
      return () => unsubscribe(); // Cleanup subscription on unmount
    } else {
      // Firebase auth failed to initialize (e.g. missing API key)
      console.warn("Header: Firebase auth instance is not available. Auth features will be disabled.");
      setLoadingAuth(false);
      setFirebaseInitialized(false);
    }
  }, []);

  const handleSignInWithGoogle = async () => {
    if (!auth) {
      console.error("Firebase Auth not initialized, cannot sign in.");
      // Optionally show a toast to the user
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error("Ошибка входа через Google: ", error);
      // TODO: Показать пользователю сообщение об ошибке (например, через toast)
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      console.error("Firebase Auth not initialized, cannot sign out.");
      return;
    }
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error("Ошибка выхода: ", error);
      // TODO: Показать пользователю сообщение об ошибке
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };


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
          {/* Можно добавить другие ссылки навигации здесь, если нужно */}
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {loadingAuth ? (
            <>
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </>
          ) : !firebaseInitialized ? (
             <Button variant="outline" size="sm" disabled>
                Auth N/A
              </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "Пользователь"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard"> {/* TODO: Create dashboard page */}
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Панель управления</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/profile"> {/* TODO: Create profile page */}
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/settings"> {/* TODO: Create settings page */}
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hover:border-accent hover:text-accent" onClick={handleSignInWithGoogle}>
                <LogIn className="mr-1.5 h-4 w-4" />
                Войти
              </Button>
              <Button size="sm" onClick={handleSignInWithGoogle}> {/* For now, registration also uses Google sign-in */}
                <UserPlus className="mr-1.5 h-4 w-4" />
                Регистрация
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
