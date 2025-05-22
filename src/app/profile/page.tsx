// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"; // DialogClose убрана, т.к. закрытие управляется isEditDialogOpen
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs, getCountFromServer, orderBy } from "firebase/firestore"; // Добавлены нужные импорты
import Link from "next/link";
import EditProfileForm from "@/components/profile/edit-profile-form";
import type { UserProfile, EditUserProfileFormValues, ReviewData } from "@/lib/schemas"; // Добавлен ReviewData

// Вспомогательные функции для форматирования дат
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Неизвестно";
  return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "Недавно";
  return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [tasksCreatedCount, setTasksCreatedCount] = useState<number | null>(null);
  const [tasksCompletedCount, setTasksCompletedCount] = useState<number | null>(null);
  const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const fetchUserProfileAndStats = useCallback(async (currentUser: User) => {
    if (!db || !currentUser?.uid) return;

    setIsLoadingProfile(true);
    setIsLoadingStats(true);
    setIsLoadingReviews(true);

    try {
      // 1. Загрузка или создание профиля пользователя
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      let currentProfileData: UserProfile;

      if (profileSnap.exists()) {
        currentProfileData = { uid: currentUser.uid, ...profileSnap.data() } as UserProfile;
      } else {
        console.log("No such user profile! Creating one...");
        const newProfileData: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
          aboutMe: "",
          specializations: [],
          city: "Ирбит", // Default city
          registrationDate: currentUser.metadata.creationTime ? Timestamp.fromDate(new Date(currentUser.metadata.creationTime)) : Timestamp.now(),
          lastSignInTime: currentUser.metadata.lastSignInTime ? Timestamp.fromDate(new Date(currentUser.metadata.lastSignInTime)) : Timestamp.now(),
          tasksCreated: 0,
          tasksCompleted: 0,
          averageRating: null,
          reviewsCount: 0,
        };
        await setDoc(profileRef, newProfileData);
        currentProfileData = newProfileData;
      }
      setUserProfile(currentProfileData);
      setIsLoadingProfile(false);

      // 2. Загрузка статистики по заданиям
      const tasksCollectionRef = collection(db, "tasks");
      // Задания созданные пользователем
      const createdQuery = query(tasksCollectionRef, where("userId", "==", currentUser.uid));
      const createdSnapshot = await getCountFromServer(createdQuery);
      setTasksCreatedCount(createdSnapshot.data().count);

      // Задания выполненные пользователем (если бы он был исполнителем)
      // Это более сложная логика, пока оставим 0 или заглушку
      // const completedQuery = query(tasksCollectionRef, where("executorId", "==", currentUser.uid), where("status", "==", "completed"));
      // const completedSnapshot = await getCountFromServer(completedQuery);
      // setTasksCompletedCount(completedSnapshot.data().count);
      // Пока что для простоты, если пользователь - заказчик, то выполненных им как исполнителем 0
      // Если бы у нас была роль исполнителя, то считали бы по-другому.
      // Для примера, если бы 'tasksCompleted' было полем в профиле, мы бы его брали оттуда.
      setTasksCompletedCount(currentProfileData.tasksCompleted || 0); // Берем из профиля если есть, иначе 0
      setIsLoadingStats(false);

      // 3. Загрузка отзывов о пользователе
      const reviewsQuery = query(collection(db, "reviews"), where("reviewedUserId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const fetchedReviews: ReviewData[] = [];
      let totalRating = 0;
      reviewsSnapshot.forEach(docSnap => {
        const review = { id: docSnap.id, ...docSnap.data() } as ReviewData;
        fetchedReviews.push(review);
        if (review.rating) {
          totalRating += review.rating;
        }
      });
      setUserReviews(fetchedReviews);
      setReviewsCount(fetchedReviews.length);
      setAverageRating(fetchedReviews.length > 0 ? parseFloat((totalRating / fetchedReviews.length).toFixed(1)) : null);
      setIsLoadingReviews(false);

    } catch (error) {
      console.error("Error fetching user profile, stats or reviews:", error);
      setUserProfile(null); // Сбрасываем профиль при ошибке
      setIsLoadingProfile(false);
      setIsLoadingStats(false);
      setIsLoadingReviews(false);
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
        await fetchUserProfileAndStats(currentUser);
      } else {
        setUserProfile(null);
        setTasksCreatedCount(null);
        setTasksCompletedCount(null);
        setUserReviews([]);
        setAverageRating(null);
        setReviewsCount(0);
        setIsLoadingProfile(false);
        setIsLoadingStats(false);
        setIsLoadingReviews(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfileAndStats]);

  const handleProfileUpdateSuccess = (updatedData: EditUserProfileFormValues) => {
    setUserProfile(prev => ({ 
        ...(prev || {}), // Сохраняем существующие поля, если они были
        ...updatedData, 
        // Гарантируем, что основные поля из User не затираются, если они не были в updatedData
        uid: user!.uid, 
        email: user!.email || undefined,
        // displayName и photoURL могут обновляться через форму, поэтому берем их из updatedData или user
        displayName: updatedData.displayName !== undefined ? updatedData.displayName : (prev?.displayName || user?.displayName || ""),
        photoURL: updatedData.photoURL !== undefined ? updatedData.photoURL : (prev?.photoURL || user?.photoURL || ""),
        // Даты не должны обновляться этой формой
        registrationDate: prev?.registrationDate || (user?.metadata.creationTime ? Timestamp.fromDate(new Date(user.metadata.creationTime)) : undefined),
        lastSignInTime: prev?.lastSignInTime || (user?.metadata.lastSignInTime ? Timestamp.fromDate(new Date(user.metadata.lastSignInTime)) : undefined),
    } as UserProfile));
    setIsEditDialogOpen(false);
    // Можно добавить toast об успешном обновлении, если EditProfileForm его еще не показывает
  };

  if (isLoadingAuth || (user && (isLoadingProfile || isLoadingStats || isLoadingReviews))) {
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

  const registrationDateDisplay = user.metadata.creationTime 
    ? formatDate(user.metadata.creationTime)
    : "Неизвестно";
  
  const lastSignInDateDisplay = user.metadata.lastSignInTime
    ? formatDateTime(user.metadata.lastSignInTime)
    : "Недавно";

  const displayName = userProfile?.displayName || user.displayName || "Пользователь";
  const photoURL = userProfile?.photoURL || user.photoURL || undefined;


  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Верхний блок профиля */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="relative shrink-0">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-accent shadow-lg">
              <AvatarImage src={photoURL} alt={displayName} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-5xl sm:text-6xl bg-muted/50">
                {displayName ? displayName.charAt(0).toUpperCase() : <UserCircle className="h-20 w-20"/>}
              </AvatarFallback>
            </Avatar>
            {/* Кнопка редактирования фото пока не активна */}
            <Button variant="outline" size="icon" className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-background hover:bg-accent/10 border-accent/50 text-accent hover:text-accent shadow-md" title="Редактировать фото (в разработке)">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактировать фото</span>
            </Button>
          </div>
          <div className="flex-grow text-center md:text-left">
            <CardTitle className="text-3xl sm:text-4xl font-bold mb-1">{displayName}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mb-3">{userProfile?.city || "Ирбит"} • {userProfile?.age ? `${userProfile.age} лет` : "Возраст не указан"}</CardDescription> 
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              <Badge variant="secondary" className="text-sm py-1 px-3 bg-blue-600/20 text-blue-400 border-blue-500/40">Проверен</Badge>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button size="lg" className="w-full sm:w-auto hover-scale">
                <Mail className="h-5 w-5 mr-2" /> Написать сообщение
              </Button>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full sm:w-auto hover-scale">
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
                            initialProfileData={userProfile || {}}
                            onProfileUpdated={handleProfileUpdateSuccess}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    )}
                  </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
        {/* Левая колонка: О себе, Специализации */}
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><UserCircle className="h-6 w-6 mr-2.5 text-accent"/>Обо мне</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile && <p className="text-sm text-muted-foreground">Загрузка...</p>}
              {!isLoadingProfile && userProfile?.aboutMe && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.aboutMe}</p>}
              {!isLoadingProfile && !userProfile?.aboutMe && <p className="text-sm text-muted-foreground italic">Информация о себе еще не добавлена. Вы можете добавить ее, нажав "Редактировать профиль".</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile && <p className="text-sm text-muted-foreground">Загрузка...</p>}
              {!isLoadingProfile && userProfile?.specializations && userProfile.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {userProfile.specializations.map(spec => <Badge key={spec} variant="outline" className="text-sm">{spec}</Badge>)}
                </div>
              )}
              {!isLoadingProfile && (!userProfile?.specializations || userProfile.specializations.length === 0) && (
                <p className="text-sm text-muted-foreground italic">Специализации еще не выбраны. Вы можете добавить их, нажав "Редактировать профиль".</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка: Статистика, Активность */}
        <div className="md:col-span-1 space-y-6 sm:space-y-8">
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Заданий создано:</span>
                {isLoadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-semibold text-lg text-accent">{tasksCreatedCount ?? 0}</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Заданий выполнено:</span>
                {isLoadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-semibold text-lg text-accent">{tasksCompletedCount ?? 0}</span>}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Clock className="h-6 w-6 mr-2.5 text-accent"/>Активность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center text-muted-foreground"><Mail className="h-4 w-4 mr-2 text-accent/80" />Email: <span className="ml-1 font-medium text-foreground/90">{user.email || "Не указан"}</span> {user.emailVerified && <span title="Email подтвержден"><ShieldCheck className="h-4 w-4 ml-1.5 text-green-400" /></span>}</p>
              <p className="flex items-center text-muted-foreground"><CalendarDays className="h-4 w-4 mr-2 text-accent/80" />Регистрация: <span className="ml-1 font-medium text-foreground/90">{registrationDateDisplay}</span></p>
              <p className="flex items-center text-muted-foreground"><Clock className="h-4 w-4 mr-2 text-accent/80" />Последний визит: <span className="ml-1 font-medium text-foreground/90">{lastSignInDateDisplay}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Секция Отзывы */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы о Вас</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingReviews && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-accent"/> <span className="ml-2 text-muted-foreground">Загрузка отзывов...</span></div>}
          {!isLoadingReviews && reviewsCount > 0 && averageRating !== null && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-7 w-7 ${i < Math.round(averageRating) ? 'fill-yellow-400' : 'fill-muted stroke-yellow-500'}`} />
                ))}
              </div>
              <span className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">на основе {reviewsCount} {reviewsCount === 1 ? "отзыва" : reviewsCount > 1 && reviewsCount < 5 ? "отзывов" : "отзывов"}</span>
            </div>
          )}
           {!isLoadingReviews && userReviews.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">Отзывов о вас пока нет.</p>
           )}

          {userReviews.length > 0 && (
            <div className="space-y-6">
              {userReviews.map(review => (
                <Card key={review.id} className="bg-muted/40 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={review.reviewerPhotoURL || undefined} alt={review.reviewerName || "User"} />
                      <AvatarFallback>{review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-foreground/90">{review.reviewerName || "Аноним"}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt?.toDate?.().toISOString())}</span>
                      </div>
                      <div className="flex text-yellow-400 mb-1.5">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400' : 'fill-muted stroke-yellow-500'}`} />)}
                      </div>
                      {review.taskTitle && review.taskId && (
                         <p className="text-xs text-muted-foreground mb-1.5">
                           Отзыв к заданию: <Link href={`/tasks/${review.taskId}`} className="text-accent hover:underline">{review.taskTitle}</Link>
                         </p>
                      )}
                      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    