import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_COOKIE,
  clearGoogleOAuthCookie,
  completeGoogleSignIn,
  googleOAuthStatesMatch,
  parseGoogleOAuthState,
  publicRequestOrigin,
} from "@/app/lib/auth/google-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const cookieStore = await cookies();
  const googleState = parseGoogleOAuthState(cookieStore.get(GOOGLE_OAUTH_COOKIE)?.value);
  const stateParam = searchParams.get("state");

  if (googleOAuthStatesMatch(googleState, stateParam) && googleState) {
    if (searchParams.get("error") === "access_denied" || !searchParams.get("code")) {
      const back = googleState.from === "register" ? "/register?error=google" : "/login?error=google";
      return clearGoogleOAuthCookie(NextResponse.redirect(`${origin}${back}`));
    }
    return completeGoogleSignIn(request, origin, searchParams.get("code") ?? "", googleState);
  }

  return NextResponse.redirect(`${origin}/login?error=google`);
}
