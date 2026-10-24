import { NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_COOKIE,
  buildGoogleAuthorizeUrl,
  createGoogleOAuthState,
  googleOAuthCookieOptions,
  isGoogleOAuthConfigured,
  isGoogleSignInModuleEnabled,
  publicRequestOrigin,
  serializeGoogleOAuthState,
} from "@/app/lib/auth/google-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const from = searchParams.get("from") === "register" ? "register" : "login";
  const back = from === "register" ? "/register" : "/login";

  if (!(await isGoogleSignInModuleEnabled()) || !(await isGoogleOAuthConfigured())) {
    return NextResponse.redirect(`${origin}${back}?error=google`);
  }

  const state = createGoogleOAuthState(from);
  const url = await buildGoogleAuthorizeUrl(origin, state.nonce);
  if (!url) return NextResponse.redirect(`${origin}${back}?error=google`);

  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, serializeGoogleOAuthState(state), googleOAuthCookieOptions(600));
  return response;
}
