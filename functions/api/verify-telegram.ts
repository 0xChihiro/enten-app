import { jsonResponse, methodNotAllowed, requireStringEnv, verifyTelegramInitData } from "../_shared/telegram";

type Env = {
  TELEGRAM_BOT_TOKEN?: string;
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  if (context.request.method !== "POST") return methodNotAllowed();

  let telegramInitData = "";
  try {
    const body = await context.request.json<{ telegramInitData?: unknown }>();
    telegramInitData = typeof body.telegramInitData === "string" ? body.telegramInitData : "";
  } catch {
    return jsonResponse({ error: "invalid_json" }, { status: 400 });
  }

  let botToken: string;
  try {
    botToken = requireStringEnv(context.env, "TELEGRAM_BOT_TOKEN");
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

  try {
    const verified = await verifyTelegramInitData(telegramInitData, botToken);
    return jsonResponse({
      ok: true,
      telegramUser: verified.user,
      authDate: verified.authDate,
      queryId: verified.queryId
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "invalid_telegram_init_data",
        message: error instanceof Error ? error.message : "Telegram initData verification failed."
      },
      { status: 401 }
    );
  }
}
