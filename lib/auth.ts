// auth.ts
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { headers } from "next/headers"; // 1. Import Next.js headers

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 2. Await the headers API (Required in Next.js 15/16)
      const headersList = await headers();

      // 3. Extract your specific proxy headers safely
      const protocol = headersList.get("x-forwarded-proto") || "https";
      const host =
        headersList.get("x-forwarded-host") || headersList.get("host");

      // 4. Construct the custom base URL manually, falling back to NextAuth's baseUrl
      const inferredBaseUrl = host ? `${protocol}://${host}` : baseUrl;

      // 5. Execute your custom redirect logic based on the inferred proxy URL
      if (url.startsWith("/")) {
        return `${inferredBaseUrl}${url}`;
      } else if (new URL(url).origin === inferredBaseUrl) {
        return url;
      }

      return inferredBaseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
});
