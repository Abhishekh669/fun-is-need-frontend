"use client"

import { Session } from "next-auth"
import React, { useState } from "react"
import { redirect, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signOut } from "next-auth/react"
import { createNewUser, NewUserType } from "@/lib/actions/user/post/create-new-user"
import toast from "react-hot-toast"

export default function OnboardingPageCompo({ session }: { session: Session }) {
    const router = useRouter()
    const [creating, setCreating] = useState(false)
    
    if (!session || !session.user || !session.user?.googleId) {
        return redirect("/login")
    }
    const { email, image } = session.user
    const [name, setName] = useState(session.user.name || "")

    const handleContinue = async () => {
        console.log("Updated Name:", name)
        if (!session || !session?.user) return;
        const newUserData: NewUserType = {
            userName: name,
            userId: session.user.id!,
            email: session.user.email!,
            image: session.user.image || "",
            googleId : session.user.googleId!,
        }
        setCreating(true)
        try {
            const res = await createNewUser(newUserData)
            if (res.success && res.message) {
                toast.success(res.message)
                router.push("/c/private-chat")
            } else if (res.error && !res.success) {
                toast.error(res.error as string)
            } else {
                toast.error("failed to create user okie ")
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : "Something went wrong while creating the user."
            toast.error(errorMessage)



        } finally {
            setCreating(false)
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardContent className="py-8 px-6 flex flex-col items-center space-y-6">
                    {image && (
                        <div className="w-24 h-24 relative">
                            <Image
                                src={image}
                                alt="User Avatar"
                                fill
                                className="rounded-full object-cover shadow"
                            />
                        </div>
                    )}

                    <div className="w-full">
                        <label className="text-sm text-muted-foreground mb-1 block">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            disabled={creating}
                        />
                    </div>

                    <div className="w-full">
                        <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                        <Input value={email || ""} disabled />
                    </div>

                    <Button
                        className="w-full"
                        disabled={creating}
                        onClick={handleContinue}
                    >
                        {
                            creating ? "creating" : "continue"
                        }
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full text-blue-600"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        Use another account
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
