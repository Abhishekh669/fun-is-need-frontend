"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Users, MessageCircle, X, Reply } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import type { UserType } from "@/lib/store/user-store"
import type { EventType, MessageReplyType,  NewPayloadType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"

export default function ChatInterface({ user, messages }: { user: UserType | undefined; messages: NewPayloadType[] }) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
      const payload = {
        userId: user.userId,
        userName: user.userName,
        message: message.trim(),
        replyTo: replyingTo
          ? {
              messageId: replyingTo.messageId,
              message: replyingTo.message,
              senderName: replyingTo.senderName,
              senderId : replyingTo.senderId
            }
          : undefined,
      }

      console.log("this is pyaload before message sending : ", payload)

      const eventData : EventType = {
        type: "public_send_message",
        payload,
      }

      send(JSON.stringify(eventData))
      setMessage("")
      setReplyingTo(null)
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

  const handleReply = (messageToReply: MessageReplyType) => {
    setReplyingTo(messageToReply)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if(!user) {
      toast.success("user not found refresh the page")
      return;
    }
    const reactionPayload : ReactionSendPayloadType = {
      userId : user.userId,
      userName : user.userName,
      messageId,
      emoji 
    }

    const eventData : EventType = {
      type : "public_reaction",
      payload : reactionPayload
    }
    send(JSON.stringify(eventData))
    toast.success(`Added reaction ${messageId} ${emoji} to message!`, {
      icon: emoji,
      duration: 1500,
    })
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Chat Header - Mobile Optimized */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                } border-2 border-white`}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl">Fun Zone Chat 🎉</h3>
              <p className="text-xs sm:text-sm opacity-90 flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                {messages.length > 0
                  ? `${new Set(messages.map((m) => m.userId)).size} people chatting`
                  : "Be the first to chat!"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                isConnected ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
              <span className="hidden sm:inline">{isConnected ? "Live & Buzzing!" : "Reconnecting..."}</span>
              <span className="sm:hidden">{isConnected ? "Live" : "..."}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Mobile Optimized */}
      <ScrollArea className="flex-1 p-3 sm:p-6 relative">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg"></div>
        </div>
        <div className="relative space-y-2">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isCurrentUser={user?.userId === msg.userId}
                currentUserId={user?.userId || ""}
                onReply={handleReply}
                onReaction={handleReaction}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-center py-10 sm:py-20">
              <div className="space-y-4">
                <div className="text-4xl sm:text-6xl animate-bounce">💬</div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-purple-600">No messages yet!</h3>
                  <p className="text-sm sm:text-base text-gray-600">Be the first to break the ice! 🧊✨</p>
                  <div className="flex justify-center gap-2 text-xl sm:text-2xl">
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

      {/* Reply Preview - Mobile Optimized */}
      {replyingTo && (
        <div className="px-3 py-2 sm:px-6 sm:py-3 bg-purple-50 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
              <Reply className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-purple-600 font-medium flex-shrink-0">Replying to {replyingTo.senderName}</span>
              <span className="text-gray-500 truncate">{replyingTo.message}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={cancelReply} className="flex-shrink-0 ml-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input - Mobile Optimized */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-t-2 border-purple-200"
      >
        <div className="flex gap-2 sm:gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              placeholder={replyingTo ? "Type your reply... ↩️" : "Type something awesome... ✨"}
              className="pr-12 sm:pr-16 py-3 text-sm sm:text-base rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm shadow-lg"
              maxLength={500}
              disabled={!isConnected || !user}
            />
            {isTyping && (
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={!isConnected || !user || message.trim().length === 0}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Character counter - Mobile Optimized */}
        {message.length > 400 && (
          <div className="mt-2 text-center">
            <span
              className={`text-xs px-2 py-1 sm:px-3 sm:py-1 rounded-full ${
                message.length > 450 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
              }`}
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
