import { z } from 'zod';

export const messageFormSchema = z.object({
  targetBotUsername: z.string()
    .min(1, { message: "ID чата или имя пользователя (напр. @channelname) обязательно." })
    .max(100, { message: "ID чата / имя пользователя слишком длинное." }),
  messageContent: z.string()
    .min(1, { message: "Сообщение не может быть пустым." })
    .max(4096, { message: "Сообщение слишком длинное (макс. 4096 символов)." }), // Telegram message limit
});

export type MessageFormValues = z.infer<typeof messageFormSchema>;
