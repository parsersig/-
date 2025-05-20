"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { messageFormSchema, type MessageFormValues } from '@/lib/schemas';
import StatusIndicator, { type StatusIconType } from '@/components/status-indicator';
import { Play, Pause, BotMessageSquare, MessageCircle, Info } from 'lucide-react';

const SEND_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
// const SEND_INTERVAL_MS = 10 * 1000; // 10 seconds for testing

export default function AutoMessengerPage() {
  const { toast } = useToast();

  const [isRunning, setIsRunning] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [lastSentTime, setLastSentTime] = React.useState<string | null>(null);
  const [lastSendError, setLastSendError] = React.useState<string | null>(null);
  
  const [currentConfig, setCurrentConfig] = React.useState<MessageFormValues | null>(null);
  const [animationTrigger, setAnimationTrigger] = React.useState<'success' | 'none'>('none');

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      targetBotUsername: '',
      messageContent: '',
    },
  });

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isRunning && currentConfig) {
      const sendMessage = async () => {
        setIsSending(true);
        setLastSendError(null);
        
        // Simulate API call to Telegram
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const isSuccess = Math.random() > 0.15; // 85% success rate

        if (isSuccess) {
          const currentTime = new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSentTime(currentTime);
          setAnimationTrigger('success');
          toast({
            title: "Сообщение отправлено",
            description: `Сообщение для ${currentConfig.targetBotUsername} успешно отправлено в ${currentTime}.`,
          });
        } else {
          const errorMsg = "Не удалось отправить сообщение. Проверьте данные или попробуйте позже.";
          setLastSendError(errorMsg);
          setLastSentTime(null); // Clear last successful send time on error
          toast({
            title: "Ошибка отправки",
            description: errorMsg,
            variant: "destructive",
          });
        }
        setIsSending(false);
      };

      sendMessage(); // Send immediately once on start
      intervalId = setInterval(sendMessage, SEND_INTERVAL_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentConfig, toast]);

  // Reset animation trigger
  React.useEffect(() => {
    if (animationTrigger === 'success') {
      const timer = setTimeout(() => setAnimationTrigger('none'), 700); // Animation duration + buffer
      return () => clearTimeout(timer);
    }
  }, [animationTrigger]);

  function onSubmit(data: MessageFormValues) {
    if (isRunning) { // Stop current
      setIsRunning(false);
      setIsSending(false);
      setCurrentConfig(null);
      toast({ title: "Авто-мессенджер остановлен." });
    } else { // Start new
      setCurrentConfig(data);
      setIsRunning(true);
      setLastSentTime(null);
      setLastSendError(null);
      toast({
        title: "Авто-мессенджер запущен!",
        description: `Сообщения для ${data.targetBotUsername} будут отправляться каждые 10 минут.`,
      });
    }
    // Allow form to be re-enabled or disabled based on isRunning
    // form.reset(data); // Keep form filled
  }
  
  const getStatusDetails = (): { iconType: StatusIconType; text: string; colorClassName: string } => {
    if (isSending) {
      return { iconType: 'loading', text: 'Отправка...', colorClassName: 'text-primary' };
    }
    if (isRunning) {
      if (lastSendError) {
        return { iconType: 'error', text: 'Активен, ошибка при последней отправке', colorClassName: 'text-destructive' };
      }
      if (lastSentTime) {
         return { iconType: 'success', text: `Активен. Успешно отправлено.`, colorClassName: 'text-green-600' };
      }
      return { iconType: 'active', text: 'Активен, ожидает первой отправки', colorClassName: 'text-primary' };
    }
    return { iconType: 'idle', text: 'Остановлен', colorClassName: 'text-muted-foreground' };
  };

  const statusDetails = getStatusDetails();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background font-sans">
      <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-card">
          <div className="flex items-center space-x-3">
            <BotMessageSquare className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold">Телеграм Авто-Мессенджер</CardTitle>
              <CardDescription className="text-sm">Настройте автоматическую отправку сообщений боту.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="targetBotUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Имя пользователя целевого бота</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <MessageCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="@target_bot_username" {...field} 
                          className="pl-10 text-base h-12 rounded-lg" 
                          disabled={isRunning && !isSending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="messageContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Содержание сообщения</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ваше автоматическое сообщение..." {...field} 
                        className="min-h-[120px] text-base rounded-lg" 
                        disabled={isRunning && !isSending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base rounded-lg font-semibold"
                variant={isRunning ? "destructive" : "default"}
                disabled={isSending && isRunning}
              >
                {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isSending && isRunning ? "Остановка..." : (isRunning ? "Остановить Авто-Мессенджер" : "Запустить Авто-Мессенджер")}
              </Button>
            </form>
          </Form>

          <Separator className="my-8" />

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Статус Отправки</h3>
            <div className="p-4 border rounded-lg bg-secondary/30 shadow-inner">
              <div className="flex items-center justify-center mb-3">
                 <StatusIndicator 
                    iconType={statusDetails.iconType} 
                    text={statusDetails.text}
                    colorClassName={statusDetails.colorClassName}
                    triggerAnimation={animationTrigger}
                  />
              </div>
              {lastSentTime && !lastSendError && isRunning && (
                <p className="text-sm text-center text-muted-foreground">
                  Последнее успешное отправление: <span className="font-medium text-foreground">{lastSentTime}</span>
                </p>
              )}
              {lastSendError && isRunning && (
                 <p className="text-sm text-center text-destructive">
                  Детали ошибки: <span className="font-medium">{lastSendError}</span>
                </p>
              )}
               {!isRunning && !lastSentTime && !lastSendError && (
                <p className="text-sm text-center text-muted-foreground">Сообщения еще не отправлялись.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center">
              <Info className="h-3 w-3 mr-1"/> Сообщения будут отправляться каждые 10 минут.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-card p-4">
          <p className="text-xs text-muted-foreground text-center w-full">
            Автоматическая отправка активна только пока эта страница открыта в браузере.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
