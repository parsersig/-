
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
  "Автосервис и ремонт авто", 
  "Пошив и ремонт одежды", 
  "Сад и огород", 
  "Няни и уход за детьми", 
  "Другое" 
] as const;

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

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

export interface StoredTask extends TaskFormValues {
  id: string;
  postedDate: string; // Уже отформатированная дата для отображения
  firestorePostedDate?: Timestamp; // Оригинальный Timestamp для сортировки
  city: string;
  views: number;
  userId?: string;
  status?: TaskStatus; // Новое поле для статуса задания
}

export const responseSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskCategory: z.enum(taskCategories),
  taskOwnerId: z.string(), 
  responderId: z.string(),
  responderName: z.string().nullable().optional(),
  responderPhotoURL: z.string().url().nullable().optional(),
  // respondedAt будет serverTimestamp
});

export type ResponseData = z.infer<typeof responseSchema> & {
  id: string;
  respondedAt: string; // Уже отформатированная дата для отображения
  firestoreRespondedAt?: Timestamp;
};

export const notificationSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  message: z.string(),
  type: z.string().optional(), 
  read: z.boolean().default(false),
  // createdAt будет serverTimestamp
});

export type NotificationData = z.infer<typeof notificationSchema> & {
  id: string;
  createdAt: string; 
  firestoreCreatedAt?: Timestamp;
};

// Схема для профиля пользователя
export const userProfileSchema = z.object({
  uid: z.string(),
  displayName: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  email: z.string().email().optional(),
  aboutMe: z.string().max(1000, "Описание не должно превышать 1000 символов.").optional().default(""),
  specializations: z.array(z.enum(taskCategories)).optional().default([]),
  city: z.string().optional().default("Ирбит"),
  age: z.number().positive().int().optional(),
  phoneVerified: z.boolean().default(false),
  registrationDate: z.any().optional(), // Firestore Timestamp или строка
  lastSignInTime: z.any().optional(), // Firestore Timestamp или строка
  // Для будущей агрегации
  averageRating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  tasksCreated: z.number().int().min(0).optional(),
  tasksCompleted: z.number().int().min(0).optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const editUserProfileSchema = z.object({
  aboutMe: z.string().max(1000, "Описание не должно превышать 1000 символов.").optional().default(""),
  specializations: z.array(z.enum(taskCategories)).optional().default([]),
});
export type EditUserProfileFormValues = z.infer<typeof editUserProfileSchema>;

// Схема для отзыва
export const reviewSchema = z.object({
  taskId: z.string().optional(), // Отзыв может быть не привязан к конкретному заданию, а к пользователю в целом
  reviewerId: z.string(), // ID того, кто оставил отзыв
  reviewerName: z.string(), // Имя того, кто оставил отзыв
  reviewerPhotoURL: z.string().url().optional().nullable(),
  reviewedUserId: z.string(), // ID того, о ком отзыв
  rating: z.number().min(1).max(5).int(), // Оценка от 1 до 5
  comment: z.string().min(10, "Комментарий должен содержать минимум 10 символов.").max(1000, "Комментарий не должен превышать 1000 символов."),
  // createdAt будет serverTimestamp
});

export type ReviewData = z.infer<typeof reviewSchema> & {
  id: string;
  createdAt: string; // Уже отформатированная дата для отображения
  firestoreCreatedAt?: Timestamp;
};
