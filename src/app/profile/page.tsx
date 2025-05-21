
// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, DocumentSnapshot } from "firebase/firestore";
import Link from "next/link";
import EditProfileForm from "@/components/profile/edit-profile-form";
import type { UserProfile, EditUserProfileFormValues } from "@/lib/schemas";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null); // Partial, т.к. профиль может быть не полностью заполнен
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    if (!db || !currentUser?.uid) return;
    setIsLoadingProfile(true);
    try {
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      const profileSnap: DocumentSnapshot<Omit<UserProfile, 'uid' | 'registrationDate' | 'lastSignInTime'>> = await getDoc(profileRef) as DocumentSnapshot<Omit<UserProfile, 'uid' | 'registrationDate' | 'lastSignInTime'>>;
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        setUserProfile(null); // Профиль еще не создан
        console.log("No such user profile!");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth instance is not available in ProfilePage.");
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null); // Сбрасываем профиль если пользователь вышел
        setIsLoadingProfile(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const handleProfileUpdateSuccess = (updatedData: EditUserProfileFormValues) => {
    // Оптимистичное обновление или повторная загрузка
    setUserProfile(prev => ({ ...prev, ...updatedData, uid: user?.uid, email: user?.email || undefined, displayName: user?.displayName || undefined, photoURL: user?.photoURL || undefined }));
    setIsEditDialogOpen(false);
    // Для полной синхронизации можно вызвать fetchUserProfile(user!) снова, но это лишний запрос если данные уже есть
  };

  if (isLoadingAuth || (user && isLoadingProfile)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent animate-spin" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8">
          <CardHeader>
            <div className="flex flex-col items-center space-y-3">
              <LogIn className="h-12 w-12 text-accent" />
              <CardTitle className="text-2xl sm:text-3xl font-bold">Войдите, чтобы просмотреть профиль</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Для доступа к этой странице необходимо войти в систему.</p>
            <Button size="lg" asChild className="hover-scale">
                <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const registrationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "Неизвестно";
  
  const lastSignInDate = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "Недавно";

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-10">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="items-center text-center border-b pb-6 bg-muted/20 p-6 sm:p-8">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-accent shadow-lg">
              <AvatarImage src={userProfile?.photoURL || user.photoURL || undefined} alt={userProfile?.displayName || user.displayName || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-4xl sm:text-5xl bg-muted/50">
                {(userProfile?.displayName || user.displayName) ? (userProfile?.displayName || user.displayName)!.charAt(0).toUpperCase() : <UserCircle className="h-16 w-16"/>}
              </AvatarFallback>
            </Avatar>
            {/* Кнопка редактирования фото пока не активна, но оставим для UI */}
            <Button variant="outline" size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-background hover:bg-accent/10 border-accent/50 text-accent hover:text-accent shadow-md" title="Редактировать фото (в разработке)">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактировать фото</span>
            </Button>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{userProfile?.displayName || user.displayName || "Пользователь"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">{userProfile?.city || "Ирбит (заглушка)"} • {userProfile?.age ? `${userProfile.age} лет` : "Возраст не указан (заглушка)"}</CardDescription> 
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-green-600/20 text-green-400 border-green-500/40">Исполнитель (статус-заглушка)</Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-blue-600/20 text-blue-400 border-blue-500/40">Проверен (заглушка)</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><UserCircle className="h-6 w-6 mr-2.5 text-accent"/>Основная информация</h3>
            <div className="space-y-2 text-sm text-muted-foreground pl-8">
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2.5 text-accent/80" />
                Email: <span className="ml-1 font-medium text-foreground/90">{user.email || "Не указан"}</span> 
                {user.emailVerified && (
                  <span title="Email подтвержден">
                    <ShieldCheck className="h-4 w-4 ml-2 text-green-400" />
                  </span>
                )}
              </p>
              <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2.5 text-accent/80" />Дата регистрации: <span className="ml-1 font-medium text-foreground/90">{registrationDate}</span></p>
              <p className="flex items-center"><Clock className="h-4 w-4 mr-2.5 text-accent/80" />Был(а) на сайте: <span className="ml-1 font-medium text-foreground/90">{lastSignInDate}</span></p>
              {/* <p className="text-xs mt-1">Подтверждения: Email, Телефон, Соцсеть (заглушка)</p> */}
            </div>
          </section>

           <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Статистика (заглушка)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center pl-8">
                <Card className="p-4 bg-muted/40 rounded-lg shadow">
                    <p className="text-3xl font-bold text-accent">34</p>
                    <p className="text-xs text-muted-foreground mt-1">заданий создано</p>
                </Card>
                <Card className="p-4 bg-muted/40 rounded-lg shadow">
                    <p className="text-3xl font-bold text-accent">0</p>
                    <p className="text-xs text-muted-foreground mt-1">заданий выполнено</p>
                </Card>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Briefcase className="h-6 w-6 mr-2.5 text-accent"/>О себе</h3>
            {isLoadingProfile && <p className="text-sm text-muted-foreground pl-8">Загрузка информации...</p>}
            {!isLoadingProfile && userProfile?.aboutMe && <p className="text-sm text-muted-foreground pl-8 whitespace-pre-line">{userProfile.aboutMe}</p>}
            {!isLoadingProfile && !userProfile?.aboutMe && <p className="text-sm text-muted-foreground pl-8 italic">Информация о себе еще не добавлена.</p>}
          </section>

           <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации</h3>
            {isLoadingProfile && <p className="text-sm text-muted-foreground pl-8">Загрузка специализаций...</p>}
            {!isLoadingProfile && userProfile?.specializations && userProfile.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-8">
                {userProfile.specializations.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
              </div>
            )}
            {!isLoadingProfile && (!userProfile?.specializations || userProfile.specializations.length === 0) && (
              <p className="text-sm text-muted-foreground pl-8 italic">Специализации еще не выбраны.</p>
            )}
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы (заглушка)</h3>
            <div className="pl-8 space-y-4">
              <div className="flex items-baseline space-x-2">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-current" />)}
                </div>
                <span className="text-muted-foreground text-lg font-semibold">5.0</span>
                <span className="text-sm text-muted-foreground">(8 отзывов)</span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" className="text-xs">Положительные (8)</Button>
                <Button variant="outline" size="sm" className="text-xs">Отрицательные (0)</Button>
              </div>
              <Card className="p-4 bg-muted/40 rounded-lg shadow">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-foreground/90">Задание «Сделать по образцу 4 макета для контекстной рекламы» <span className="text-green-400 font-normal">выполнено</span></p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">2 апреля 2025</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Исполнитель: Екатерина С.</p>
                <p className="text-sm italic">"Заказчик была на связи во время выполнения задания, оперативно приняла результат. Буду рада помочь еще!)"</p>
              </Card>
            </div>
          </section>

        </CardContent>
        <CardFooter className="border-t p-6 sm:p-8">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full hover-scale text-base py-3">
                    <Edit className="h-5 w-5 mr-2" /> Редактировать профиль
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Редактирование профиля</DialogTitle>
                    <DialogDescription>
                      Обновите информацию о себе и своих специализациях.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto pr-2"> {/* Добавляем прокрутку для контента формы */}
                    {user && (
                        <EditProfileForm 
                            currentUser={user} 
                            initialProfileData={userProfile || {}} // Передаем пустой объект, если профиля нет
                            onProfileUpdated={handleProfileUpdateSuccess}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    )}
                  </div>
              </DialogContent>
            </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}

