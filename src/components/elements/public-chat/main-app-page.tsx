"use client"

import toast from "react-hot-toast"
import { useGetCheckUserName } from "@/lib/hooks/tanstack-query/query-hook/user/use-get-username"
import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useCreateTempUser } from "@/lib/hooks/tanstack-query/mutate-hook/user/use-create-temp-user"
import { CheckUserFromToken } from "@/lib/actions/user/get/check-token"
import { type UserType, useUserStore } from "@/lib/store/user-store"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import type { EventType, NewEventType, NewPayloadType, PayloadType } from "@/lib/utils/types/chat/types"
import { useChatStore } from "@/lib/store/use-chat-store"
import { Send, Zap, MessageCircle, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Fun Avatar Component with random colors
function FunAvatar({ name, isCurrentUser }: { name: string; isCurrentUser: boolean }) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase()

  const avatarColors = [
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
  ]

  const colorIndex = name.charCodeAt(0) % avatarColors.length
  const avatarColor = isCurrentUser ? "bg-gradient-to-br from-orange-400 to-pink-500" : avatarColors[colorIndex]

  return (
    <div
      className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-lg transform hover:scale-110 transition-all duration-200 ring-2 ring-white`}
    >
      {getInitials(name)}
    </div>
  )
}

// Animated Chat Message Component
function ChatMessage({ message, isCurrentUser }: { message: NewPayloadType; isCurrentUser: boolean }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div
      className={`flex gap-3 mb-6 ${isCurrentUser ? "flex-row-reverse" : "flex-row"} ${isVisible ? "animate-in slide-in-from-bottom-2 duration-300" : "opacity-0"}`}
    >
      {/* Fun Avatar */}
      <FunAvatar name={message.userName} isCurrentUser={isCurrentUser} />

      {/* Message Content */}
      <div className={`max-w-[75%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Username and Time with fun styling */}
        <div className={`flex items-center gap-2 mb-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
          <span
            className={`text-sm font-bold ${isCurrentUser ? "text-orange-600" : "text-purple-600"} hover:scale-105 transition-transform cursor-default`}
          >
            {message.userName} ✨
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {message.createdAt ? formatTime(message.createdAt) : formatTime(new Date())}
          </span>
        </div>

        {/* Fun Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl max-w-full break-words shadow-lg transform hover:scale-[1.02] transition-all duration-200 ${
            isCurrentUser
              ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-br-md shadow-orange-200"
              : "bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-bl-md border border-purple-200"
          }`}
        >
          <p className="text-sm leading-relaxed">{message.message}</p>
        </div>
      </div>
    </div>
  )
}

// Fun Chat Interface Component
function ChatInterface({ user, messages }: { user: UserType | undefined; messages: NewPayloadType[] }) {
  const [message, setMessage] = useState<string>("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected, send } = useWebSocketConnectionStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast.error("Oops! Not connected to the fun zone! 🚫", {
        icon: "🔌",
        style: { background: "#ff6b6b", color: "white" },
      })
      return
    }

    if (!user || message.trim().length === 0) return

    try {
      const payload: PayloadType = {
        userId: user.userId,
        userName: user.userName,
        message: message.trim(),
      }

      const eventData: EventType = {
        type: "public_send_message",
        payload,
      }

      send(JSON.stringify(eventData))
      setMessage("")
      toast.success("Message sent to the fun zone! 🚀", {
        icon: "🎉",
        style: { background: "#4ecdc4", color: "white" },
      })
    } catch (error) {
      toast.error("Oops! Message got lost in space! 🛸", {
        icon: "😅",
        style: { background: "#ff6b6b", color: "white" },
      })
      console.error("Send error:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  return (
    <div className="flex flex-col h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Fun Chat Header */}
      <div className="relative p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageCircle className="w-8 h-8 animate-bounce" />
              <div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"} border-2 border-white`}
              />
            </div>
            <div>
              <h3 className="font-bold text-xl">Fun Zone Chat 🎉</h3>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Users className="w-4 h-4" />
                {messages.length > 0
                  ? `${new Set(messages.map((m) => m.userId)).size} people chatting`
                  : "Be the first to chat!"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isConnected ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"}`}
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
              {isConnected ? "Live & Buzzing!" : "Reconnecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area with fun background */}
      <ScrollArea className="flex-1 p-6 relative">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg"></div>
        </div>
        <div className="relative space-y-2">
          {messages && messages.length > 0 ? (
            messages.map((msg: NewPayloadType, index) => (
              <ChatMessage key={msg.id || index} message={msg} isCurrentUser={user?.userId === msg.userId} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-center py-20">
              <div className="space-y-4">
                <div className="text-6xl animate-bounce">💬</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-purple-600">No messages yet!</h3>
                  <p className="text-gray-600">Be the first to break the ice! 🧊✨</p>
                  <div className="flex justify-center gap-2 text-2xl">
                    <span className="animate-pulse">🎉</span>
                    <span className="animate-pulse delay-100">🚀</span>
                    <span className="animate-pulse delay-200">💫</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Fun Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-t-2 border-purple-200"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type something awesome... ✨"
              className="pr-16 py-3 text-base rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm shadow-lg"
              maxLength={500}
              disabled={!isConnected || !user}
            />
            {isTyping && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={!isConnected || !user || message.trim().length === 0}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Character counter with fun styling */}
        {message.length > 400 && (
          <div className="mt-2 text-center">
            <span
              className={`text-xs px-3 py-1 rounded-full ${message.length > 450 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}
            >
              {500 - message.length} characters left!
              {message.length > 450 ? " 🔥" : " ✍️"}
            </span>
          </div>
        )}
      </form>
    </div>
  )
}

function MainAppPage({ tokenStatus, user }: { tokenStatus: boolean; user: UserType }) {
  const [inputValue, setInputValue] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const { data: userData } = useGetCheckUserName(userName)
  const { mutate: create_temp_user, isPending } = useCreateTempUser()
  const isUsernameValid = userData?.success && userData?.state
  const [open, setOpen] = useState<boolean>(tokenStatus)
  const { setUser } = useUserStore()
  const { messages, addMessage } = useChatStore()

  const { socket, isConnected, connect, send } = useWebSocketConnectionStore()

  // Connect WebSocket when user exists
  useEffect(() => {
    if (isConnected) {
      return
    }
    if (user?.userId) {
      const baseUrl = "ws://localhost:8080/ws"
      connect(baseUrl)
    }
  }, [user, connect, isConnected])

  // Listen to WebSocket messages globally
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event: MessageEvent) => {
      const newEvent: NewEventType = JSON.parse(event.data)
      addMessage(newEvent.payload)
    }

    socket.onmessage = handleMessage

    return () => {
      socket.removeEventListener("message", handleMessage)
    }
  }, [socket, addMessage])

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
            setOpen(false)
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
      {/* Fun Username Modal */}
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl border-2 border-purple-200">
          <DialogHeader className="text-center">
            <div className="text-4xl mb-2">🎭</div>
            <DialogTitle className="text-2xl text-purple-600 font-bold">Join the Fun Zone!</DialogTitle>
            <DialogDescription className="text-gray-600">
              Pick a cool username and let's get this party started! 🎉
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {userName && !isUsernameValid && (
              <div className="bg-gradient-to-r from-red-400 to-pink-400 text-white text-center px-4 py-2 rounded-2xl text-sm font-medium animate-pulse">
                Oops! That name's taken! Try another one! 🔄
              </div>
            )}
            <Label htmlFor="username" className="text-sm text-purple-600 font-semibold">
              Your Fun Username ✨
            </Label>
            <Input
              id="username"
              placeholder="e.g. CoolCat123, FunnyBunny, etc."
              className="bg-white/80 border-2 border-purple-200 rounded-2xl focus:border-purple-400 text-center font-medium"
              value={inputValue}
              onChange={handleInputChange}
              minLength={3}
              maxLength={15}
            />
          </div>
          <Button
            disabled={isPending || userName.trim() === "" || !isUsernameValid}
            onClick={handleCreateTempUser}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating magic...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Let's Go! <Zap className="w-5 h-5" />
              </span>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* App Layout */}
      <div>
        <header className="flex items-center justify-between px-10 lg:px-20 py-6 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-xl">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            fun-is-need
            <span className="text-2xl animate-bounce">🎪</span>
          </h1>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <button className="hover:bg-white/20 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105">
              Private Chat 💬
            </button>
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full px-6"
            >
              Login ✨
            </Button>
          </nav>
        </header>

        {/* Main Chat Container */}
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome to the Fun Zone, {user?.userName || "Guest"}! 🎉
            </h2>
            <p className="text-gray-600 text-lg">
              Where conversations come alive! Drop a message and make some friends!
              <span className="inline-block animate-pulse">💫</span>
            </p>
          </div>

          {/* Fun Chat Interface */}
          <ChatInterface user={user} messages={messages} />
        </div>
      </div>
    </div>
  )
}

export default MainAppPage
