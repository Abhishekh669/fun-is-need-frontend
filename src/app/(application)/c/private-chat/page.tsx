"use client"
import { usePrivateWebSocketStore } from '@/lib/store/use-private-web-socket-store';
import { usePrivateUserStore } from '@/lib/store/user-store'
import React from 'react'
function page() {

  const {privateUser} = usePrivateUserStore();
  const {isConnected} = usePrivateWebSocketStore();
    console.log("this ish websocket stats : ", isConnected)
    console.table(privateUser)
  return (
    <div>
      
    </div>
  )
}
export default page

