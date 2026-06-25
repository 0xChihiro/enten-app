import { jsonResponse, methodNotAllowed, requireStringEnv, timingSafeEqual } from "../_shared/telegram";

type Env = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  APP_BASE_URL?: string;
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  if (context.request.method !== "POST") return methodNotAllowed();

  let botToken: string;
  let webhookSecret: string;
  let appBaseUrl: string;
  try {
    botToken = requireStringEnv(context.env, "TELEGRAM_BOT_TOKEN");
    webhookSecret = requireStringEnv(context.env, "TELEGRAM_WEBHOOK_SECRET");
    appBaseUrl = requireStringEnv(context.env, "APP_BASE_URL").replace(/\/+$/, "");
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_environment",
        message: error instanceof Error ? error.message : "Missing required environment variable."
      },
      { status: 500 }
    );
  }

  const receivedSecret = context.request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (!timingSafeEqual(receivedSecret, webhookSecret)) {
    return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await context.request.json<TelegramUpdate>();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = update.message?.text || "";
  const chatId = update.message?.chat?.id;
  if (chatId && text.trim().startsWith("/start")) {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Open Enten to connect your MOSS wallet.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open Enten",
                web_app: {
                  url: `${appBaseUrl}/telegram`
                }
              }
            ]
          ]
        }
      })
    });

    if (!telegramResponse.ok) {
      const detail = await telegramResponse.text();
      return jsonResponse(
        {
          ok: false,
          error: "telegram_send_message_failed",
          status: telegramResponse.status,
          detail
        },
        { status: 502 }
      );
    }
  }

  return jsonResponse({ ok: true });
}
