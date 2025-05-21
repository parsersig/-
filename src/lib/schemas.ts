
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export const taskCategories = [
  "Ремонт и строительство", // Строительство, ремонт квартир, сантехника, электрика, отделка
  "Уборка и помощь по хозяйству", // Уборка квартир, домов, мытье окон, помощь пожилым
  "Курьерские услуги", // Доставка документов, еды, мелких посылок
  "Компьютерная помощь", // Ремонт ПК, настройка ПО, удаление вирусов, установка Windows
  "Репетиторство и обучение", // Математика, русский язык, английский, гитара, программирование
  "Красота и здоровье", // Маникюр, педикюр, парикмахер, массаж, косметолог, фитнес-тренер
  "Мероприятия и промоакции", // Ведущий, диджей, аниматор, фотограф на мероприятие, промоутер
  "Фото и видеосъемка", // Фотосессии, видеосъемка, монтаж
  "Дизайн и графика", // Логотипы, веб-дизайн, полиграфия, иллюстрации
  "Разработка и IT", // Создание сайтов, веб-разработка, мобильная разработка, SEO
  "Перевозки и грузчики", // Грузоперевозки, переезды, услуги грузчиков
  "Юридическая помощь", // Консультации, составление документов, представительство
  "Бухгалтерские услуги", // Ведение учета, сдача отчетности, консультации
  "Уход за животными", // Выгул собак, передержка, стрижка животных
  "Автосервис и ремонт авто", // Ремонт двигателя, ходовой, шиномонтаж, автоэлектрик
  "Пошив и ремонт одежды", // Индивидуальный пошив, ремонт одежды, подгонка
  "Сад и огород", // Ландшафтный дизайн, уход за садом, посадка растений
  "Няни и уход за детьми", // Няня на час, сопровождение, развивающие занятия
  "Другое" // Категория для уникальных или не вошедших в список услуг
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

export interface StoredTask extends TaskFormValues {
  id: string;
  postedDate: string; // Уже отформатированная дата для отображения
  firestorePostedDate?: Timestamp; // Оригинальный Timestamp для сортировки
  city: string;
  views: number;
  userId?: string;
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
  type: z.string().optional(), // например 'new_task', 'new_response'
  read: z.boolean().default(false),
  // createdAt будет serverTimestamp
});

export type NotificationData = z.infer<typeof notificationSchema> & {
  id: string;
  createdAt: string; // Уже отформатированная дата для отображения
  firestoreCreatedAt?: Timestamp;
};

// Схема для профиля пользователя
export const userProfileSchema = z.object({
  aboutMe: z.string().max(1000, "Описание не должно превышать 1000 символов.").optional().default(""),
  specializations: z.array(z.enum(taskCategories)).optional().default([]),
  // Другие поля профиля можно добавить здесь позже (город, возраст, рейтинг и т.д.)
  // displayName, photoURL, email будут браться из Firebase Auth и могут быть здесь для кэширования или если пользователь их изменит
  displayName: z.string().optional(),
  photoURL: z.string().url().optional().nullable(),
  email: z.string().email().optional(),
  city: z.string().optional().default("Ирбит"),
  // поля, которые можно будет заполнять в будущем
  age: z.number().positive().optional(),
  phoneVerified: z.boolean().default(false),
  // ... и т.д.
});

export type UserProfile = z.infer<typeof userProfileSchema> & {
  uid?: string; // Будет соответствовать auth.currentUser.uid
  registrationDate?: string; // Для отображения, берется из auth.currentUser.metadata
  lastSignInTime?: string; // Для отображения, берется из auth.currentUser.metadata
};

// Тип для формы редактирования профиля (только редактируемые поля)
export const editUserProfileSchema = userProfileSchema.pick({
  aboutMe: true,
  specializations: true,
  // city: true, // Если захотим сделать город редактируемым
});
export type EditUserProfileFormValues = z.infer<typeof editUserProfileSchema>;

