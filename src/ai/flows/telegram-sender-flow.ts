'use server';
/**
 * @fileOverview Flow for sending messages via Telegram Bot API.
 *
 * - sendTelegramMessage - Sends a message using a Telegram bot.
 * - SendTelegramMessageInput - Input type for the sendTelegramMessage function.
 * - SendTelegramMessageOutput - Return type for the sendTelegramMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendTelegramMessageInputSchema = z.object({
  chatId: z.string().describe('The target chat ID (numeric) or username (e.g., @channelname). For private chats with users, a numeric chat ID is usually required.'),
  messageText: z.string().describe('The content of the message to send.'),
});
export type SendTelegramMessageInput = z.infer<typeof SendTelegramMessageInputSchema>;

const SendTelegramMessageOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  message: z.string().describe('A status message (e.g., "Сообщение отправлено" or error details).'),
  telegramResponse: z.any().optional().describe('The full response from Telegram API for debugging.'),
});
export type SendTelegramMessageOutput = z.infer<typeof SendTelegramMessageOutputSchema>;

export async function sendTelegramMessage(input: SendTelegramMessageInput): Promise<SendTelegramMessageOutput> {
  return sendTelegramMessageFlow(input);
}

const sendTelegramMessageFlow = ai.defineFlow(
  {
    name: 'sendTelegramMessageFlow',
    inputSchema: SendTelegramMessageInputSchema,
    outputSchema: SendTelegramMessageOutputSchema,
  },
  async ({ chatId, messageText }) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set in environment variables.');
      return {
        success: false,
        message: 'Ошибка конфигурации: TELEGRAM_BOT_TOKEN не найден на сервере. Пожалуйста, добавьте его в файл .env.local.',
      };
    }

    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        return {
          success: true,
          message: 'Сообщение успешно отправлено в Telegram.',
          telegramResponse: responseData,
        };
      } else {
        console.error('Telegram API Error:', responseData);
        const errorDescription = responseData.description || `HTTP status ${response.status}`;
        const errorCode = responseData.error_code ? ` (Код: ${responseData.error_code})` : '';
        return {
          success: false,
          message: `Ошибка Telegram API: ${errorDescription}${errorCode}. Проверьте правильность ID чата/имени пользователя и токен бота.`,
          telegramResponse: responseData,
        };
      }
    } catch (error: any) {
      console.error('Failed to send Telegram message:', error);
      return {
        success: false,
        message: `Сетевая ошибка или ошибка выполнения запроса: ${error.message || 'Неизвестная ошибка при связи с Telegram.'}`,
      };
    }
  }
);
