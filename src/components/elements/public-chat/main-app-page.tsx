"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useGetCheckUserName } from "@/lib/hooks/tanstack-query/query-hook/user/use-get-username"
import { useCreateTempUser } from "@/lib/hooks/tanstack-query/mutate-hook/user/use-create-temp-user"
import { CheckUserFromToken } from "@/lib/actions/user/get/check-token"
import { type UserType, useUserStore } from "@/lib/store/user-store"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import { useChatStore } from "@/lib/store/use-chat-store"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import ChatInterface, { ChildRef } from "./chat-interface"
import UsernameModal from "./user-name-model"
import { DeletePublicMessage, EventType, IsTypingPayload, NewPayloadType, NewUserPayloadType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"




export default function MainAppPage({ tokenStatus, user }: { tokenStatus: boolean; user: UserType }) {


    const { user: UserStore } = useUserStore();
    const [inputValue, setInputValue] = useState("")
    const [userName, setUserName] = useState("")
    const [open, setOpen] = useState(tokenStatus)
    const { setUser } = useUserStore()

    const { addMessage, setReactionUpdate, setIsTyping, isTyping } = useChatStore()
    const { data: userData } = useGetCheckUserName(userName)
    const { socket, isConnected, connect, updateTotaluser, totalUser, reconnect } = useWebSocketConnectionStore()
    const { mutate: create_temp_user, isPending } = useCreateTempUser()

    const isUsernameValid = userData?.success && userData?.state
    const childRef = useRef<ChildRef>(null)



    useEffect(() => {
        if (isConnected) return
        if (user?.userId) {
            reconnect()
        }
    }, [user, connect, isConnected])



    useEffect(() => {
        if (!socket) return

        const handleMessage = (event: MessageEvent) => {
            const newEvent = JSON.parse(event.data)
            console.log("this is new event data :  : ", newEvent.type, " and this is too ", newEvent.payload)
            routeEvent(newEvent)
        }

        socket.onmessage = handleMessage

        return () => {
            socket.removeEventListener("message", handleMessage)
        }
    }, [socket, addMessage])
    console.log("for private  ;", user)

    function routeEvent(event: EventType) {
        if (event.type === undefined) {
            alert("no type field in the event")
        }
        console.log("this is hte message tpye : ", event.type)
        switch (event.type) {
            case "public_send_message":
                console.log("new message")
                break;

            case "public_new_message":
                let payloadData = event.payload as NewPayloadType;
                addMessage(payloadData)
                console.log("new message ")
                break;
            case "public_reaction":
                const payload = event.payload as ReactionSendPayloadType
                console.log("this is new reaction hoi payload : ", payload)
                setReactionUpdate(payload)
                toast.success(`reaction is this : ${payload.emoji} `)
                break;
            case "delete_public_message":
                const deletePayload = event.payload as DeletePublicMessage
                const formattedDate = new Date(deletePayload.prunedUntil).toLocaleString()
                toast.success(`🧹 Deleted ${deletePayload.prunedCount} old messages (until ${formattedDate})`, {
                    icon: "🧼",
                    style: { background: "#ffe066", color: "#333" },
                })
                childRef.current?.triggerAction()
                break;
            case "new_user_join":
                const newUserPayload = event.payload as NewUserPayloadType
                updateTotaluser(newUserPayload.totalUser)
                if (UserStore?.userId === newUserPayload.userId) {
                    toast.success("You have joined successfully")
                } else {
                    toast.success(`${newUserPayload.userName} has joined`)
                }
                break;
            case "delete_user":
                const newDeleteUserPayload = event.payload as NewUserPayloadType
                updateTotaluser(newDeleteUserPayload.totalUser)
                console.log("in private : ", user)
                if (user?.userId == newDeleteUserPayload.userId) {
                    toast.error("You have been disconnected ")
                } else {
                    toast.error(`${newDeleteUserPayload.userName} has been disconnected `)
                }
                break;
            case "is_typing":
                const isTypingPayload = event.payload as IsTypingPayload
                console.log(isTypingPayload)
                setIsTyping(isTypingPayload.isTyping)
                break;
            default:
                alert("unsupported message type ")
                break;
        }
    }


    const handleCreateTempUser = () => {
        if (!userName) return

        create_temp_user(userName, {
            onSuccess: async (res) => {
                if (res.success && res.message) {
                    const data = await CheckUserFromToken()
                    if (data.success) {
                        toast.success(`Welcome to the fun zone, ${userName}! 🎉`, {
                            icon: "🚀",
                            style: { background: "#4ecdc4", color: "white" },
                        })
                        const newUser = data.user
                        setUser(newUser)
                        setOpen(false)
                        const baseUrl = process.env.NEXT_PUBLIC_WEB_SOCKET || "ws://localhost:8080/ws"
                        connect(baseUrl)
                    } else {
                        toast.error("Oops! Something went wrong! 😅")
                    }
                } else {
                    toast.error("Failed to join the fun! Try again! 🔄")
                }
            },
            onError: () => {
                toast.error("Connection failed! Try again! 🔄")
            },
        })
    }

    useEffect(() => {
        if (inputValue.trim() === "") {
            setUserName("")
            return
        }

        const timeoutId = setTimeout(() => {
            setUserName(inputValue.trim())
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [inputValue])

    useEffect(() => {
        if (user?.userId && user?.userName) {
            setUser(user)
        } else {
            setUser(undefined)
        }
    }, [user, setUser])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
            <UsernameModal
                open={open}
                inputValue={inputValue}
                isPending={isPending}
                isUsernameValid={isUsernameValid}
                onInputChange={handleInputChange}
                onSubmit={handleCreateTempUser}
            />

            <div>
                <header className="flex items-center justify-between px-4 sm:px-10 lg:px-20 py-4 sm:py-6 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-xl">
                    <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
                        fun-is-need
                        <span className="text-lg sm:text-2xl animate-bounce">🎪</span>
                    </h1>
                    <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                        <button className="hover:bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 transform active:scale-95">
                            Private Chat 💬
                        </button>
                        <Button
                            variant="secondary"
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full px-3 sm:px-6 text-xs sm:text-sm"
                        >
                            Login ✨
                        </Button>
                    </nav>
                </header>

                <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
                    <div className="mb-4 sm:mb-6 text-center">
                        <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Welcome to the Fun Zone, {user?.userName || "Guest"}! 🎉
                            Total User : {totalUser}
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-600">
                            Where conversations come alive! Drop a message and make some friends!
                            <span className="inline-block animate-pulse">💫</span>
                        </p>
                    </div>

                    {/* <ChatInterface user={user} messages={messages} /> */}
                    <ChatInterface ref={childRef} />
                </div>
            </div>
        </div>
    )
}