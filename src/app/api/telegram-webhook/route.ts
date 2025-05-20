
import type { NextRequest } from 'next/server';
import { NextResponse as Res } from 'next/server';

// Определяем интерфейсы для структуры обновлений Telegram
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  // Можно добавить другие типы обновлений: edited_message, channel_post и т.д.
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  // Можно добавить другие поля сообщения: photo, audio и т.д.
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Отправляет ответное сообщение в Telegram.
 * @param chatId ID чата, куда отправить ответ.
 * @param text Текст ответного сообщения.
 * @param botToken Токен вашего бота.
 * @returns true в случае успеха, иначе false.
 */
async function sendTelegramReply(chatId: number, text: string, botToken: string): Promise<boolean> {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
    const responseData = await response.json();
    if (!response.ok || !responseData.ok) {
        console.error('Telegram API error while sending reply:', responseData);
        return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Telegram reply:', error);
    return false;
  }
}

// Обработчик POST-запросов для вебхука
export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set in environment variables for webhook.');
    // Важно не отправлять подробные сообщения об ошибках обратно в Telegram,
    // если это не специальный ожидаемый ими формат.
    return Res.json({ error: 'Configuration error on server' }, { status: 500 });
  }

  try {
    const update = (await req.json()) as TelegramUpdate;
    // console.log('Received update from Telegram:', JSON.stringify(update, null, 2)); // Для отладки

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text.trim().toLowerCase(); // Приводим к нижнему регистру для надежности

      if (messageText === '/start') {
        const replyText = 'Привет! Вы написали /start. Это тестовый ответ от вашего бота, настроенного через Next.js!';
        const success = await sendTelegramReply(chatId, replyText, botToken);
        if (success) {
          console.log(`Successfully replied to /start from chat ID ${chatId}`);
        } else {
          console.error(`Failed to reply to /start for chat ID ${chatId}`);
        }
      }
      // Здесь можно добавить обработку других команд, например:
      // else if (messageText === '/help') {
      //   const replyText = 'Это команда /help...';
      //   await sendTelegramReply(chatId, replyText, botToken);
      // }
    }

    // Telegram ожидает ответ 200 OK для подтверждения получения обновления.
    // Если не отправить, Telegram будет повторять попытки.
    return Res.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Telegram update:', error);
    // Для ошибок парсинга или других проблем с запросом
    return Res.json({ error: 'Error processing update' }, { status: 400 });
  }
}

// GET-обработчик можно использовать для первоначальной установки вебхука (некоторые сервисы это требуют)
// или просто для проверки, что URL доступен.
export async function GET(req: NextRequest) {
  return Res.json({ message: 'Telegram Webhook is active. Use POST method for updates.' });
}
