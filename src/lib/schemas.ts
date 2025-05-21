
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export const taskCategories = [
  "Ремонт и строительство",
  "Уборка и помощь по хозяйству",
  "Курьерские услуги",
  "Компьютерная помощь",
  "Репетиторство и обучение",
  "Красота и здоровье",
  "Мероприятия и промоакции",
  "Фото и видеосъемка",
  "Дизайн и графика",
  "Разработка и IT",
  "Перевозки и грузчики",
  "Юридическая помощь",
  "Бухгалтерские услуги",
  "Уход за животными",
  "Другое"
] as const;

export const taskSchema = z.object({
  title: z.string()
    .min(5, { message: "Название задания должно содержать минимум 5 символов." })
    .max(100, { message: "Название задания не должно превышать 100 символов." }),
  description: z.string()
    .min(20, { message: "Описание должно содержать минимум 20 символов." })
    .max(2000, { message: "Описание не должно превышать 2000 символов." }),
  category: z.enum(taskCategories, {
    errorMap: () => ({ message: "Пожалуйста, выберите категорию." })
  }),
  budget: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const num = parseFloat(String(val));
      return isNaN(num) ? val : num;
    },
    z.number({ invalid_type_error: "Бюджет должен быть числом." })
      .positive({ message: "Бюджет должен быть положительным числом." })
      .optional()
  ),
  isNegotiable: z.boolean().default(false),
  contactInfo: z.string()
    .min(5, { message: "Укажите контактную информацию (например, телефон или Telegram)." })
    .max(150, { message: "Контактная информация не должна превышать 150 символов." }),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

// Тип для задач, хранящихся в Firestore и отображаемых
export interface StoredTask extends TaskFormValues {
  id: string;
  postedDate: string; 
  firestorePostedDate?: Timestamp; 
  city: string;
  views: number;
  userId?: string; // ID пользователя, создавшего задание
}

// Схема для отклика на задание
export const responseSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskCategory: z.enum(taskCategories),
  taskOwnerId: z.string(), 
  responderId: z.string(), 
  responderName: z.string().nullable().optional(),
  responderPhotoURL: z.string().url().nullable().optional(),
});

export type ResponseData = z.infer<typeof responseSchema> & {
  id: string;
  respondedAt: string; 
  firestoreRespondedAt?: Timestamp; 
};

// Схема для уведомлений
export const notificationSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  message: z.string(),
  // createdAt будет добавляться как serverTimestamp()
});

export type NotificationData = z.infer<typeof notificationSchema> & {
  id: string;
  createdAt: string; // Уже сконвертированная строка для отображения
  firestoreCreatedAt?: Timestamp; // Оригинальный Timestamp из Firestore
};
