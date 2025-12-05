// lib/platform-auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.PLATFORM_JWT_SECRET || process.env.AUTH_SECRET || "platform-secret-key"
);

const COOKIE_NAME = "platform-admin-token";
const TOKEN_EXPIRY = "7d";

// Allowed emails for platform admin Google login
const ALLOWED_PLATFORM_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").filter(Boolean);

export interface PlatformAdminPayload {
  id: string;
  email: string;
  name: string;
  image?: string;
  [key: string]: string | undefined; // Required for JWTPayload compatibility
}

// Create a JWT token for platform admin
async function createToken(payload: PlatformAdminPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// Verify and decode a JWT token
async function verifyToken(token: string): Promise<PlatformAdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as PlatformAdminPayload;
  } catch {
    return null;
  }
}

// Sign in platform admin with email/password
export async function signInPlatformAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await prisma.platformAdmin.findUnique({
    where: { email },
  });

  if (!admin) {
    return { success: false, error: "אימייל או סיסמה שגויים" };
  }

  if (!admin.password) {
    return { success: false, error: "חשבון זה משתמש בהתחברות עם Google" };
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return { success: false, error: "אימייל או סיסמה שגויים" };
  }

  const token = await createToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    image: admin.image || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return { success: true };
}

// Sign in platform admin with Google
export async function signInPlatformAdminWithGoogle(
  googleId: string,
  email: string,
  name: string,
  image?: string
): Promise<{ success: boolean; error?: string }> {
  // Check if email is in allowed list
  if (ALLOWED_PLATFORM_EMAILS.length > 0 && !ALLOWED_PLATFORM_EMAILS.includes(email)) {
    return { success: false, error: "אין לך הרשאה לגשת לממשק בעל הפלטפורמה" };
  }

  // Find existing admin by Google ID or email
  let admin = await prisma.platformAdmin.findFirst({
    where: {
      OR: [
        { googleId },
        { email },
      ],
    },
  });

  if (!admin) {
    // Check if allowed to create new admin (either no admins exist or email is in allowed list)
    const existingCount = await prisma.platformAdmin.count();

    if (existingCount > 0 && (ALLOWED_PLATFORM_EMAILS.length === 0 || !ALLOWED_PLATFORM_EMAILS.includes(email))) {
      return { success: false, error: "אין לך הרשאה לגשת לממשק בעל הפלטפורמה" };
    }

    // Create new platform admin
    admin = await prisma.platformAdmin.create({
      data: {
        email,
        name,
        googleId,
        image,
      },
    });
  } else {
    // Update Google ID if not set
    if (!admin.googleId) {
      admin = await prisma.platformAdmin.update({
        where: { id: admin.id },
        data: {
          googleId,
          image: image || admin.image,
        },
      });
    }
  }

  const token = await createToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    image: admin.image || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return { success: true };
}

// Check if email is allowed for platform admin
export function isEmailAllowedForPlatformAdmin(email: string): boolean {
  if (ALLOWED_PLATFORM_EMAILS.length === 0) {
    return true; // If no list configured, check will happen on sign-in
  }
  return ALLOWED_PLATFORM_EMAILS.includes(email);
}

// Sign out platform admin
export async function signOutPlatformAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current platform admin session
export async function getPlatformAdminSession(): Promise<PlatformAdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Require platform admin session (throws if not authenticated)
export async function requirePlatformAdminSession(): Promise<PlatformAdminPayload> {
  const session = await getPlatformAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

// Hash password
export async function hashPlatformPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Create initial platform admin (for setup)
export async function createInitialPlatformAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  // Check if any platform admin exists
  const existingCount = await prisma.platformAdmin.count();

  if (existingCount > 0) {
    return { success: false, error: "Platform admin already exists" };
  }

  const hashedPassword = await hashPlatformPassword(password);

  await prisma.platformAdmin.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return { success: true };
}
