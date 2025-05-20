
import type { NextRequest } from 'next/server';
import { NextResponse as Res } from 'next/server';

// Определяем интерфейсы для структуры обновлений Telegram
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
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

async function sendTelegramReply(chatId: number, text: string, botToken: string): Promise<boolean> {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  console.log(`[Webhook] Attempting to send reply to chat ID ${chatId} with text: "${text.substring(0, 30)}..."`);
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
        console.error('[Webhook] Telegram API error while sending reply:', JSON.stringify(responseData));
        return false;
    }
    console.log('[Webhook] Successfully sent reply to Telegram.');
    return true;
  } catch (error: any) {
    console.error('[Webhook] Failed to send Telegram reply due to fetch/network error:', error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log('[Webhook] Received POST request.');

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('[Webhook CRITICAL] TELEGRAM_BOT_TOKEN is not set or not accessible in environment variables for the webhook function on Vercel.');
    // Telegram ожидает ответ 200 OK, даже если есть внутренняя ошибка, чтобы не повторять запросы.
    // В реальном приложении можно логировать эту ошибку для мониторинга.
    return Res.json({ error: 'Server configuration error: Bot token missing.' }, { status: 200 });
  }
  console.log(`[Webhook] TELEGRAM_BOT_TOKEN found (starts with: ${botToken.substring(0, botToken.indexOf(':'))}:...).`);

  try {
    const update = (await req.json()) as TelegramUpdate;
    // console.log('[Webhook] Received update from Telegram:', JSON.stringify(update, null, 2));

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text.trim().toLowerCase();
      const senderUsername = update.message.from?.username || 'unknown_user';

      console.log(`[Webhook] Processing message from chat ID ${chatId} (user: @${senderUsername}): "${messageText}"`);

      if (messageText === '/start') {
        const replyText = 'Привет! Это упрощенный тестовый ответ на /start от вашего бота на Vercel!';
        const success = await sendTelegramReply(chatId, replyText, botToken);
        if (success) {
          console.log(`[Webhook] Successfully replied to /start from chat ID ${chatId}`);
        } else {
          console.error(`[Webhook] Failed to send /start reply for chat ID ${chatId}, but webhook will return 200 OK.`);
        }
      } else {
        console.log(`[Webhook] Received message that is not /start: "${messageText}". No action taken.`);
      }
    } else {
      console.log('[Webhook] Received update without a message or text field. No action taken.');
    }

    // Telegram ожидает ответ 200 OK для подтверждения получения обновления.
    return Res.json({ status: 'ok' }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook] Error processing Telegram update JSON or other unexpected error:', error.message, error.stack);
    return Res.json({ error: 'Error processing update on server' }, { status: 200 }); // Все равно отвечаем 200
  }
}

export async function GET(req: NextRequest) {
  console.log('[Webhook] Received GET request.');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return Res.json({ message: 'Telegram Webhook is active, but TELEGRAM_BOT_TOKEN is MISSING on the server. Please configure it in Vercel environment variables.', status: 'error' });
  }
  return Res.json({ message: 'Telegram Webhook is active and TELEGRAM_BOT_TOKEN seems to be present. Use POST method for updates.', status: 'ok' });
}
