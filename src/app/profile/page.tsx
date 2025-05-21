"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2, MessageCircle, ClipboardList, ClipboardCheck } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, DocumentSnapshot, Timestamp } from "firebase/firestore";
import Link from "next/link";
import EditProfileForm from "@/components/profile/edit-profile-form";
import type { UserProfile, EditUserProfileFormValues, ReviewData } from "@/lib/schemas";

// Helper function to format Firestore Timestamps or date strings
const formatDate = (dateInput: string | Date | Timestamp | undefined): string => {
  if (!dateInput) return "Неизвестно";
  let date: Date;
  if (dateInput instanceof Timestamp) {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "Некорректная дата";
  }
  if (isNaN(date.getTime())) return "Некорректная дата";
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateTimeInput: string | Date | Timestamp | undefined): string => {
  if (!dateTimeInput) return "Недавно";
  let date: Date;
  if (dateTimeInput instanceof Timestamp) {
    date = dateTimeInput.toDate();
  } else if (typeof dateTimeInput === 'string') {
    date = new Date(dateTimeInput);
  } else if (dateTimeInput instanceof Date) {
    date = dateTimeInput;
  } else {
    return "Некорректное время";
  }
  if (isNaN(date.getTime())) return "Некорректное время";
  return date.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Расширяем тип ReviewData, добавляя taskTitle
interface ExtendedReviewData extends ReviewData {
  taskTitle?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Заглушки для статистики и отзывов
  const placeholderReviews: ExtendedReviewData[] = [
    { id: '1', reviewerId: 'guest1', reviewerName: 'Елена П.', reviewerPhotoURL: 'https://placehold.co/40x40.png', reviewedUserId: user?.uid || 'current_user', rating: 5, comment: 'Отличный исполнитель! Все сделал быстро и качественно. Рекомендую!', createdAt: formatDate(new Date(2024, 4, 15)), taskTitle: 'Ремонт ванной комнаты' },
    { id: '2', reviewerId: 'guest2', reviewerName: 'Алексей С.', reviewerPhotoURL: 'https://placehold.co/40x40.png', reviewedUserId: user?.uid || 'current_user', rating: 4, comment: 'Работа выполнена хорошо, но немного задержали по срокам. В целом доволен.', createdAt: formatDate(new Date(2024, 3, 20)), taskTitle: 'Разработка логотипа' }
  ];

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    if (!db || !currentUser?.uid) {
      console.warn("Firestore DB or currentUser UID is not available for fetching profile.");
      setIsLoadingProfile(false);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef) as DocumentSnapshot<UserProfile>;
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data());
      } else {
        // Профиль еще не создан, создаем базовый
        console.log("No user profile found for UID:", currentUser.uid, "Creating one now.");
        const newProfileData: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          displayName: currentUser.displayName || "Новый пользователь",
          photoURL: currentUser.photoURL || undefined,
          registrationDate: currentUser.metadata.creationTime ? Timestamp.fromDate(new Date(currentUser.metadata.creationTime)) : undefined,
          lastSignInTime: currentUser.metadata.lastSignInTime ? Timestamp.fromDate(new Date(currentUser.metadata.lastSignInTime)) : undefined,
          city: "Ирбит",
          aboutMe: "",
          specializations: [],
          phoneVerified: false, // Добавлено обязательное поле
          // другие поля можно инициализировать по умолчанию или оставить undefined
        };
        await setDoc(doc(db, "userProfiles", currentUser.uid), newProfileData);
        setUserProfile(newProfileData);
        console.log("New user profile created in Firestore with basic data.");
      }
    } catch (error) {
      console.error("Error fetching or creating user profile:", error);
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
        setUserProfile(null);
        setIsLoadingProfile(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const handleProfileUpdateSuccess = (updatedData: EditUserProfileFormValues) => {
    setUserProfile(prev => {
      const currentPhotoURL = prev?.photoURL || user?.photoURL || undefined;
      const currentDisplayName = prev?.displayName || user?.displayName || "Пользователь";
      return {
        ...(prev as UserProfile), // Ensure prev is treated as UserProfile
        uid: user!.uid, // user should not be null here
        email: user!.email || undefined,
        displayName: currentDisplayName, // Keep existing displayName from profile or auth
        photoURL: currentPhotoURL, // Keep existing photoURL from profile or auth
        registrationDate: prev?.registrationDate || (user?.metadata.creationTime ? Timestamp.fromDate(new Date(user.metadata.creationTime)) : undefined),
        lastSignInTime: prev?.lastSignInTime || (user?.metadata.lastSignInTime ? Timestamp.fromDate(new Date(user.metadata.lastSignInTime)) : undefined),
        city: prev?.city || "Ирбит",
        phoneVerified: prev?.phoneVerified || false, // Добавлено обязательное поле
        ...updatedData, // Apply updates from the form
      };
    });
    setIsEditDialogOpen(false);
  };

  if (isLoadingAuth || (user && isLoadingProfile && userProfile === undefined)) {
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

  const displayPhotoURL = userProfile?.photoURL || user.photoURL || undefined;
  const displayDisplayName = userProfile?.displayName || user.displayName || "Пользователь";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* --- Hero Section --- */}
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm border border-accent/10 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-accent/40 via-primary/20 to-accent/40 relative">
          {/* Декоративные элементы для фона */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary/30 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl"></div>
          </div>
        </div>
        <div className="relative px-6 sm:px-10 pb-6 -mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-background shadow-xl">
            <AvatarImage src={displayPhotoURL} alt={displayDisplayName} />
            <AvatarFallback className="text-5xl sm:text-6xl bg-muted">
              {displayDisplayName ? displayDisplayName.charAt(0).toUpperCase() : <UserCircle className="h-20 w-20"/>}
            </AvatarFallback>
            {/* Индикатор верифицированности */}
            {user.emailVerified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-md">
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email подтвержден</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Avatar>
          <div className="flex-1 text-center sm:text-left space-y-2 pb-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{displayDisplayName}</h1>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium border-green-600/40 bg-green-500/10 text-green-600"> Исполнитель </Badge>
                <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium border-blue-600/40 bg-blue-500/10 text-blue-600"> Проверен </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              {userProfile?.city || "Ирбит"}
              {userProfile?.age && `• ${userProfile.age} лет`}
            </p>
            <p className="text-sm text-muted-foreground/80">
              На сайте с {formatDate(userProfile?.registrationDate || user.metadata.creationTime)}
            </p>
            <div className="pt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="px-4">
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать профиль
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
                    <EditProfileForm
                      currentUser={user}
                      initialProfileData={userProfile || { uid: user.uid } as UserProfile}
                      onProfileUpdated={handleProfileUpdateSuccess}
                      onCancel={() => setIsEditDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </Card>

      {/* --- Основная информация и О себе --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg bg-card/90 backdrop-blur-sm border border-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-accent"/> Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Email</p>
                <p className="flex items-center font-medium text-foreground">
                  {user.email || "Не указан"}
                  {user.emailVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ShieldCheck className="h-4 w-4 ml-1.5 text-green-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email подтвержден</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Дата регистрации</p>
                <p className="font-medium text-foreground">{formatDate(userProfile?.registrationDate || user.metadata.creationTime)}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Город</p>
                <p className="font-medium text-foreground">{userProfile?.city || "Ирбит"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">Последний визит</p>
                <p className="font-medium text-foreground">{formatDateTime(userProfile?.lastSignInTime || user.metadata.lastSignInTime)}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent"/> О себе
              </h3>
              {isLoadingProfile ? (
                <div className="animate-pulse h-24 bg-muted/40 rounded-md"></div>
              ) : userProfile?.aboutMe ? (
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line rounded-md">
                  {userProfile.aboutMe}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-2">
                  Информация о себе еще не добавлена. Нажмите "Редактировать профиль", чтобы заполнить.
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-accent"/> Специализации
              </h3>
              {isLoadingProfile ? (
                <div className="animate-pulse h-10 bg-muted/40 rounded-md"></div>
              ) : userProfile?.specializations && userProfile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2 py-1">
                  {userProfile.specializations.map(spec => (
                    <Badge key={spec} className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-2">
                  Специализации еще не выбраны. Нажмите "Редактировать профиль", чтобы их добавить.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- Статистика в сайдбаре --- */}
        <Card className="md:col-span-1 shadow-lg bg-card/90 backdrop-blur-sm h-fit border border-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-accent"/> Статистика
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/40 transition-colors border border-accent/5">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">Заданий создано</p>
                <ClipboardList className="h-5 w-5 text-accent/80" />
              </div>
              <p className="text-3xl font-bold text-accent mt-1">{userProfile?.tasksCreated || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/40 transition-colors border border-accent/5">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">Заданий выполнено</p>
                <ClipboardCheck className="h-5 w-5 text-accent/80" />
              </div>
              <p className="text-3xl font-bold text-accent mt-1">{userProfile?.tasksCompleted || 0}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/40 transition-colors border border-accent/5">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">Рейтинг</p>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-accent">
                  {userProfile?.averageRating?.toFixed(1) || "–"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.reviewsCount || 0} отзывов
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Отзывы --- */}
      <Card className="shadow-lg bg-card/90 backdrop-blur-sm border border-accent/10">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <Star className="h-5 w-5 mr-2 text-accent"/> Рейтинг и Отзывы
            </CardTitle>
            <div className="flex items-baseline text-sm">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="font-semibold text-lg text-foreground">
                {userProfile?.averageRating?.toFixed(1) || "Н/Д"}
              </span>
              <span className="text-muted-foreground ml-1">
                ({userProfile?.reviewsCount || 0} отзывов)
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {placeholderReviews.length > 0 ? (
            <div className="space-y-4">
              {placeholderReviews.map((review) => (
                <Card key={review.id} className="p-4 bg-muted/20 rounded-lg shadow-sm overflow-hidden border border-border/30">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={review.reviewerPhotoURL || undefined} alt={review.reviewerName} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-medium">{review.reviewerName}</h4>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400' : 'fill-muted stroke-yellow-500/50'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.taskTitle && (
                        <Badge variant="outline" className="mt-1 mb-1 bg-background/50">
                          {review.taskTitle}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mb-1">{review.createdAt}</p>
                      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">Отзывов пока нет</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}