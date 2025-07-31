import { CheckUserFromToken } from "@/lib/actions/user/get/check-token";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    // async signIn({user, account, profile}){
    //   try {
    //     if(!user || !account || !profile){
    //       throw new Error("Missing user, account, or profile")
    //     }
    //     if (!user.email) {
    //       throw new Error("Email not provided by provider");
    //     }
    //     const userModel = await getUserModel();
    //     const existingUser = await userModel.findOne({email : user.email})
    //     if(!existingUser){
    //       await userModel.create({
    //         email : user.email,
    //         name : user.name,
    //         image : user.image,
    //         userId : profile.sub,
    //         userName : profile.given_name
    //       })
    //     }
    //     return "/onboarding";
    //   } catch (error) {
    //     console.log("Erro in signIn :",error)
    //     return false
    //   }
    // },
    // async jwt({token, user, account}){
    //   if (user && account) {
    //     const userModel = await getUserModel();
    //     const existingUser = await userModel.findOne({ email: user.email });

    //     if (existingUser) {
    //       token.id = existingUser._id?.toString();
    //       token.userId = existingUser.userId;
    //       token.name = existingUser.name;
    //       token.email = existingUser.email;
    //       token.image = existingUser.image;
    //       token.userName = existingUser.userName;
    //     }
    //   }

    //   return token;
    // },
    // async session({session, token}){
    //   if(token.id && session.user){
    //     session.user.id = token.id as string;
    //     session.user.userId = token.userId as string;
    //     session.user.name = token.name as string;
    //     session.user.email = token.email as string;
    //     session.user.image = token.image as string;
    //     session.user.userName = token.userName as string;
    //   }
    //   return session;
    // },

    async jwt({ token, user, profile, account }) {
      if (user && account && profile) {
        const userData = await CheckUserFromToken();
        console.log("this ish the use rdata in session : ", userData, "origina dooglg data : ", user)
        if (userData.success) {
          token.id = userData.user.userId
          token.name = userData.user.userName
        } else {
          token.id = ""
          token.name = user.name;
        }
        token.googleId = profile.sub as string
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.googleId = token.googleId as string
      }
      return session;
    }

  },
  pages: {
    signIn: "/login",
    error: "/api/auth/error",
  }

})