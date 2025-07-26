import MainApppPage from '@/components/elements/public-chat/main-app-page'
import { CheckUserFromToken } from '@/lib/actions/user/get/check-token'
import React from 'react'

async function page() {
  const user = await CheckUserFromToken();
  console.log("this is h seru schecking : ",user)
  
  return (
      <MainApppPage  tokenStatus={!user?.success} user={user?.user}/>
  )
}

export default page
