// src/app/messages/page.tsx
"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Loader2, Briefcase, Tag, DollarSign, LinkIcon, AlertTriangle, ArrowLeft, Sparkles } from "lucide-react"; // Added Sparkles
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  collection, query, where, orderBy, onSnapshot, Timestamp,
  doc, addDoc, serverTimestamp, updateDoc,
  type Firestore, type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData
} from "firebase/firestore";
import type { ChatData, MessageData } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import Link from 'next/link'; 
import { useToast } from '@/hooks/use-toast';

const formatChatTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'только что';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`;
  if (diffInSeconds < 86400) { 
    if (date.getDate() === now.getDate()) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffInSeconds < 604800) { 
     const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
     return days[date.getDay()];
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatMessageTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

interface SelectedChatDetails {
  id: string;
  partner?: {
    id: string;
    name: string;
    photoURL: string | null;
  };
  taskTitle?: string;
  taskId?: string;
}

const MessageSkeleton = ({ isOwn }: { isOwn: boolean }) => (
  <div className={cn("flex w-full mb-3", isOwn ? "justify-end" : "justify-start")}>
    <div className={cn("max-w-[70%] flex items-end space-x-2", isOwn && "flex-row-reverse space-x-reverse")}>
      <Skeleton className={cn("p-2.5 px-3.5 rounded-2xl h-16", isOwn ? "w-48" : "w-40")} />
    </div>
  </div>
);

export default function MessagesPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  
  const [selectedChatDetails, setSelectedChatDetails] = useState<SelectedChatDetails | null>(null);
  const [currentMessages, setCurrentMessages] = useState<MessageData[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isMessageViewActiveMobile, setIsMessageViewActiveMobile] = useState(false);

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

  useEffect(() => {
    if (!currentUser || !db) {
      setChats([]);
      setIsLoadingChats(false);
      if (!currentUser && !isLoadingAuth) {
          setChatsError("Пожалуйста, войдите, чтобы увидеть чаты.");
      }
      return;
    }
    setIsLoadingChats(true);
    setChatsError(null);
    const firestore = db as Firestore;
    const chatsCollectionRef = collection(firestore, "chats");
    const q = query(
      chatsCollectionRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsubscribeChats = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedChats: ChatData[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        lastMessageAt: docSnap.data().lastMessageAt as Timestamp | null,
        createdAt: docSnap.data().createdAt as Timestamp,
      } as ChatData));
      setChats(fetchedChats);
      setIsLoadingChats(false);
    }, (error) => {
      console.error("Error fetching user chats:", error);
      setChatsError("Не удалось загрузить чаты. Попробуйте позже.");
      setIsLoadingChats(false);
    });
    return () => unsubscribeChats();
  }, [currentUser, isLoadingAuth]);

  const handleSelectChat = useCallback((chat: ChatData) => {
    if (!currentUser || !chat.id) return;
    setMessagesError(null); 
    
    const partnerId = chat.participants.find(pId => pId !== currentUser.uid);
    const partnerDetails = partnerId ? {
      id: partnerId,
      name: chat.participantNames[partnerId] || 'Собеседник',
      photoURL: chat.participantPhotoURLs[partnerId] || null,
    } : undefined;

    setSelectedChatDetails({
      id: chat.id,
      partner: partnerDetails,
      taskTitle: chat.taskTitle,
      taskId: chat.taskId,
    });
    setIsMessageViewActiveMobile(true); // Activate message view on mobile
  }, [currentUser]);

  const handleBackToChatList = () => {
    setIsMessageViewActiveMobile(false);
    setSelectedChatDetails(null); 
  };

  useEffect(() => {
    if (!selectedChatDetails?.id || !db) {
      setCurrentMessages([]);
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(true);
    setMessagesError(null);
    const firestore = db as Firestore;
    const messagesCollectionRef = collection(firestore, "chats", selectedChatDetails.id, "messages");
    const q = query(messagesCollectionRef, orderBy("sentAt", "asc"));
    const unsubscribeMessages = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedMessages: MessageData[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        sentAt: docSnap.data().sentAt as Timestamp,
        type: docSnap.data().type || 'text',
      } as MessageData));
      setCurrentMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setMessagesError("Не удалось загрузить сообщения. Попробуйте позже.");
      setIsLoadingMessages(false);
    });
    return () => unsubscribeMessages();
  }, [selectedChatDetails?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedText = newMessageText.trim();
    if (!trimmedText || !currentUser || !selectedChatDetails?.id || !db) return;

    setIsSendingMessage(true);
    try {
      const firestore = db as Firestore;
      const messagesCollectionRef = collection(firestore, "chats", selectedChatDetails.id, "messages");
      await addDoc(messagesCollectionRef, {
        senderId: currentUser.uid,
        text: trimmedText,
        sentAt: serverTimestamp(),
        type: 'text',
      });
      const chatDocRef = doc(firestore, "chats", selectedChatDetails.id);
      await updateDoc(chatDocRef, {
        lastMessageText: trimmedText,
        lastMessageAt: serverTimestamp(),
      });
      setNewMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Ошибка отправки",
        description: "Сообщение не отправлено. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleQuickResponseClick = () => {
    toast({
      title: "Скоро!",
      description: "Функция быстрых ответов будет доступна здесь.",
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <p className="ml-3 text-muted-foreground mt-2">Проверка аутентификации...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
         <Card className="shadow-xl bg-card/70 backdrop-blur-sm p-6 sm:p-8">
          <CardHeader><div className="flex flex-col items-center space-y-3"><MessageSquare className="h-12 w-12 text-accent" /><CardTitle className="text-2xl sm:text-3xl font-bold">Мои Сообщения</CardTitle></div></CardHeader>
          <CardContent><p className="text-muted-foreground mb-6">Пожалуйста, войдите в систему, чтобы просматривать ваши сообщения.</p><Button size="lg" asChild className="hover-scale"><Link href="/">На главную</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  const commonButtonDisabled = !selectedChatDetails || isSendingMessage || !!messagesError;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      <Card className="flex-grow flex shadow-xl bg-card/70 backdrop-blur-sm overflow-hidden">
        {/* Chat List Pane */}
        <div className={cn(
          "border-r border-border flex-col",
          isMessageViewActiveMobile ? "hidden md:flex md:w-1/3" : "flex w-full md:w-1/3"
        )}>
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-accent" />
                Чаты
              </CardTitle>
            </div>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="p-0">
              {isLoadingChats && (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin inline-block mr-2"/> Загрузка чатов...
                </div>
              )}
              {chatsError && !isLoadingChats && (
                <div className="p-4 text-center text-destructive">
                  <AlertTriangle className="h-6 w-6 inline-block mr-2 mb-1"/> {chatsError}
                </div>
              )}
              {!isLoadingChats && !chatsError && chats.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">У вас пока нет активных чатов.</p>
              )}
              {!isLoadingChats && !chatsError && chats.map((chat) => {
                const partnerId = chat.participants.find(pId => pId !== currentUser.uid);
                const partnerName = partnerId ? chat.participantNames[partnerId] || "Собеседник" : "Чат";
                const partnerPhotoURL = partnerId ? chat.participantPhotoURLs[partnerId] : null;
                const lastMessageTime = formatChatTimestamp(chat.lastMessageAt);
                const isSelected = selectedChatDetails?.id === chat.id;

                return (
                  <div key={chat.id} className={cn("flex items-start p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors", isSelected && !isMessageViewActiveMobile && "bg-accent/10" )} onClick={() => handleSelectChat(chat)}>
                    <Avatar className="h-10 w-10 mr-3 mt-1 flex-shrink-0"><AvatarImage src={partnerPhotoURL || undefined} alt={partnerName} /><AvatarFallback className="bg-muted">{partnerName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5"><p className={cn("font-semibold text-sm truncate text-foreground/90", !isSelected && "font-bold")}>{partnerName}</p>{chat.lastMessageAt && <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{lastMessageTime}</p>}</div>
                      {chat.taskTitle && (<div className="flex items-center text-xs text-muted-foreground mt-0.5"><Briefcase className="h-3 w-3 mr-1.5 flex-shrink-0" /><p className="truncate font-medium text-foreground/80">{chat.taskTitle}</p></div>)}
                      <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-1 space-x-2">
                        {chat.taskStatus && (<div className="flex items-center"><Tag className="h-3 w-3 mr-1 flex-shrink-0" /><span>{chat.taskStatus}</span></div>)}
                        {chat.taskPrice !== undefined && chat.taskPrice !== null && (<div className="flex items-center"><DollarSign className="h-3 w-3 mr-1 flex-shrink-0" /><span>{typeof chat.taskPrice === 'number' ? `${chat.taskPrice.toLocaleString('ru-RU')} ₽` : chat.taskPrice || "N/A"}</span></div>)}
                      </div>
                      <p className={cn("text-xs text-muted-foreground truncate mt-1",!isSelected && chat.lastMessageText && "font-semibold text-foreground/70")}>{chat.lastMessageText || (chat.taskId && !chat.taskTitle ? `Чат по заданию` : 'Нет сообщений')}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </ScrollArea>
        </div>

        {/* Message View Pane */}
        <div className={cn(
          "flex-col bg-background/30",
          isMessageViewActiveMobile ? "flex w-full" : "hidden md:flex md:w-2/3"
        )}>
          {!selectedChatDetails && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">Выберите чат, чтобы начать общение</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Ваши сообщения появятся здесь.</p>
            </div>
          )}
          {selectedChatDetails?.partner && (
            <>
              <CardHeader className="p-3 border-b bg-muted/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={handleBackToChatList}>
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Avatar className="h-10 w-10"><AvatarImage src={selectedChatDetails.partner.photoURL || undefined} alt={selectedChatDetails.partner.name} /><AvatarFallback className="bg-muted/70">{selectedChatDetails.partner.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-grow overflow-hidden">
                    <CardTitle className="text-base font-semibold truncate">{selectedChatDetails.partner.name}</CardTitle>
                    {selectedChatDetails.taskTitle && (
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Briefcase className="h-3 w-3 mr-1.5 flex-shrink-0 text-accent" />
                        {selectedChatDetails.taskId ? (
                          <Link href={`/tasks/${selectedChatDetails.taskId}`} className="truncate hover:underline text-accent font-medium" title={selectedChatDetails.taskTitle} target="_blank" rel="noopener noreferrer">
                            {selectedChatDetails.taskTitle}
                          </Link>
                        ) : (
                          <p className="truncate font-medium">{selectedChatDetails.taskTitle}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-grow bg-background/10">
                <div className="p-4 space-y-2">
                  {isLoadingMessages && (<><MessageSkeleton isOwn={false} /><MessageSkeleton isOwn={true} /><MessageSkeleton isOwn={false} /><MessageSkeleton isOwn={false} /></>)}
                  {messagesError && !isLoadingMessages && (<div className="flex flex-col items-center justify-center text-destructive text-center py-10"><AlertTriangle className="h-8 w-8 mb-2"/><p className="font-semibold">Ошибка загрузки сообщений</p><p className="text-sm">{messagesError}</p></div>)}
                  {!isLoadingMessages && !messagesError && currentMessages.length === 0 && (<div className="text-center text-sm text-muted-foreground py-10"><MessageSquare className="h-10 w-10 text-muted-foreground/70 mx-auto mb-2"/>Сообщений пока нет. <br/>Начните диалог!</div>)}
                  {!isLoadingMessages && !messagesError && currentMessages.map(msg => {
                    if (msg.type === 'system') {
                      return (<div key={msg.id} className="text-center text-xs text-muted-foreground italic my-3 py-1 px-3 bg-muted/50 rounded-full mx-auto max-w-xs sm:max-w-sm md:max-w-md">{msg.text} <span className="opacity-80 ml-1">{formatMessageTimestamp(msg.sentAt)}</span></div>);
                    }
                    return (
                      <div key={msg.id} className={cn("flex w-full", msg.senderId === currentUser?.uid ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] md:max-w-[70%] p-2.5 px-3.5 rounded-2xl shadow-md", msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-card text-card-foreground rounded-bl-lg")}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <p className={cn("text-[11px] mt-1 opacity-60", msg.senderId === currentUser?.uid ? "text-right" : "text-left")}>{formatMessageTimestamp(msg.sentAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <CardFooter className="p-3 border-t bg-muted/30 backdrop-blur-sm">
                <form className="flex w-full items-center space-x-2" onSubmit={handleSendMessage}>
                  <Input 
                    type="text" 
                    placeholder="Напишите сообщение..." 
                    className="flex-grow h-10 text-sm" 
                    value={newMessageText} 
                    onChange={(e) => setNewMessageText(e.target.value)} 
                    disabled={commonButtonDisabled}
                  />
                  <Button 
                    type="button" // Important: type="button" to prevent form submission
                    variant="outline" // Or other suitable variant
                    size="icon" 
                    className="h-10 w-10 flex-shrink-0" 
                    onClick={handleQuickResponseClick}
                    disabled={commonButtonDisabled}
                    title="Быстрые ответы (скоро)"
                  >
                    <Sparkles className="h-5 w-5" />
                  </Button>
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-10 w-10 flex-shrink-0" 
                    disabled={!newMessageText.trim() || commonButtonDisabled}
                    title="Отправить сообщение"
                  >
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
