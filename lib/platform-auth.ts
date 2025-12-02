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

export interface PlatformAdminPayload {
  id: string;
  email: string;
  name: string;
  [key: string]: string; // Required for JWTPayload compatibility
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

// Sign in platform admin
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

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return { success: false, error: "אימייל או סיסמה שגויים" };
  }

  const token = await createToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
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
