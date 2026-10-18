import { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import Auth0Provider from "next-auth/providers/auth0";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { User } from "./models/User";

const ROLE_REFRESH_MS = 5 * 60 * 1000;

/** Last sign-in time for the admin user list. Never blocks or fails the sign-in itself. */
function recordLogin(userId: string) {
  User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() }, $inc: { loginCount: 1 } }).catch((error) => {
    console.warn("Couldn't record sign-in time:", error);
  });
}

// Build providers list — only add Auth0 if env vars are configured
const providers: Provider[] = [];

if (process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET) {
  providers.push(
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user || !user.password) {
          throw new Error("No user found");
        }
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
        if (user.status === "suspended") {
          throw new Error("Account suspended");
        }
        recordLogin(user._id.toString());
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar || null,
          role: user.role,
        };
      } catch (error: any) {
        // Re-throw known errors, wrap unknown ones
        if (["Invalid credentials", "No user found", "Invalid password", "Account suspended"].includes(error.message)) {
          throw error;
        }
        console.error("Auth error:", error);
        throw new Error("Authentication failed");
      }
    },
  })
);

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For Auth0 logins, auto-create user in DB if they don't exist
      if (account?.provider === "auth0" && user?.email) {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email.toLowerCase().trim() });
          if (!existingUser) {
            const newUser = await User.create({
              name: user.name || "User",
              email: user.email.toLowerCase().trim(),
              avatar: user.image || "",
              role: "buyer",
              isVerified: true,
            });
            (user as any).role = "buyer";
            (user as any).id = newUser._id.toString();
            user.image = newUser.avatar || null;
          } else {
            if (existingUser.status === "suspended") return "/login?error=Account%20suspended";
            recordLogin(existingUser._id.toString());
            (user as any).role = existingUser.role;
            (user as any).id = existingUser._id.toString();
            user.image = existingUser.avatar || null;
          }
        } catch (error) {
          console.error("Auth0 signIn callback error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.roleCheckedAt = Date.now();
        return token;
      }
      // Re-read the role every few minutes so a demoted or deleted account loses access without
      // waiting for its 30-day token to expire.
      const stale = Date.now() - (Number(token.roleCheckedAt) || 0) > ROLE_REFRESH_MS;
      if (token.id && (stale || trigger === "update")) {
        try {
          await connectToDatabase();
          const current = await User.findById(token.id).select("role name avatar status").lean();
          // Deleted and suspended accounts lose their session at the next check.
          if (!current || current.status === "suspended") {
            token.role = undefined;
            token.id = undefined;
            token.picture = null;
          } else {
            token.role = current.role;
            token.name = current.name;
            token.picture = current.avatar || null;
          }
          token.roleCheckedAt = Date.now();
        } catch (error) {
          // Keep the last known role if the database is briefly unreachable.
          console.error("Role refresh failed:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        session.user.image = token.picture || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
