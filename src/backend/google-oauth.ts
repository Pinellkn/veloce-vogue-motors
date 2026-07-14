// Implémentation manuelle du flux OAuth 2.0 "Authorization Code" de Google.
// Pas de librairie tierce : juste fetch + les endpoints officiels Google.

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement ${name} manquante. Vérifie ton fichier .env à la racine du projet.`,
    );
  }
  return value;
}

export function getGoogleRedirectUri(): string {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:8080";
  return `${origin}/auth/google/callback`;
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getGoogleRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getGoogleRedirectUri();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Échange du code Google échoué (${response.status}) : ${text}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Récupération du profil Google échouée (${response.status}) : ${text}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}
