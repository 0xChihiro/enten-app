export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
  photo_url?: string;
};

export type VerifiedTelegramInitData = {
  user?: TelegramUser;
  authDate: number;
  queryId?: string;
  raw: Record<string, string>;
};

const MAX_TELEGRAM_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function methodNotAllowed(): Response {
  return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: { allow: "POST" } });
}

export function requireStringEnv(env: Record<string, unknown>, key: string): string {
  const value = env[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] || 0) ^ (right[i] || 0);
  }

  return diff === 0;
}

export async function verifyTelegramInitData(
  telegramInitData: string,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<VerifiedTelegramInitData> {
  if (!telegramInitData || typeof telegramInitData !== "string") {
    throw new Error("Missing telegramInitData.");
  }

  const params = new URLSearchParams(telegramInitData);
  const receivedHash = params.get("hash") || "";
  if (!receivedHash) throw new Error("Telegram initData is missing hash.");

  params.delete("hash");
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const authDateRaw = params.get("auth_date") || "";
  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new Error("Telegram initData is missing a valid auth_date.");
  }

  if (nowSeconds - authDate > MAX_TELEGRAM_INIT_DATA_AGE_SECONDS) {
    throw new Error("Telegram initData is stale.");
  }

  if (authDate - nowSeconds > 300) {
    throw new Error("Telegram initData auth_date is in the future.");
  }

  const encoder = new TextEncoder();
  const webAppDataKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secretKeyBytes = await crypto.subtle.sign("HMAC", webAppDataKey, encoder.encode(botToken));
  const telegramSecretKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", telegramSecretKey, encoder.encode(dataCheckString));
  const calculatedHash = bytesToHex(new Uint8Array(digest));

  if (!timingSafeEqual(calculatedHash, receivedHash)) {
    throw new Error("Telegram initData signature is invalid.");
  }

  const raw: Record<string, string> = {};
  entries.forEach(([key, value]) => {
    raw[key] = value;
  });

  let user: TelegramUser | undefined;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as TelegramUser;
    } catch {
      throw new Error("Telegram initData has invalid user JSON.");
    }
  }

  return {
    user,
    authDate,
    queryId: params.get("query_id") || undefined,
    raw
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
