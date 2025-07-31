// types/next-auth.d.ts
import NextAuth from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      googleId: string
    } & Session["user"] // 👈 inherit built-in fields (name, email, etc.)
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    googleId: string
  }
}
