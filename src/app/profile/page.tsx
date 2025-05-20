// src/app/profile/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserCircle className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Мой профиль</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Информация о вашем профиле, настройки и другие персональные данные будут отображаться здесь.</p>
          {/* TODO: Add profile editing form, user details etc. when auth is implemented */}
        </CardContent>
      </Card>
    </div>
  );
}
