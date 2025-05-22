// src/components/tasks/RespondModal.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RespondModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitResponse: (message: string) => Promise<void>;
  taskTitle: string;
  isSubmitting: boolean;
}

export default function RespondModal({
  isOpen,
  onClose,
  onSubmitResponse,
  taskTitle,
  isSubmitting,
}: RespondModalProps) {
  const [message, setMessage] = useState('');

  // Clear message when modal opens, if it was closed previously
  useEffect(() => {
    if (isOpen) {
      // setMessage(''); // Option 1: Always clear message on open
      // Option 2: Keep message if user closes and reopens without submitting,
      // but clear if isSubmitting was true (meaning a submission attempt happened)
      // For now, let's not clear automatically to allow temporary close/reopen.
      // Parent component can control clearing by re-rendering with new props if needed.
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      // Optionally, add a toast here if the message is empty,
      // though the button should be disabled.
      return;
    }
    try {
      await onSubmitResponse(message);
      // Parent component is responsible for closing the modal on success
      // and clearing any necessary state, like the message if desired.
      // setMessage(''); // Don't clear here, parent might want the message for some reason
    } catch (error) {
      // Error handling (e.g., toast) should be done within onSubmitResponse or by parent
      console.error("Error submitting response:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Отклик на задание</DialogTitle>
          <DialogDescription>
            Задание: "{taskTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="responseMessage" className="text-left">
            Ваше сообщение или предложение
          </Label>
          <Textarea
            id="responseMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напишите здесь ваше сопроводительное письмо или предложение..."
            rows={5}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Отправить отклик
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
