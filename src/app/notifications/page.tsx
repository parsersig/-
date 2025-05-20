// src/app/notifications/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Уведомления</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Здесь будут отображаться уведомления о новых откликах на ваши задания, сообщениях, изменениях статусов и других важных событиях.</p>
          {/* TODO: Implement notification system */}
        </CardContent>
      </Card>
    </div>
  );
}
