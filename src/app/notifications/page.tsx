
// src/app/notifications/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bell, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { NotificationData } from "@/lib/schemas";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";

const formatDate = (date: any): string => {
  if (!date) return 'неизвестно';
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'неверный формат';
};


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.error("Firestore (db) is not initialized. Cannot fetch notifications.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: NotificationData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          ...data,
          createdAt: formatDate(data.createdAt),
          firestoreCreatedAt: data.createdAt,
        } as NotificationData);
      });
      setNotifications(fetchedNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      // Optionally show a toast to the user
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Уведомления</CardTitle>
          </div>
          <CardDescription>
            Здесь отображаются последние опубликованные задания.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 text-accent animate-spin mr-3" />
              <p className="text-muted-foreground text-lg">Загрузка уведомлений...</p>
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="text-muted-foreground text-center py-10 text-lg">Новых уведомлений пока нет.</p>
          )}
          {!isLoading && notifications.length > 0 && (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="bg-muted/30 hover-lift">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg leading-tight">{notification.message}</CardTitle>
                  </CardHeader>
                  <CardFooter className="text-xs text-muted-foreground flex justify-between items-center pt-2 pb-3 px-4">
                    <span>{notification.createdAt}</span>
                    <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 h-auto hover-scale">
                      <Link href={`/tasks/${notification.taskId}`}>
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        К заданию
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
