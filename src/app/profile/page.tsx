// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"; // Removed DialogClose as it's not explicitly used for submission
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2, MessageCircle } from "lucide-react"; // Added MessageCircle for consistency if needed later
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, DocumentSnapshot, Timestamp } from "firebase/firestore"; // Added setDoc
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


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Заглушки для статистики и отзывов
  const placeholderReviews: ReviewData[] = [
    {
      id: '1',
      reviewerId: 'guest1',
      reviewerName: 'Елена П.',
      reviewerPhotoURL: 'https://placehold.co/40x40.png',
      reviewedUserId: user?.uid || 'current_user',
      rating: 5,
      comment: 'Отличный исполнитель! Все сделал быстро и качественно. Рекомендую!',
      createdAt: formatDate(new Date(2024, 4, 15)), 
      taskTitle: 'Ремонт ванной комнаты'
    },
    {
      id: '2',
      reviewerId: 'guest2',
      reviewerName: 'Алексей С.',
      reviewerPhotoURL: 'https://placehold.co/40x40.png',
      reviewedUserId: user?.uid || 'current_user',
      rating: 4,
      comment: 'Работа выполнена хорошо, но немного задержали по срокам. В целом доволен.',
      createdAt: formatDate(new Date(2024, 3, 20)),
      taskTitle: 'Разработка логотипа'
    }
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
        console.log("No user profile found for UID:", currentUser.uid, "Attempting to create one.");
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
            // другие поля можно инициализировать по умолчанию или оставить undefined
        };
        await setDoc(doc(db, "userProfiles", currentUser.uid), newProfileData); // Corrected: Use setDoc properly
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
            ...updatedData, // Apply updates from the form
        };
    });
    setIsEditDialogOpen(false);
  };

  if (isLoadingAuth || (user && isLoadingProfile && userProfile === undefined)) { // Check if userProfile is undefined instead of null for initial loading
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
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-10">
      {/* --- Hero Section --- */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="relative p-0">
          <div className="h-32 sm:h-40 bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30"></div>
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 flex flex-col items-center w-full px-4">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background bg-background shadow-lg">
              <AvatarImage src={displayPhotoURL} alt={displayDisplayName} data-ai-hint="user avatar large" />
              <AvatarFallback className="text-4xl sm:text-5xl bg-muted">
                {displayDisplayName ? displayDisplayName.charAt(0).toUpperCase() : <UserCircle className="h-16 w-16"/>}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-3">{displayDisplayName}</CardTitle>
            <CardDescription className="text-sm sm:text-md text-muted-foreground pt-0.5">
              {userProfile?.city || "Ирбит"} {userProfile?.age && `• ${userProfile.age} лет (заглушка)`}
            </CardDescription>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              <Badge variant="outline" className="border-green-500/70 text-green-400">Исполнитель (статус)</Badge>
              <Badge variant="outline" className="border-blue-500/70 text-blue-400">Проверен</Badge>
            </div>
             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 hover-scale text-base py-3 px-6">
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
                    <EditProfileForm 
                        currentUser={user} 
                        initialProfileData={userProfile || { uid: user.uid } }
                        onProfileUpdated={handleProfileUpdateSuccess}
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                  </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-40 sm:pt-48 p-6 space-y-8"> 
          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><UserCircle className="h-6 w-6 mr-2.5 text-accent"/>Основная информация</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground pl-2">
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-accent/80 shrink-0" />Email: <span className="ml-1.5 font-medium text-foreground/90 truncate">{user.email || "Не указан"}</span> {user.emailVerified && <span title="Email подтвержден"><ShieldCheck className="h-4 w-4 ml-1.5 text-green-400 shrink-0" /></span>}</p>
                <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-accent/80 shrink-0" />Регистрация: <span className="ml-1.5 font-medium text-foreground/90">{formatDate(user.metadata.creationTime)}</span></p>
                <p className="flex items-center sm:col-span-2"><Clock className="h-4 w-4 mr-2 text-accent/80 shrink-0" />Последний визит: <span className="ml-1.5 font-medium text-foreground/90">{formatDateTime(user.metadata.lastSignInTime)}</span></p>
            </div>
          </section>
          
          <section className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><Briefcase className="h-6 w-6 mr-2.5 text-accent"/>О себе</h3>
            {isLoadingProfile && userProfile === undefined && <p className="text-sm text-muted-foreground italic">Загрузка информации...</p>}
            {!isLoadingProfile && userProfile?.aboutMe && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.aboutMe}</p>}
            {!isLoadingProfile && !userProfile?.aboutMe && <p className="text-sm text-muted-foreground italic">Информация о себе еще не добавлена. Нажмите "Редактировать профиль", чтобы ее заполнить.</p>}
          </section>

           <section className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации</h3>
            {isLoadingProfile && userProfile === undefined && <p className="text-sm text-muted-foreground italic">Загрузка специализаций...</p>}
            {!isLoadingProfile && userProfile?.specializations && userProfile.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.specializations.map(spec => <Badge key={spec} variant="secondary" className="bg-accent/10 text-accent border-accent/30">{spec}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Специализации еще не выбраны. Нажмите "Редактировать профиль", чтобы их добавить.</p>
            )}
          </section>
      
          <section className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Активность и Статистика (заглушка)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Card className="p-4 bg-muted/30 rounded-lg text-center shadow-sm">
                    <p className="text-3xl font-bold text-accent">{userProfile?.tasksCreated || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Заданий создано</p>
                </Card>
                <Card className="p-4 bg-muted/30 rounded-lg text-center shadow-sm">
                    <p className="text-3xl font-bold text-accent">{userProfile?.tasksCompleted || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Заданий выполнено</p>
                </Card>
                 <Card className="p-4 bg-muted/30 rounded-lg text-center shadow-sm sm:col-span-2 md:col-span-1">
                    <p className="text-3xl font-bold text-accent">{userProfile?.reviewsCount || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Отзывов получено</p>
                </Card>
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы</h3>
              <div className="flex items-baseline space-x-1 text-sm">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-lg text-foreground">{userProfile?.averageRating?.toFixed(1) || "Н/Д"}</span>
                  <span className="text-muted-foreground">({userProfile?.reviewsCount || 0} отзывов)</span>
              </div>
            </div>
            {/* TODO: Load and display actual reviews. For now, using placeholders. */}
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
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400' : 'fill-muted stroke-yellow-500/50'}`} />
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
                {/* <div className="text-center pt-2">
                  <Button variant="link" className="text-accent text-sm">Показать все отзывы (в разработке)</Button>
                </div> */}
              </div>
            ) : (
               <p className="text-sm text-muted-foreground italic text-center py-4">Отзывов пока нет.</p>
            )}
          </section>
        </CardContent>
        {/* Footer с кнопкой редактирования убран, т.к. кнопка теперь в CardHeader */}
      </Card>
    </div>
  );
}


    