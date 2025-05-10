import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map(email => email.trim())
  .filter(Boolean);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email && ALLOWED_EMAILS.includes(user.email)) {
        return true;
      }
      return false;
    }
  }
});

export { handler as GET, handler as POST }; 