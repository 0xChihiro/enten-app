import { jsonResponse, methodNotAllowed, requireStringEnv, verifyTelegramInitData } from "../_shared/telegram";

type Env = {
  TELEGRAM_BOT_TOKEN?: string;
};

type LinkMossWalletBody = {
  telegramInitData?: unknown;
  mossAuth?: unknown;
  walletAddress?: unknown;
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  if (context.request.method !== "POST") return methodNotAllowed();

  let body: LinkMossWalletBody;
  try {
    body = await context.request.json<LinkMossWalletBody>();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const telegramInitData = typeof body.telegramInitData === "string" ? body.telegramInitData : "";
  const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress : "";

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return jsonResponse({ ok: false, error: "invalid_wallet_address" }, { status: 400 });
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
    await verifyTelegramInitData(telegramInitData, botToken);
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

  if (!body.mossAuth) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_moss_auth",
        message: "MOSS wallet ownership/auth payload is required before linking."
      },
      { status: 400 }
    );
  }

  return jsonResponse(
    {
      ok: false,
      error: "moss_auth_verification_not_implemented",
      message:
        "Telegram initData was verified, but this endpoint does not accept wallet links until official MOSS ownership/auth verification is implemented server-side."
    },
    { status: 501 }
  );
}
