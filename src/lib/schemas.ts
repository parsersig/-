
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore'; // Используем type import для Timestamp

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
  postedDate: any; 
  firestorePostedDate?: Timestamp; 
  city: string;
  views: number;
  userId?: string;
  status?: TaskStatus; 
  ownerDisplayName?: string;
  executorId?: string; 
  startedAt?: any; 
  firestoreStartedAt?: Timestamp; 
}

export const responseSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskCategory: z.enum(taskCategories),
  taskOwnerId: z.string(), 
  responderId: z.string(),
  responderName: z.string().nullable().optional(),
  responderPhotoURL: z.string().url().nullable().optional(),
  message: z.string().max(1000, "Сообщение не должно превышать 1000 символов.").optional(), 
  // respondedAt будет serverTimestamp
});
export type ResponseData = z.infer<typeof responseSchema> & {
  id: string;
  respondedAt: any; 
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
  createdAt: any; 
  firestoreCreatedAt?: Timestamp;
};

export const userProfileSchema = z.object({
  uid: z.string(),
  displayName: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50, "Имя не должно превышать 50 символов").optional().nullable(),
  photoURL: z.string().url("Некорректный URL аватара").optional().nullable().or(z.literal("")),
  email: z.string().email().optional(),
  aboutMe: z.string().max(1000, "Описание не должно превышать 1000 символов.").optional().default(""),
  specializations: z.array(z.enum(taskCategories)).optional().default([]),
  city: z.string().optional().default("Ирбит"),
  age: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseInt(String(val), 10)),
    z.number().positive("Возраст должен быть положительным числом").int("Возраст должен быть целым числом").optional().nullable()
  ),
  registrationDate: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for registrationDate").optional(),
  lastSignInTime: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for lastSignInTime").optional(),
  tasksCreated: z.number().int().min(0).optional().default(0),
  tasksCompleted: z.number().int().min(0).optional().default(0),
  averageRating: z.number().min(0).max(5).optional().nullable(),
  reviewsCount: z.number().int().min(0).optional().default(0),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const editUserProfileSchema = z.object({
  displayName: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50, "Имя не должно превышать 50 символов").optional(),
  photoURL: z.string().url("Некорректный URL аватара").optional().or(z.literal("")),
  aboutMe: z.string().max(1000, "Описание не должно превышать 1000 символов.").optional().default(""),
  specializations: z.array(z.enum(taskCategories)).optional().default([]),
  city: z.string().min(2, "Город должен содержать хотя бы 2 символа").optional(),
  age: z.preprocess(
    (val) => {
      const strVal = String(val).trim();
      if (strVal === "") return undefined;
      const num = parseInt(strVal, 10);
      return isNaN(num) ? strVal : num; 
    },
    z.number({ invalid_type_error: "Возраст должен быть числом" })
      .positive("Возраст должен быть положительным числом")
      .int("Возраст должен быть целым числом")
      .min(14, "Минимальный возраст 14 лет")
      .max(120, "Максимальный возраст 120 лет")
      .optional()
      .nullable()
  ),
});
export type EditUserProfileFormValues = z.infer<typeof editUserProfileSchema>;

export const reviewSchema = z.object({
  taskId: z.string().optional(), 
  taskTitle: z.string().optional(), 
  reviewerId: z.string(), 
  reviewerName: z.string(), 
  reviewerPhotoURL: z.string().url().optional().nullable(),
  reviewedUserId: z.string(), 
  rating: z.number().min(1).max(5).int(), 
  comment: z.string().min(10, "Комментарий должен содержать минимум 10 символов.").max(1000, "Комментарий не должен превышать 1000 символов."),
  createdAt: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for createdAt").optional(), 
});
export type ReviewData = z.infer<typeof reviewSchema>;


// --- Схемы для Чата ---
export const messageSchema = z.object({
  // id будет генерироваться Firestore
  chatId: z.string().describe("ID чата, к которому принадлежит сообщение"),
  senderId: z.string().describe("ID пользователя, отправившего сообщение"),
  text: z.string().min(1, "Сообщение не может быть пустым.").max(2000, "Сообщение слишком длинное."),
  sentAt: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for sentAt").describe("Время отправки сообщения (серверный Timestamp)"),
  type: z.enum(['text', 'system']).optional().default('text').describe("Тип сообщения: обычное текстовое или системное"),
  // isRead: z.boolean().default(false).optional(), // Для отслеживания прочтения, пока не используем
});
export type MessageData = z.infer<typeof messageSchema> & { id?: string }; // id будет добавлен после чтения из Firestore

export const chatSchema = z.object({
  // id будет генерироваться Firestore
  participants: z.array(z.string()).min(2, "В чате должно быть как минимум 2 участника.").max(2, "Пока поддерживаются только чаты на двоих."), // Массив ID пользователей
  participantNames: z.record(z.string(), z.string()).describe("Объект с ID участника в качестве ключа и его displayName в качестве значения"),
  participantPhotoURLs: z.record(z.string(), z.string().url().nullable()).describe("Объект с ID участника и URL его аватара"),
  
  taskId: z.string().optional().describe("ID задания, к которому может быть привязан чат"),
  taskTitle: z.string().optional().describe("Название задания, для удобства"),

  lastMessageText: z.string().optional().default("").describe("Текст последнего сообщения"),
  lastMessageAt: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for lastMessageAt").optional().nullable().describe("Время последнего сообщения"),
  createdAt: z.custom<Timestamp>((val) => val instanceof Timestamp, "Invalid Timestamp for createdAt").describe("Время создания чата (серверный Timestamp)"),
  // unreadCounts: z.record(z.string(), z.number().int().min(0)).optional(), // { [userId]: count } - пока не реализуем
  taskStatus: z.string().optional().describe("Статус задания"),
  taskPrice: z.union([z.string(), z.number()]).optional().describe("Цена задания"),
});
export type ChatData = z.infer<typeof chatSchema> & { id?: string }; // id будет добавлен после чтения из Firestore
