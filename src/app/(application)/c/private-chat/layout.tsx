import PrivateChatWrapper from '@/components/elements/private-chat/PrivateChatWrapper'
import { CheckUserFromTokenForPrivate } from '@/lib/actions/user/get/check-token-for-private'
import { auth, signOut } from '@/lib/utils/auth/auth'
import { redirect } from 'next/navigation'
import React from 'react'

async function PrivateChatLayout({ children }: { children: React.ReactNode }) {
  const [session, privateUser] = await Promise.all([
    await auth(),
    await CheckUserFromTokenForPrivate()
  ])

  if (!session || !session.user) {
    return redirect("/login")
  }

  if( !privateUser.success || !privateUser.user || privateUser.message !== "user verified"){
    await signOut();
    return redirect("/")
  }
  return (
    <PrivateChatWrapper user={privateUser.user}>
        {children}
      </PrivateChatWrapper>
  )
}

export default PrivateChatLayout
