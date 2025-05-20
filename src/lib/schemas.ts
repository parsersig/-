import { z } from 'zod';

export const messageFormSchema = z.object({
  targetBotUsername: z.string()
    .min(1, { message: "Имя пользователя бота обязательно." })
    .regex(/^@.+/, { message: "Имя пользователя должно начинаться с @ и содержать символы после него." })
    .max(100, { message: "Имя пользователя слишком длинное." }),
  messageContent: z.string()
    .min(1, { message: "Сообщение не может быть пустым." })
    .max(4096, { message: "Сообщение слишком длинное (макс. 4096 символов)." }),
});

export type MessageFormValues = z.infer<typeof messageFormSchema>;
