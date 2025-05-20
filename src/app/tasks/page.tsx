// src/app/tasks/page.tsx
import { Suspense } from 'react';
import TasksClientContent from './tasks-client-content';
import { Briefcase } from 'lucide-react';

function TasksPageFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Briefcase className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
      <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-muted-foreground">Загрузка заданий...</h1>
      <p className="mt-2 text-md sm:text-lg text-muted-foreground">
        Пожалуйста, подождите.
      </p>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageFallback />}>
      <TasksClientContent />
    </Suspense>
  );
}
