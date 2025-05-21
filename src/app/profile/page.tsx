
// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2, MessageCircle } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, DocumentSnapshot, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import Link from "next/link";
import EditProfileForm from "@/components/profile/edit-profile-form";
import type { UserProfile, EditUserProfileFormValues, ReviewData } from "@/lib/schemas"; // Добавлен импорт ReviewData

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Неизвестно";
  return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "Недавно";
  return new Date(dateString).toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatReviewDate = (date: any): string => {
  if (!date) return 'неизвестно';
  if (date && typeof date.toDate === 'function') { // Firestore Timestamp
    return date.toDate().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (typeof date === "string") { // Уже отформатированная строка
    return date;
  }
  return 'неверный формат';
};


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Заглушки для статистики и отзывов, пока не реализована их загрузка
  // const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  // const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const placeholderReviews: ReviewData[] = [
    {
      id: '1',
      reviewerId: 'guest1',
      reviewerName: 'Елена П.',
      reviewerPhotoURL: 'https://placehold.co/40x40.png',
      reviewedUserId: user?.uid || 'current_user',
      rating: 5,
      comment: 'Отличный исполнитель! Все сделал быстро и качественно. Рекомендую!',
      createdAt: new Date(2024, 4, 15).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      taskTitle: 'Ремонт ванной комнаты' // Добавим для примера
    },
    {
      id: '2',
      reviewerId: 'guest2',
      reviewerName: 'Алексей С.',
      reviewerPhotoURL: 'https://placehold.co/40x40.png',
      reviewedUserId: user?.uid || 'current_user',
      rating: 4,
      comment: 'Работа выполнена хорошо, но немного задержали по срокам. В целом доволен.',
      createdAt: new Date(2024, 3, 20).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      taskTitle: 'Разработка логотипа' // Добавим для примера
    }
  ];


  const fetchUserProfile = useCallback(async (currentUser: User) => {
    if (!db || !currentUser?.uid) return;
    setIsLoadingProfile(true);
    try {
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef) as DocumentSnapshot<UserProfile>;
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        // Создаем базовый профиль, если его нет, с данными из Auth
        const newProfileData: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || undefined,
            displayName: currentUser.displayName || "Новый пользователь",
            photoURL: currentUser.photoURL || undefined,
            registrationDate: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
            city: "Ирбит", // Значение по умолчанию
            // aboutMe и specializations будут пустыми по умолчанию
        };
        await doc(db, "userProfiles", currentUser.uid).set(newProfileData);
        setUserProfile(newProfileData);
        console.log("New user profile created in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching or creating user profile:", error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // TODO: Реализовать загрузку реальных отзывов и статистики
  // const fetchUserReviews = useCallback(async (userId: string) => {
  //   if (!db) return;
  //   setIsLoadingReviews(true);
  //   try {
  //     const reviewsQuery = query(collection(db, "reviews"), where("reviewedUserId", "==", userId), orderBy("createdAt", "desc"));
  //     const querySnapshot = await getDocs(reviewsQuery);
  //     const fetchedReviews: ReviewData[] = [];
  //     querySnapshot.forEach((doc) => {
  //       const data = doc.data();
  //       fetchedReviews.push({
  //         id: doc.id,
  //         ...data,
  //         createdAt: formatReviewDate(data.createdAt),
  //         firestoreCreatedAt: data.createdAt,
  //       } as ReviewData);
  //     });
  //     setUserReviews(fetchedReviews);
  //   } catch (error) {
  //     console.error("Error fetching user reviews:", error);
  //   } finally {
  //     setIsLoadingReviews(false);
  //   }
  // }, []);

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
        // await fetchUserReviews(currentUser.uid); // Загрузка реальных отзывов (пока закомментировано)
      } else {
        setUserProfile(null);
        // setUserReviews([]);
        setIsLoadingProfile(false);
        // setIsLoadingReviews(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfile /*, fetchUserReviews*/]);

  const handleProfileUpdateSuccess = (updatedData: EditUserProfileFormValues) => {
    setUserProfile(prev => ({ 
        ...(prev as UserProfile), // Приводим тип, так как prev может быть null
        ...updatedData, 
        // Важно: uid, email, displayName, photoURL, registrationDate, lastSignInTime не должны перезаписываться из формы редактирования
        // Они либо берутся из Auth, либо устанавливаются при создании профиля
        uid: user!.uid, // user здесь не должен быть null
        email: user!.email || undefined,
        displayName: userProfile?.displayName || user!.displayName || "Пользователь", // Предпочитаем из userProfile, если есть
        photoURL: userProfile?.photoURL || user!.photoURL || undefined,
        registrationDate: userProfile?.registrationDate || user!.metadata.creationTime,
        lastSignInTime: userProfile?.lastSignInTime || user!.metadata.lastSignInTime,
    }));
    setIsEditDialogOpen(false);
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
  
  // Форматируем даты из user.metadata для отображения
  const registrationDateDisplay = formatDate(user.metadata.creationTime);
  const lastSignInDateDisplay = formatDateTime(user.metadata.lastSignInTime);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-10">
      {/* --- Hero Section --- */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="relative p-0">
          {/* Placeholder for a banner image if desired in the future */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30"></div>
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 flex flex-col items-center w-full px-4">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background bg-background shadow-lg">
              <AvatarImage src={userProfile?.photoURL || user.photoURL || undefined} alt={userProfile?.displayName || user.displayName || "User"} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-4xl sm:text-5xl bg-muted">
                {(userProfile?.displayName || user.displayName) ? (userProfile.displayName || user.displayName)!.charAt(0).toUpperCase() : <UserCircle className="h-16 w-16"/>}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-3">{userProfile?.displayName || user.displayName || "Пользователь"}</CardTitle>
            <CardDescription className="text-sm sm:text-md text-muted-foreground pt-0.5">
              {userProfile?.city || "Ирбит"} {userProfile?.age && `• ${userProfile.age} лет`}
            </CardDescription>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              <Badge variant="outline" className="border-green-500/70 text-green-400">Исполнитель (статус)</Badge>
              <Badge variant="outline" className="border-blue-500/70 text-blue-400">Проверен</Badge>
            </div>
          </div>
        </CardHeader>
        {/* Empty CardContent to push footer down, adjust pt as needed */}
        <CardContent className="pt-28 sm:pt-32 p-6"> 
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
                  <div className="overflow-y-auto pr-2 flex-grow">
                    {user && (
                        <EditProfileForm 
                            currentUser={user} 
                            initialProfileData={userProfile || { uid: user.uid } }
                            onProfileUpdated={handleProfileUpdateSuccess}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    )}
                  </div>
              </DialogContent>
            </Dialog>
        </CardContent>
      </Card>

      {/* --- About Me & Specializations --- */}
      <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
        <Card className="md:col-span-2 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Briefcase className="h-6 w-6 mr-2.5 text-accent"/>Обо мне</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfile && <p className="text-sm text-muted-foreground italic">Загрузка информации...</p>}
            {!isLoadingProfile && userProfile?.aboutMe && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.aboutMe}</p>}
            {!isLoadingProfile && !userProfile?.aboutMe && <p className="text-sm text-muted-foreground italic">Информация о себе еще не добавлена. Вы можете добавить ее, нажав "Редактировать профиль".</p>}
          </CardContent>
        </Card>
        <Card className="md:col-span-1 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfile && <p className="text-sm text-muted-foreground italic">Загрузка...</p>}
            {!isLoadingProfile && userProfile?.specializations && userProfile.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.specializations.map(spec => <Badge key={spec} variant="secondary" className="bg-accent/10 text-accent border-accent/30">{spec}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Специализации еще не выбраны. Вы можете добавить их, нажав "Редактировать профиль".</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* --- Activity & Stats --- */}
      <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Активность и Статистика</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-muted/30 rounded-lg">
                <p className="flex items-center font-medium text-foreground/90"><CalendarDays className="h-5 w-5 mr-2 text-accent/80" />Дата регистрации:</p>
                <p className="ml-7 text-muted-foreground">{registrationDateDisplay}</p>
            </div>
             <div className="p-4 bg-muted/30 rounded-lg">
                <p className="flex items-center font-medium text-foreground/90"><Clock className="h-5 w-5 mr-2 text-accent/80" />Последний визит:</p>
                <p className="ml-7 text-muted-foreground">{lastSignInDateDisplay}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
                <p className="flex items-center font-medium text-foreground/90"><ShieldCheck className="h-5 w-5 mr-2 text-green-400" />Email:</p>
                 <p className="ml-7 text-muted-foreground">{user.email} {user.emailVerified ? "(подтвержден)" : "(не подтвержден)"}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-3xl font-bold text-accent">{userProfile?.tasksCreated || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Заданий создано</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-3xl font-bold text-accent">{userProfile?.tasksCompleted || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Заданий выполнено</p>
            </div>
             <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-3xl font-bold text-accent">{userProfile?.reviewsCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Отзывов получено</p>
            </div>
        </CardContent>
      </Card>

      {/* --- Reviews Section --- */}
      <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы</CardTitle>
            <div className="flex items-baseline space-x-1 text-sm">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-lg text-foreground">{userProfile?.averageRating?.toFixed(1) || "Н/Д"}</span>
                <span className="text-muted-foreground">({userProfile?.reviewsCount || 0} отзывов)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO: Load and display actual reviews. For now, using placeholders. */}
          {/* {isLoadingReviews && <div className="text-center py-4"><Loader2 className="mx-auto h-8 w-8 text-accent animate-spin"/></div>} */}
          {placeholderReviews.length > 0 ? (
            <div className="space-y-4">
              {placeholderReviews.map((review) => (
                <Card key={review.id} className="p-4 bg-muted/30 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={review.reviewerPhotoURL || undefined} alt={review.reviewerName} data-ai-hint="reviewer avatar" />
                      <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground/90">{review.reviewerName}</p>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400' : 'fill-muted'}`} />
                          ))}
                        </div>
                      </div>
                      {review.taskTitle && <p className="text-xs text-muted-foreground">По заданию: «{review.taskTitle}»</p>}
                       <p className="text-xs text-muted-foreground mb-1.5">{review.createdAt}</p>
                      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                    </div>
                  </div>
                </Card>
              ))}
              <div className="text-center pt-2">
                <Button variant="link" className="text-accent text-sm">Показать все отзывы (в разработке)</Button>
              </div>
            </div>
          ) : (
             <p className="text-sm text-muted-foreground italic text-center py-4">Отзывов пока нет.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
