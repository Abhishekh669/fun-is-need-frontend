"use client"

import { PrivateUserType, usePrivateUserStore, } from '@/lib/store/user-store'
import { redirect } from 'next/navigation'
import React, { useEffect } from 'react'

export interface UserTypeForSession {
    userId: string,
    userName: string,
    userEmail: string,
    isAuthenticated: boolean,
    googleId: string
}


function PrivateChatWrapper({ children, user }: { children: React.ReactNode, user: UserTypeForSession }) {
    if (!user || !user.isAuthenticated) {
        return redirect("/login")
    }

    const { setPrivateUser } = usePrivateUserStore();


    useEffect(() => {
        if (user) {
            const data: PrivateUserType = {
                userId: user.userId,
                userName: user.userName,
                userEmail: user.userEmail,
                isAuthenticated: user.isAuthenticated,
                googleId: user.googleId
            }
            setPrivateUser(data)
        }
    }, [user])

    return (
        <>
            {children}
        </>
    )
}

export default PrivateChatWrapper
