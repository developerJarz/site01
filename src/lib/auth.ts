import { NextAuthOptions, Provider } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Auth0Provider from "next-auth/providers/auth0";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { User } from "./models/User";

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
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      } catch (error: any) {
        // Re-throw known errors, wrap unknown ones
        if (error.message === "Invalid credentials" || error.message === "No user found" || error.message === "Invalid password") {
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
          } else {
            (user as any).role = existingUser.role;
            (user as any).id = existingUser._id.toString();
          }
        } catch (error) {
          console.error("Auth0 signIn callback error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
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
