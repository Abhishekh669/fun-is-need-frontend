import PrivateChatWrapper from '@/components/elements/private-chat/PrivateChatWrapper'
import PrivateWebSocketWrapper from '@/components/elements/private-chat/PrivateWebSocketWrapper'
import { CheckUserFromTokenForPrivate } from '@/lib/actions/user/get/check-token-for-private'
import { auth } from '@/lib/utils/auth/auth'
import { redirect } from 'next/navigation'
import React from 'react'

async function PrivateChatLayout({ children }: { children: React.ReactNode }) {
  const [session, privateUser] = await Promise.all([
    await auth(),
    await CheckUserFromTokenForPrivate()
  ])
  if (!session || !session.user || !privateUser.success || !privateUser.user || privateUser.message !== "user verified") {
    return redirect("/login")
  }
  return (
    <PrivateWebSocketWrapper>
      <PrivateChatWrapper user={privateUser.user}>
        {children}
      </PrivateChatWrapper>
    </PrivateWebSocketWrapper>
  )
}

export default PrivateChatLayout
