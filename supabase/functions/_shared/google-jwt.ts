export const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const DRIVE_FILE_WRITE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const JWT_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const TOKEN_CACHE_TTL_MS = 50 * 60 * 1000;

interface GoogleServiceAccount {
  client_email?: string;
  private_key?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

const tokenCache = new Map<string, CachedToken>();

function getServiceAccount(): Required<GoogleServiceAccount> {
  const rawJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

  if (!rawJson) {
    throw new Error(
      "missing_env: GOOGLE_SERVICE_ACCOUNT_JSON is required for Drive service-account auth",
    );
  }

  let parsed: GoogleServiceAccount;

  try {
    parsed = JSON.parse(rawJson) as GoogleServiceAccount;
  } catch (error) {
    throw new Error(
      `missing_env: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON (${
        String(error)
      })`,
    );
  }

  if (!parsed.client_email) {
    throw new Error(
      "missing_env: GOOGLE_SERVICE_ACCOUNT_JSON.client_email is required",
    );
  }

  if (!parsed.private_key) {
    throw new Error(
      "missing_env: GOOGLE_SERVICE_ACCOUNT_JSON.private_key is required",
    );
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(
    /=+$/g,
    "",
  );
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function pemToPkcs8Der(privateKeyPem: string): ArrayBuffer {
  const base64 = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  if (!base64) {
    throw new Error(
      "auth_failed: GOOGLE_SERVICE_ACCOUNT_JSON.private_key is not a PKCS8 PEM private key",
    );
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Der(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJwtAssertion(
  serviceAccount: Required<GoogleServiceAccount>,
  scope: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope,
    aud: TOKEN_AUDIENCE,
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${textToBase64Url(JSON.stringify(header))}.${
    textToBase64Url(JSON.stringify(payload))
  }`;
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedJwt),
  );

  return `${unsignedJwt}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export interface DriveAccessTokenOptions {
  /** OAuth scopes to request. Defaults to the existing readonly Drive sync scope. */
  scopes?: string | string[];
}

function normalizeScopes(scopes: string | string[] | undefined): string {
  if (Array.isArray(scopes)) {
    return scopes.map((scope) => scope.trim()).filter(Boolean).join(" ");
  }

  return scopes?.trim() || DRIVE_READONLY_SCOPE;
}

/**
 * Returns a Google Drive OAuth access token for the configured service account.
 *
 * Supabase Edge Functions run on Deno, so this intentionally avoids Google SDKs:
 * PKCS8 PEM -> WebCrypto importKey -> RS256 JWT signature -> OAuth token exchange.
 * Existing callers get the readonly scope by default; write paths must opt in.
 */
export async function getDriveAccessToken(
  options: DriveAccessTokenOptions = {},
): Promise<string> {
  const serviceAccount = getServiceAccount();
  const scope = normalizeScopes(options.scopes);
  const cacheKey = `${serviceAccount.client_email}:${scope}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.accessToken;
  }

  const assertion = await signJwtAssertion(serviceAccount, scope);
  const response = await fetch(TOKEN_AUDIENCE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: JWT_GRANT_TYPE,
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `auth_failed: Google OAuth token exchange failed (${response.status}) ${errorBody}`,
    );
  }

  const tokenBody = await response.json() as { access_token?: string };

  if (!tokenBody.access_token) {
    throw new Error(
      "auth_failed: Google OAuth token response did not include access_token",
    );
  }

  tokenCache.set(cacheKey, {
    accessToken: tokenBody.access_token,
    expiresAtMs: Date.now() + TOKEN_CACHE_TTL_MS,
  });

  return tokenBody.access_token;
}
