// app/api/platform/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signInPlatformAdminWithGoogle } from "@/lib/platform-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Get the base URL for redirects
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// GET: Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = getBaseUrl(request);

  // If no code, redirect to Google OAuth
  if (!code) {
    const redirectUri = `${baseUrl}/api/platform/auth/google`;
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(googleAuthUrl.toString());
  }

  // Exchange code for tokens
  try {
    const redirectUri = `${baseUrl}/api/platform/auth/google`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(`${baseUrl}/platform/login?error=TokenExchangeFailed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("User info fetch failed:", await userInfoResponse.text());
      return NextResponse.redirect(`${baseUrl}/platform/login?error=UserInfoFailed`);
    }

    const userInfo = await userInfoResponse.json();

    // Sign in platform admin
    const result = await signInPlatformAdminWithGoogle(
      userInfo.id,
      userInfo.email,
      userInfo.name,
      userInfo.picture
    );

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/platform/login?error=${encodeURIComponent(result.error || "AuthFailed")}`
      );
    }

    return NextResponse.redirect(`${baseUrl}/platform`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/platform/login?error=OAuthError`);
  }
}
