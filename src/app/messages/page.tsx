// src/app/messages/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Сообщения</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ваши личные сообщения и чаты с заказчиками или исполнителями будут отображаться здесь.</p>
          {/* TODO: Implement full messaging system */}
        </CardContent>
      </Card>
    </div>
  );
}
