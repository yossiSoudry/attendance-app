// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AdminRole, AdminStatus } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

// Extended types for our app
interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: AdminRole;
  status: AdminStatus;
  departmentId: string | null;
}

interface ExtendedJWT extends JWT {
  id?: string;
  role?: AdminRole;
  departmentId?: string | null;
}

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: AdminRole;
      departmentId: string | null;
    };
  }

  interface User extends ExtendedUser {}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Email + Password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("נא להזין אימייל וסיסמה");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const admin = await prisma.adminUser.findUnique({
          where: { email },
        });

        if (!admin) {
          throw new Error("אימייל או סיסמה שגויים");
        }

        if (admin.status !== "ACTIVE") {
          throw new Error("החשבון אינו פעיל");
        }

        if (!admin.password) {
          throw new Error("חשבון זה משתמש בהתחברות עם Google");
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
          throw new Error("אימייל או סיסמה שגויים");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          image: admin.image,
          role: admin.role,
          status: admin.status,
          departmentId: admin.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, check if user exists or is invited
      if (account?.provider === "google") {
        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email: user.email! },
        });

        if (existingAdmin) {
          // Existing admin - check if active
          if (existingAdmin.status !== "ACTIVE") {
            return false;
          }

          // Link Google account if not already linked
          if (!existingAdmin.googleId) {
            await prisma.adminUser.update({
              where: { id: existingAdmin.id },
              data: {
                googleId: account.providerAccountId,
                image: user.image,
              },
            });
          }

          return true;
        }

        // Check for invitation
        const invitation = await prisma.adminInvitation.findUnique({
          where: { email: user.email! },
        });

        if (!invitation) {
          // No invitation - not allowed to sign up
          return "/admin/login?error=NotInvited";
        }

        if (invitation.usedAt) {
          return "/admin/login?error=InvitationUsed";
        }

        if (invitation.expiresAt < new Date()) {
          return "/admin/login?error=InvitationExpired";
        }

        // Create new admin from invitation
        await prisma.$transaction(async (tx) => {
          await tx.adminUser.create({
            data: {
              email: user.email!,
              name: user.name || user.email!,
              googleId: account.providerAccountId,
              image: user.image,
              role: invitation.role,
              departmentId: invitation.departmentId,
              invitedById: invitation.invitedById,
              invitedAt: new Date(),
            },
          });

          await tx.adminInvitation.update({
            where: { id: invitation.id },
            data: { usedAt: new Date() },
          });
        });

        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      const extToken = token as ExtendedJWT;

      if (user) {
        extToken.id = user.id;
        extToken.role = user.role;
        extToken.departmentId = user.departmentId;
      }

      // For Google sign-in, fetch the admin data
      if (account?.provider === "google" && !extToken.role) {
        const admin = await prisma.adminUser.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true, departmentId: true },
        });

        if (admin) {
          extToken.id = admin.id;
          extToken.role = admin.role;
          extToken.departmentId = admin.departmentId;
        }
      }

      return extToken;
    },

    async session({ session, token }) {
      const extToken = token as ExtendedJWT;

      if (extToken.id) {
        session.user.id = extToken.id;
        session.user.role = extToken.role!;
        session.user.departmentId = extToken.departmentId ?? null;
      }

      return session;
    },
  },
});

// Helper function to get the current admin session
export async function getAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session;
}

// Helper function to require admin session
export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

// Helper function to check if user can manage admins (OWNER or ADMIN)
export function canManageAdmins(role: AdminRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

// Helper function to check if user can see all employees
export function canSeeAllEmployees(role: AdminRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

// Helper to hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper to verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
