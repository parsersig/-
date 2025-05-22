// src/app/profile/[id]/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Mail, ShieldCheck, CalendarDays, Briefcase, Star, TrendingUp, Clock, ListChecks, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { UserProfile, ReviewData } from "@/lib/schemas"; // Removed ChatData as it's handled by chatUtils
import { useToast } from '@/hooks/use-toast';
import type { Firestore } from "firebase/firestore";
import { initiateChat } from '@/lib/chatUtils'; // Added import


// Вспомогательные функции для форматирования дат
const formatDate = (dateSource: Timestamp | Date | string | undefined): string => {
  if (!dateSource) return "Неизвестно";
  let date: Date;
  if (dateSource instanceof Timestamp) {
    date = dateSource.toDate();
  } else if (dateSource instanceof Date) {
    date = dateSource;
  } else {
    date = new Date(dateSource);
  }
  if (isNaN(date.getTime())) return "Некорректная дата";
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const profileUserId = params.id as string;

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);


  useEffect(() => {
    if (!auth) {
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchUserProfileAndData = useCallback(async (userId: string) => {
    if (!db || !userId) return;

    setIsLoadingProfile(true);
    setIsLoadingReviews(true);
    setProfileError(null);

    try {
      // 1. Загрузка профиля пользователя
      const profileRef = doc(db as Firestore, "userProfiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as Omit<UserProfile, 'uid'>;
        const registrationDate = profileData.registrationDate instanceof Timestamp 
            ? profileData.registrationDate 
            : profileData.registrationDate ? Timestamp.fromDate(new Date(profileData.registrationDate as any)) : undefined;
        
        setUserProfile({ 
            uid: userId, 
            ...profileData,
            registrationDate: registrationDate
        });
      } else {
        setProfileError("Профиль пользователя не найден.");
        setUserProfile(null);
      }
      setIsLoadingProfile(false);

      // 2. Загрузка отзывов о пользователе
      const reviewsQuery = query(collection(db as Firestore, "reviews"), where("reviewedUserId", "==", userId), orderBy("createdAt", "desc"));
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
      console.error("Error fetching user profile or reviews:", error);
      setProfileError("Не удалось загрузить данные профиля. Попробуйте обновить страницу.");
      setUserProfile(null);
      setIsLoadingProfile(false);
      setIsLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (profileUserId) {
      fetchUserProfileAndData(profileUserId);
    }
  }, [profileUserId, fetchUserProfileAndData]);

  // The local handleInitiateChat function was removed in a previous step.
  // The onClick handler for "Написать сообщение" button directly calls the imported `initiateChat` utility.

  if (isLoadingAuth || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent animate-spin" />
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Ошибка</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">{profileError}</p>
        <Button asChild className="mt-6 hover-scale text-base sm:text-lg px-6 py-3">
          <Link href="/tasks">Вернуться к заданиям</Link>
        </Button>
      </div>
    );
  }
  
  if (!userProfile) { 
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-destructive mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Профиль не найден</h1>
         <Button asChild className="mt-6 hover-scale text-base sm:text-lg px-6 py-3">
          <Link href="/tasks">Вернуться к заданиям</Link>
        </Button>
      </div>
    );
  }

  const displayName = userProfile.displayName || "Пользователь";
  const photoURL = userProfile.photoURL || undefined;
  const registrationDateDisplay = userProfile.registrationDate 
    ? formatDate(userProfile.registrationDate)
    : "Неизвестно";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 p-2 sm:p-4">
      {/* Верхний блок профиля */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-accent shadow-lg">
            <AvatarImage src={photoURL} alt={displayName} />
            <AvatarFallback className="text-5xl sm:text-6xl bg-muted/50">
              {displayName ? displayName.charAt(0).toUpperCase() : <UserCircle className="h-20 w-20"/>}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <CardTitle className="text-3xl sm:text-4xl font-bold mb-1">{displayName}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mb-3">{userProfile.city || "Город не указан"} • {userProfile.age ? `${userProfile.age} лет` : "Возраст не указан"}</CardDescription> 
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              <Badge variant="secondary" className="text-sm py-1 px-3 bg-blue-600/20 text-blue-400 border-blue-500/40">Проверен (демо)</Badge>
            </div>
            {currentUser && currentUser.uid !== userProfile.uid && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto hover-scale" 
                  onClick={async () => {
                    if (!currentUser || !userProfile || !db) return;
                    setIsInitiatingChat(true);
                    await initiateChat({
                        currentUser,
                        otherUserId: userProfile.uid,
                        otherUserName: userProfile.displayName || null,
                        otherUserPhotoURL: userProfile.photoURL || null,
                        firestore: db as Firestore,
                        router,
                        toast,
                    });
                    setIsInitiatingChat(false);
                  }}
                  disabled={isInitiatingChat}
                >
                  {isInitiatingChat ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <MessageSquare className="h-5 w-5 mr-2" /> }
                  Написать сообщение
                </Button>
              </div>
            )}
             {!currentUser && (
                 <p className="text-sm text-muted-foreground mt-4">
                    <Link href="/auth" className="text-accent hover:underline">Войдите</Link>, чтобы написать сообщение этому пользователю.
                 </p>
             )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><UserCircle className="h-6 w-6 mr-2.5 text-accent"/>О пользователе</CardTitle>
            </CardHeader>
            <CardContent>
              {userProfile.aboutMe ? (
                 <p className="text-sm text-muted-foreground whitespace-pre-line">{userProfile.aboutMe}</p>
              ) : (
                 <p className="text-sm text-muted-foreground italic">Пользователь еще не добавил информацию о себе.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="h-6 w-6 mr-2.5 text-accent"/>Специализации</CardTitle>
            </CardHeader>
            <CardContent>
              {userProfile.specializations && userProfile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userProfile.specializations.map(spec => <Badge key={spec} variant="outline" className="text-sm">{spec}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Специализации не указаны.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6 sm:space-y-8">
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><TrendingUp className="h-6 w-6 mr-2.5 text-accent"/>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Заданий создано:</span>
                <span className="font-semibold text-lg text-accent">{userProfile.tasksCreated ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Заданий выполнено:</span>
                <span className="font-semibold text-lg text-accent">{userProfile.tasksCompleted ?? 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Clock className="h-6 w-6 mr-2.5 text-accent"/>Активность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center text-muted-foreground"><CalendarDays className="h-4 w-4 mr-2 text-accent/80" />Регистрация: <span className="ml-1 font-medium text-foreground/90">{registrationDateDisplay}</span></p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Star className="h-6 w-6 mr-2.5 text-accent"/>Рейтинг и Отзывы ({reviewsCount})</CardTitle>
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
            <p className="text-sm text-muted-foreground italic text-center py-4">Отзывов об этом пользователе пока нет.</p>
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
                        <Link href={`/profile/${review.reviewerId}`} className="font-semibold text-foreground/90 hover:underline">{review.reviewerName || "Аноним"}</Link>
                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt?.toDate?.())}</span>
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
