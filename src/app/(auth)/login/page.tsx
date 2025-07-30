import LoginPageCompo from '@/components/elements/auth/login-page-compo'
import { CheckUserFromToken } from '@/lib/actions/user/get/check-token';
import { auth } from '@/lib/utils/auth/auth'
import { redirect } from 'next/navigation';
import React from 'react'

async function LoginPage () {
  const [session, user] = await Promise.all([
    await auth(),
    await CheckUserFromToken()
  ])
  if(user.error || !user.success){
    return redirect("/")
  }  
  if(session)return redirect("/onboarding")
  return (
    <div>
      <LoginPageCompo />
    </div>
  )
}

export default LoginPage
