"use client"

import { usePrivateUserStore, useUserStore } from '@/lib/store/user-store'
import { redirect } from 'next/navigation'
import React, { useEffect } from 'react'

function PrivateChatWrapper({ children, user }: { children: React.ReactNode, user: { userId: string, userName: string, userEmail: string, isAuthenticated: boolean } }) {
    if (!user || !user.isAuthenticated) {
        return redirect("/login")
    }
    const {setPrivateUser} = usePrivateUserStore();
    useEffect(()=>{
        if(user){
            setPrivateUser(user)
        }
    },[user])

    return (
        <>
            {children}
        </>
    )
}

export default PrivateChatWrapper
