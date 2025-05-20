// src/app/my-tasks/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function MyTasksPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ListChecks className="h-8 w-8 text-accent" />
            <CardTitle className="text-2xl sm:text-3xl font-bold">Мои задания</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Здесь будут отображаться задания, которые вы создали, или на которые вы откликнулись как исполнитель.</p>
          {/* TODO: Implement logic to show user-specific tasks (created or responded to) */}
        </CardContent>
      </Card>
    </div>
  );
}
