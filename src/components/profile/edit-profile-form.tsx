
// src/components/profile/edit-profile-form.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { taskCategories, editUserProfileSchema, type EditUserProfileFormValues, type UserProfile } from "@/lib/schemas";
import { Loader2 } from "lucide-react";

interface EditProfileFormProps {
  currentUser: User;
  initialProfileData: Partial<UserProfile>; 
  onProfileUpdated: (updatedData: EditUserProfileFormValues) => void;
  onCancel: () => void;
}

export default function EditProfileForm({ currentUser, initialProfileData, onProfileUpdated, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditUserProfileFormValues>({
    resolver: zodResolver(editUserProfileSchema),
    defaultValues: {
      displayName: initialProfileData?.displayName || currentUser.displayName || "",
      photoURL: (initialProfileData?.photoURL || currentUser.photoURL) ?? undefined,
      aboutMe: initialProfileData?.aboutMe || "",
      specializations: initialProfileData?.specializations || [],
      city: initialProfileData?.city || "Ирбит",
      // age: initialProfileData?.age // Пока не добавляем возраст в форму
    },
  });

  async function onSubmit(data: EditUserProfileFormValues) {
    if (!db || !currentUser?.uid) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к базе данных или пользователь не найден.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const profileRef = doc(db, "userProfiles", currentUser.uid);
      
      // Собираем данные для сохранения, включая те, что не редактируются в этой форме, но должны быть в профиле
      const profileDataToSave: Partial<UserProfile> = {
        ...initialProfileData, // Сохраняем существующие данные профиля
        ...data, // Обновляем поля из формы
        uid: currentUser.uid,
        email: currentUser.email, // Email обычно не меняется пользователем
        // registrationDate и lastSignInTime лучше брать из user.metadata при отображении, а не хранить копию,
        // если только нет специфичной логики для их перезаписи.
      };
      
      await setDoc(profileRef, profileDataToSave, { merge: true });

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены.",
      });
      onProfileUpdated(data); 
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Ошибка обновления",
        description: `Не удалось сохранить изменения. ${error.message || ""}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md sm:text-lg">Отображаемое имя</FormLabel>
              <FormControl>
                <Input placeholder="Ваше имя или никнейм" {...field} className="h-12 text-base" />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                Как вас будут видеть другие пользователи.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md sm:text-lg">URL аватара</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.png" {...field} className="h-12 text-base" />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                Прямая ссылка на ваше изображение (пока нет загрузки файлов).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aboutMe"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md sm:text-lg">О себе</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Расскажите немного о себе, вашем опыте, чем можете быть полезны..."
                  className="min-h-[120px] sm:min-h-[150px] text-base"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs sm:text-sm">
                Эта информация будет видна другим пользователям в вашем профиле.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md sm:text-lg">Город</FormLabel>
              <FormControl>
                <Input placeholder="Например, Ирбит" {...field} className="h-12 text-base" />
              </FormControl>
               <FormDescription className="text-xs sm:text-sm">
                Ваш город проживания.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specializations"
          render={() => (
            <FormItem>
              <div className="mb-3">
                <FormLabel className="text-lg">Ваши специализации</FormLabel>
                <FormDescription>
                  Выберите категории услуг, в которых вы специализируетесь.
                </FormDescription>
              </div>
              <ScrollArea className="h-60 sm:h-72 w-full rounded-md border p-3 bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {taskCategories.map((category) => (
                  <FormField
                    key={category}
                    control={form.control}
                    name="specializations"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category}
                          className="flex flex-row items-center space-x-2 space-y-0 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), category])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== category
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer select-none">
                            {category}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                </div>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Сохранить"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
