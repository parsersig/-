import { z } from 'zod';

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
      if (typeof val === 'string' && val.trim() === '') return undefined; // Treat empty string as undefined for optional
      const num = parseFloat(String(val));
      return isNaN(num) ? val : num; // Keep original if not a number (for further zod validation)
    },
    z.number({ invalid_type_error: "Бюджет должен быть числом." })
      .positive({ message: "Бюджет должен быть положительным числом." })
      .optional()
  ),
  isNegotiable: z.boolean().default(false),
  contactInfo: z.string()
    .min(5, { message: "Укажите контактную информацию (например, телефон или Telegram)." })
    .max(150, { message: "Контактная информация не должна превышать 150 символов." }),
  // city: z.literal("Ирбит").default("Ирбит"), // Implicitly Irbit
});

export type TaskFormValues = z.infer<typeof taskSchema>;
