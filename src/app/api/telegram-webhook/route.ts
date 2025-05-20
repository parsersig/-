// Этот файл, скорее всего, будет перезаписан или удален, если в вашем рабочем коде его нет.
// Оставляем комментарий-заглушку.
/*
import type { NextRequest } from 'next/server';
import { NextResponse as Res } from 'next/server';

export async function GET(req: NextRequest) {
  return Res.json({ message: 'Webhook placeholder. Overwrite or delete.' });
}
*/
console.log("Placeholder for /src/app/api/telegram-webhook/route.ts");
// Минимальный экспорт, чтобы файл был валидным модулем, если он останется
export async function GET() {
  return new Response(JSON.stringify({ message: 'Webhook placeholder. Overwrite or delete.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
