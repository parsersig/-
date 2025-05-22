
// src/app/messages/page.tsx
"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, UserCircle, Send, Loader2, AlertCircle, Search } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  collection, query, where, orderBy, onSnapshot, Timestamp,
  doc, getDoc, addDoc, serverTimestamp, updateDoc,
  type Firestore, type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData, type Unsubscribe
} from "firebase/firestore";
import type { ChatData, MessageData } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Для ссылок в будущем

const formatChatTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'только что';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`;
  if (diffInSeconds < 86400) { // меньше дня
    if (date.getDate() === now.getDate()) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffInSeconds < 604800) { // меньше недели
     const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
     return days[date.getDay()];
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatMessageTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<{id: string, name: string, photoURL: string | null} | null>(null);
  const [currentMessages, setCurrentMessages] = useState<MessageData[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  // Загрузка списка чатов пользователя
  useEffect(() => {
    if (!currentUser || !db) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    setIsLoadingChats(true);
    const firestore = db as Firestore;
    const chatsCollectionRef = collection(firestore, "chats");
    const q = query(
      chatsCollectionRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribeChats = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedChats: ChatData[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        const chatItem: ChatData = {
          id: docSnap.id,
          participants: data.participants || [],
          participantNames: data.participantNames || {},
          participantPhotoURLs: data.participantPhotoURLs || {},
          lastMessageText: data.lastMessageText || '',
          lastMessageAt: data.lastMessageAt as Timestamp | null,
          createdAt: data.createdAt as Timestamp,
          taskId: data.taskId,
          taskTitle: data.taskTitle,
        };
        fetchedChats.push(chatItem);
      });
      setChats(fetchedChats);
      setIsLoadingChats(false);
    }, (error) => {
      console.error("Error fetching user chats:", error);
      // Можно добавить toast уведомление об ошибке
      setIsLoadingChats(false);
    });

    return () => unsubscribeChats();
  }, [currentUser]);

  const handleSelectChat = useCallback((chat: ChatData) => {
    if (!currentUser) return;
    setSelectedChatId(chat.id!);
    
    const partnerId = chat.participants.find(pId => pId !== currentUser.uid);
    if(partnerId) {
      setSelectedChatPartner({
        id: partnerId,
        name: chat.participantNames[partnerId] || 'Собеседник',
        photoURL: chat.participantPhotoURLs[partnerId] || null,
      });
    } else {
      setSelectedChatPartner(null);
    }
    // Загрузка сообщений для этого чата
  }, [currentUser]);

  // Effect to fetch messages for the selected chat
  useEffect(() => {
    if (!selectedChatId || !db) {
      setCurrentMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    const firestore = db as Firestore;
    const messagesCollectionRef = collection(firestore, "chats", selectedChatId, "messages");
    const q = query(messagesCollectionRef, orderBy("sentAt", "asc"));

    const unsubscribeMessages = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedMessages: MessageData[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        fetchedMessages.push({
          id: docSnap.id,
          senderId: data.senderId,
          text: data.text,
          sentAt: data.sentAt as Timestamp,
          type: data.type || 'text', // Assuming default type is 'text'
        });
      });
      setCurrentMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoadingMessages(false);
      // Optionally, set an error state to display to the user
    });

    return () => unsubscribeMessages();
  }, [selectedChatId]);

  // Effect for auto-scrolling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedText = newMessageText.trim();

    if (!trimmedText) {
      return;
    }

    if (!currentUser || !selectedChatId || !db) {
      console.error("Cannot send message: User, selected chat, or DB is not available.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const firestore = db as Firestore;
      // Add message to subcollection
      const messagesCollectionRef = collection(firestore, "chats", selectedChatId, "messages");
      await addDoc(messagesCollectionRef, {
        senderId: currentUser.uid,
        text: trimmedText,
        sentAt: serverTimestamp(),
        type: 'text',
      });

      // Update parent chat document
      const chatDocRef = doc(firestore, "chats", selectedChatId);
      await updateDoc(chatDocRef, {
        lastMessageText: trimmedText,
        lastMessageAt: serverTimestamp(),
      });

      setNewMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      // Here you could add a toast notification to the user
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <p className="ml-3 text-muted-foreground">Проверка аутентификации...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
         <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8">
          <CardHeader>
            <div className="flex flex-col items-center space-y-3">
              <MessageSquare className="h-12 w-12 text-accent" />
              <CardTitle className="text-2xl sm:text-3xl font-bold">Мои Сообщения</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Пожалуйста, войдите в систему, чтобы просматривать ваши сообщения.</p>
            <Button size="lg" asChild className="hover-scale">
                <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      <Card className="flex-grow flex shadow-xl bg-card/70 backdrop-blur-sm overflow-hidden">
        {/* Левая колонка: Список чатов */}
        <div className="w-full sm:w-1/3 border-r border-border flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-accent" />
                Чаты
              </CardTitle>
              {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Search className="h-5 w-5" />
              </Button> */}
            </div>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="p-0">
              {isLoadingChats && (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin inline-block mr-2"/> Загрузка чатов...
                </div>
              )}
              {!isLoadingChats && chats.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">У вас пока нет активных чатов.</p>
              )}
              {!isLoadingChats && chats.map((chat) => {
                const partnerId = chat.participants.find(pId => pId !== currentUser.uid);
                const partnerName = partnerId ? chat.participantNames[partnerId] || "Собеседник" : "Чат";
                const partnerPhotoURL = partnerId ? chat.participantPhotoURLs[partnerId] : null;
                const lastMessageTime = formatChatTimestamp(chat.lastMessageAt);

                return (
                  <div
                    key={chat.id}
                    className={cn(
                      "flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors",
                      selectedChatId === chat.id && "bg-accent/10"
                    )}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={partnerPhotoURL || undefined} alt={partnerName} />
                      <AvatarFallback className="bg-muted">
                        {partnerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm truncate text-foreground/90">{partnerName}</p>
                        {chat.lastMessageAt && <p className="text-xs text-muted-foreground whitespace-nowrap">{lastMessageTime}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessageText || (chat.taskId ? `Чат по заданию: ${chat.taskTitle || 'Без названия'}`: 'Нет сообщений')}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </ScrollArea>
        </div>

        {/* Правая колонка: Окно чата */}
        <div className="w-full sm:w-2/3 flex flex-col bg-background/30">
          {!selectedChatId && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">Выберите чат, чтобы начать общение</p>
              <p className="text-sm text-muted-foreground mt-1">Или найдите задание и напишите заказчику/исполнителю.</p>
            </div>
          )}
          {selectedChatId && selectedChatPartner && (
            <>
              <CardHeader className="p-4 border-b bg-muted/20 flex-row items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChatPartner.photoURL || undefined} alt={selectedChatPartner.name} />
                  <AvatarFallback className="bg-muted/70">{selectedChatPartner.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg font-semibold">{selectedChatPartner.name}</CardTitle>
                    {/* <CardDescription className="text-xs text-green-500">Онлайн</CardDescription> */}
                </div>
              </CardHeader>
              <ScrollArea className="flex-grow bg-background/10">
                <div className="p-4 space-y-4">
                  {isLoadingMessages && (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mr-2"/>
                      <p className="text-muted-foreground">Загрузка сообщений...</p>
                    </div>
                  )}
                  {!isLoadingMessages && currentMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">
                      Сообщений пока нет. Начните диалог!
                    </p>
                  )}
                  {!isLoadingMessages && currentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] p-3 rounded-lg shadow-sm", // Increased padding
                        msg.senderId === currentUser?.uid
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-card text-card-foreground rounded-bl-none"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <p className={cn(
                          "text-xs mt-1 opacity-70", // Adjusted opacity for subtlety
                          msg.senderId === currentUser?.uid ? "text-right" : "text-left"
                        )}>
                          {formatMessageTimestamp(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <CardFooter className="p-3 border-t bg-muted/20">
                <form className="flex w-full items-center space-x-2" onSubmit={handleSendMessage}>
                  <Input
                    type="text"
                    placeholder="Напишите сообщение..."
                    className="flex-grow h-10 text-sm"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={isSendingMessage}
                  />
                  <Button type="submit" size="icon" className="h-10 w-10" disabled={!newMessageText.trim() || isSendingMessage}>
                    {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </CardFooter>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
