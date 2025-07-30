'use server'

import { signIn } from "@/lib/utils/auth/auth"

export const signInWithGoogle = async() =>{
    await signIn("google", {
        redirectTo: "/onboarding",
      })
}