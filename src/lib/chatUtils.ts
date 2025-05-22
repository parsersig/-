// src/lib/chatUtils.ts
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, type Firestore } from "firebase/firestore";
import type { NextRouter } from 'next/navigation'; // Correct import for App Router
import type { ChatData } from '@/lib/schemas';
import type { ToastProps } from '@/components/ui/use-toast'; // Assuming this path is correct

interface InitiateChatParams {
  currentUser: FirebaseUser;
  otherUserId: string;
  otherUserName: string | null;
  otherUserPhotoURL: string | null;
  firestore: Firestore;
  router: NextRouter;
  toast: ({ ...props }: ToastProps) => void; // Adjusted based on typical useToast structure
  taskInfo?: {
    taskId: string;
    taskTitle: string;
  };
}

export const initiateChat = async ({
  currentUser,
  otherUserId,
  otherUserName,
  otherUserPhotoURL,
  firestore,
  router,
  toast,
  taskInfo,
}: InitiateChatParams): Promise<void> => {
  if (!currentUser) {
    toast({ title: "Ошибка", description: "Пользователь не аутентифицирован.", variant: "destructive" });
    return;
  }
  if (currentUser.uid === otherUserId) {
    toast({ title: "Действие невозможно", description: "Вы не можете начать чат с самим собой.", variant: "default" });
    return;
  }

  const participantsArray = [currentUser.uid, otherUserId].sort();
  const generatedChatId = participantsArray.join('_');

  try {
    const chatRef = doc(firestore, "chats", generatedChatId);
    const chatSnap = await getDoc(chatRef);

    let chatExists = chatSnap.exists();
    let existingTaskAssociationMatches = true;

    if (chatExists) {
        const chatData = chatSnap.data() as ChatData;
        // Если чат существует, проверяем, связан ли он с тем же заданием (если taskInfo предоставлено)
        if (taskInfo && (chatData.taskId !== taskInfo.taskId || chatData.taskTitle !== taskInfo.taskTitle)) {
            // Чат существует, но для другого задания. Для простоты, мы можем решить перезаписать taskId/taskTitle
            // или создать новый чат с более специфичным ID (например, participantsArray.join('_') + `_task_${taskInfo.taskId}`)
            // Текущая логика (если chatSnap.exists() то ничего не делаем) подразумевает один чат между двумя пользователями,
            // который может быть связан с последним заданием, по которому инициировали чат, или вообще не связан.
            // Для перезаписи:
            // await updateDoc(chatRef, { taskId: taskInfo.taskId, taskTitle: taskInfo.taskTitle });
            // console.log("Chat updated with new task info:", generatedChatId);
            // Либо, если мы хотим отдельные чаты для каждого задания, ID чата должен включать ID задания.
            // В данном случае, мы просто переходим в существующий чат. Если он был по другому заданию, он не обновится тут.
            // Это поведение можно изменить, если бизнес-логика требует иного.
        }
    } else {
        // Чат не существует, создаем новый
        const newChatData: Omit<ChatData, 'id'> = { // Omit 'id' as it's the document name
            participants: participantsArray,
            participantNames: {
                [currentUser.uid]: currentUser.displayName || "Пользователь",
                [otherUserId]: otherUserName || "Собеседник",
            },
            participantPhotoURLs: {
                [currentUser.uid]: currentUser.photoURL || null,
                [otherUserId]: otherUserPhotoURL || null,
            },
            lastMessageText: "",
            lastMessageAt: null, 
            createdAt: serverTimestamp() as Timestamp,
            // Опционально добавляем информацию о задании
            ...(taskInfo && { taskId: taskInfo.taskId, taskTitle: taskInfo.taskTitle }),
        };
        await setDoc(chatRef, newChatData);
        console.log("New chat created with ID:", generatedChatId);
    }
    
    // Переход к странице сообщений с ID чата
    router.push(`/messages?chatId=${generatedChatId}`);

  } catch (error: any) {
    console.error("Error initiating chat:", error);
    toast({
      title: "Ошибка чата",
      description: `Не удалось начать или открыть чат: ${error.message || 'Неизвестная ошибка'}`,
      variant: "destructive",
    });
  }
};
