import PrivateMainAppPage from '@/components/elements/private-chat/private-main-app-page';
import PrivateWebSocketWrapper from '@/components/elements/private-chat/PrivateWebSocketWrapper';
import { CheckUserFromTokenForPrivate } from '@/lib/actions/user/get/check-token-for-private'
import { signOut } from '@/lib/utils/auth/auth';
import { redirect } from 'next/navigation';
import React from 'react'
async function page() {
  const privateUser = await CheckUserFromTokenForPrivate();
  if (!privateUser.success || !privateUser.user || privateUser.message !== "user verified") {
    await signOut();
    return redirect("/")
  }
  return (
    <PrivateWebSocketWrapper>
      <PrivateMainAppPage />
    </PrivateWebSocketWrapper>
  )
}
export default page

