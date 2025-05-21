
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { UserCircle, LogIn, Edit, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2, MessageCircle, ClipboardList, ClipboardCheck, Award, UserCheck as UserCheckIcon } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, DocumentSnapshot, Timestamp, collection, query, where, getDocs, orderBy, getCountFromServer } from "firebase/firestore";
import Link from "next/link";
import EditProfileForm from "@/components/profile/edit-profile-form";
import type { UserProfile, EditUserProfileFormValues, ReviewData } from "@/lib/schemas";

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Изначально true
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [tasksCreatedCount, setTasksCreatedCount] = useState(0);
  const [tasksCompletedCount, setTasksCompletedCount] = useState(0);
  const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  const placeholderReviews: ReviewData[] = [
    { id: 'review1', reviewedUserId: 'placeholder', reviewerId: 'rev1', reviewerName: 'Елена П.', rating: 5, comment: 'Отличный исполнитель! Все сделал быстро и качественно. Рекомендую!', createdAt: formatDate(new Date(2024, 4, 15)), taskTitle: 'Ремонт ванной комнаты' },
    { id: 'review2', reviewedUserId: 'placeholder', reviewerId: 'rev2', reviewerName: 'Алексей С.', rating: 4, comment: 'Работа выполнена хорошо, но немного задержали по срокам. В целом доволен.', createdAt: formatDate(new Date(2024, 3, 20)), taskTitle: 'Разработка логотипа' }
  ];


  const fetchUserProfileAndStats = useCallback(async (currentUser: User) => {
    if (!db || !currentUser?.uid) {
      setIsLoadingProfile(false);
      setIsLoadingStats(false);
      setIsLoadingReviews(false);
      return;
    }
    
    setIsLoadingProfile(true);
    setIsLoadingStats(true);
    setIsLoadingReviews(true);

    try {
      // 1. Fetch user profile
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef) as DocumentSnapshot<UserProfile>;
      let currentProfileData: UserProfile;

      if (profileSnap.exists()) {
        currentProfileData = profileSnap.data();
        setUserProfile(currentProfileData);
      } else {
        console.log("No user profile found for UID:", currentUser.uid, "Creating one now.");
        const newProfileData: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          displayName: currentUser.displayName || "Новый пользователь",
          photoURL: currentUser.photoURL || undefined,
          registrationDate: Timestamp.fromDate(new Date(currentUser.metadata.creationTime || Date.now())),
          lastSignInTime: Timestamp.fromDate(new Date(currentUser.metadata.lastSignInTime || Date.now())),
          city: "Ирбит",
          aboutMe: "",
          specializations: [],
          phoneVerified: false,
          tasksCreated: 0,
          tasksCompleted: 0,
          averageRating: null,
          reviewsCount: 0,
        };
        await setDoc(doc(db, "userProfiles", currentUser.uid), newProfileData);
        setUserProfile(newProfileData);
        currentProfileData = newProfileData; 
        console.log("New user profile created and set in state.");
      }
      setIsLoadingProfile(false);

      // 2. Fetch tasks stats
      const tasksCreatedQuery = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
      const tasksCreatedSnapshot = await getCountFromServer(tasksCreatedQuery);
      setTasksCreatedCount(tasksCreatedSnapshot.data().count);

      const tasksCompletedQuery = query(collection(db, "tasks"), where("userId", "==", currentUser.uid), where("status", "==", "completed"));
      const tasksCompletedSnapshot = await getCountFromServer(tasksCompletedQuery);
      setTasksCompletedCount(tasksCompletedSnapshot.data().count);
      setIsLoadingStats(false);

      // 3. Fetch user reviews and calculate average rating
      const reviewsQuery = query(collection(db, "reviews"), where("reviewedUserId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const fetchedReviews: ReviewData[] = [];
      let totalRating = 0;
      reviewsSnapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<ReviewData, 'id' | 'createdAt'> & { createdAt: Timestamp };
        fetchedReviews.push({
          id: docSnap.id,
          ...data,
          createdAt: formatDate(data.createdAt),
          firestoreCreatedAt: data.createdAt,
        });
        totalRating += data.rating;
      });
      setUserReviews(fetchedReviews);
      if (currentProfileData) { // Ensure currentProfileData is defined
        const newAverageRating = fetchedReviews.length > 0 ? totalRating / fetchedReviews.length : null;
        const newReviewsCount = fetchedReviews.length;
        
        setUserProfile(prev => prev ? ({
          ...prev,
          averageRating: newAverageRating,
          reviewsCount: newReviewsCount
        }) : prev);
        
        // Optionally update Firestore with new rating and count
        // This can also be done with a Cloud Function for better consistency
        // await updateDoc(profileRef, { averageRating: newAverageRating, reviewsCount: newReviewsCount });
      }
      setIsLoadingReviews(false);

    } catch (error: any) {
      console.error("Error fetching or creating user profile and stats:", error.message, error.stack, error.code);
      if (error.code === 'permission-denied') {
        console.error("Firestore permission denied. Check your security rules.");
      }
      setUserProfile(null); // Сбрасываем профиль в случае ошибки
      setIsLoadingProfile(false);
      setIsLoadingStats(false);
      setIsLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth instance is not available in ProfilePage.");
      setIsLoadingAuth(false);
      setIsLoadingProfile(false);
      setIsLoadingStats(false);
      setIsLoadingReviews(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (currentUserAuth) => {
      setUser(currentUserAuth);
      setIsLoadingAuth(false);
      if (currentUserAuth) {
        await fetchUserProfileAndStats(currentUserAuth);
      } else {
        setUserProfile(null);
        setTasksCreatedCount(0);
        setTasksCompletedCount(0);
        setUserReviews([]);
        setIsLoadingProfile(false);
        setIsLoadingStats(false);
        setIsLoadingReviews(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserProfileAndStats]);

  const handleProfileUpdateSuccess = (updatedData: EditUserProfileFormValues) => {
    setUserProfile(prev => {
      if (!prev && !user) return null; // Should not happen if user is logged in
      const baseProfile = prev || { 
        uid: user!.uid, 
        email: user!.email || undefined, 
        displayName: user!.displayName || "Пользователь",
        photoURL: user!.photoURL || undefined,
        registrationDate: user!.metadata.creationTime ? Timestamp.fromDate(new Date(user!.metadata.creationTime)) : undefined,
        lastSignInTime: user!.metadata.lastSignInTime ? Timestamp.fromDate(new Date(user!.metadata.lastSignInTime)) : undefined,
      };
      return {
        ...baseProfile,
        ...updatedData,
      } as UserProfile;
    });
    setIsEditDialogOpen(false);
  };

  if (isLoadingAuth || (user && (isLoadingProfile || isLoadingStats || isLoadingReviews))) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent animate-spin" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка данных профиля...</p>
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
  const registrationDateDisplay = user.metadata.creationTime ? formatDate(user.metadata.creationTime) : "Неизвестно";
  const lastSignInDateDisplay = user.metadata.lastSignInTime ? formatDateTime(user.metadata.lastSignInTime) : "Недавно";


  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 space-y-8">
      {/* --- Hero Section --- */}
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm border border-accent/10 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30 relative">
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary/30 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl"></div>
          </div>
        </div>
        <div className="relative px-4 sm:px-8 pb-6 -mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-background shadow-xl flex-shrink-0">
            <AvatarImage src={displayPhotoURL} alt={displayDisplayName} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-5xl sm:text-6xl bg-muted">
              {displayDisplayName ? displayDisplayName.charAt(0).toUpperCase() : <UserCircle className="h-20 w-20"/>}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold">{displayDisplayName}</h1>
            <p className="text-muted-foreground mt-0.5">
              {userProfile?.city || "Ирбит"}
              {userProfile?.age && ` • ${userProfile.age} лет (заглушка)`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400"><Award className="h-4 w-4 mr-1.5"/>Исполнитель</Badge>
                <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-400"><UserCheckIcon className="h-4 w-4 mr-1.5"/>Проверен</Badge>
            </div>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0 sm:ml-auto px-5 py-2.5 text-sm hover-scale">
                <Edit className="h-4 w-4 mr-2" /> Редактировать
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl">Редактирование профиля</DialogTitle>
                <DialogDescription>
                  Обновите информацию о себе и своих специализациях.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto pr-2 flex-grow py-2">
                {user && (
                    <EditProfileForm 
                        currentUser={user} 
                        initialProfileData={userProfile || { uid: user.uid } as UserProfile}
                        onProfileUpdated={handleProfileUpdateSuccess}
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* --- О себе --- */}
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border border-accent/10">
            <CardHeader><CardTitle className="text-xl flex items-center"><Briefcase className="h-5 w-5 mr-2 text-accent"/> О себе</CardTitle></CardHeader>
            <CardContent>
              {isLoadingProfile && <p className="text-sm text-muted-foreground">Загрузка...</p>}
              {!isLoadingProfile && userProfile?.aboutMe && <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.aboutMe}</p>}
              {!isLoadingProfile && !userProfile?.aboutMe && <p className="text-sm text-muted-foreground italic">Информация о себе еще не добавлена. Нажмите "Редактировать", чтобы заполнить.</p>}
            </CardContent>
          </Card>

          {/* --- Специализации --- */}
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border border-accent/10">
            <CardHeader><CardTitle className="text-xl flex items-center"><ListChecks className="h-5 w-5 mr-2 text-accent"/> Специализации</CardTitle></CardHeader>
            <CardContent>
              {isLoadingProfile && <p className="text-sm text-muted-foreground">Загрузка...</p>}
              {!isLoadingProfile && userProfile?.specializations && userProfile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userProfile.specializations.map(spec => <Badge key={spec} className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">{spec}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Специализации еще не выбраны. Нажмите "Редактировать", чтобы добавить.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Сайдбар: Информация и Статистика --- */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border border-accent/10">
            <CardHeader><CardTitle className="text-xl flex items-center"><UserCircle className="h-5 w-5 mr-2 text-accent"/> Информация</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center text-muted-foreground"><Mail className="h-4 w-4 mr-2 text-accent/80" />Email: <span className="ml-1 font-medium text-foreground/90">{user.email || "Не указан"}</span></p>
              <p className="flex items-center text-muted-foreground"><CalendarDays className="h-4 w-4 mr-2 text-accent/80" />На сайте с: <span className="ml-1 font-medium text-foreground/90">{registrationDateDisplay}</span></p>
              <p className="flex items-center text-muted-foreground"><Clock className="h-4 w-4 mr-2 text-accent/80" />Активность: <span className="ml-1 font-medium text-foreground/90">{lastSignInDateDisplay}</span></p>
              {user.emailVerified && (
                <p className="flex items-center text-green-400"><ShieldCheck className="h-4 w-4 mr-2" />Email подтвержден</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm border border-accent/10">
            <CardHeader><CardTitle className="text-xl flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-accent"/> Статистика</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoadingStats ? (
                <div className="flex justify-center py-3"><Loader2 className="h-6 w-6 animate-spin text-accent"/></div>
              ) : (
                <>
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md">
                    <span className="text-sm text-muted-foreground flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-accent/70"/>Заданий создано:</span>
                    <span className="text-lg font-bold text-accent">{tasksCreatedCount}</span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md">
                    <span className="text-sm text-muted-foreground flex items-center"><ClipboardCheck className="h-5 w-5 mr-2 text-accent/70"/>Заданий выполнено:</span>
                    <span className="text-lg font-bold text-accent">{tasksCompletedCount}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Отзывы о пользователе --- */}
      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border border-accent/10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl flex items-center mb-2 sm:mb-0"><Star className="h-5 w-5 mr-2 text-accent"/> Отзывы о пользователе</CardTitle>
            {!isLoadingReviews && userProfile && (
              <div className="flex items-baseline text-sm">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-semibold text-lg text-foreground">
                  {userProfile.averageRating ? userProfile.averageRating.toFixed(1) : "Нет"}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({userProfile.reviewsCount || 0} {userProfile.reviewsCount === 1 ? "отзыв" : userProfile.reviewsCount && userProfile.reviewsCount > 1 && userProfile.reviewsCount < 5 ? "отзыва" : "отзывов"})
                </span>
              </div>
            )}
          </div>
           {/* TODO: Фильтры для отзывов (пока без логики) */}
           <div className="mt-3 space-x-2">
                <Button variant="outline" size="sm" className="text-xs">Все ({userProfile?.reviewsCount || 0})</Button>
                <Button variant="outline" size="sm" className="text-xs">Положительные (заглушка)</Button>
                <Button variant="outline" size="sm" className="text-xs">Отрицательные (заглушка)</Button>
            </div>
        </CardHeader>
        <CardContent>
          {isLoadingReviews && (
            <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-accent"/> <p className="ml-2 text-muted-foreground">Загрузка отзывов...</p></div>
          )}
          {!isLoadingReviews && userReviews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50"/>
              <p>Отзывов об этом пользователе пока нет.</p>
            </div>
          )}
          {!isLoadingReviews && userReviews.length > 0 && (
            <div className="space-y-4">
              {userReviews.map((review) => (
                <Card key={review.id} className="p-4 bg-muted/30 rounded-lg shadow-sm overflow-hidden border border-border/30">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={review.reviewerPhotoURL || undefined} alt={review.reviewerName} data-ai-hint="user avatar small" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <h4 className="font-semibold text-foreground/95">{review.reviewerName}</h4>
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
                        <Link href={`/tasks/${review.taskId || ''}`} className="text-xs text-accent hover:underline">
                         По заданию: {review.taskTitle}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 sm:mt-0 mb-1.5">{formatDateTime(review.createdAt)}</p>
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

