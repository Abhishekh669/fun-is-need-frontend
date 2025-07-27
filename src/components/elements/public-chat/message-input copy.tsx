"use client"
import React, { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Reply, X } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import type { UserType } from "@/lib/store/user-store"
import type { EventType, MessageReplyType } from "@/lib/utils/types/chat/types"

// Memoized Reply Preview Component
const ReplyPreview = React.memo(function ReplyPreview({
  replyingTo,
  onCancel,
}: {
  replyingTo: MessageReplyType
  onCancel: () => void
}) {
  return (
    <div className="px-3 py-2 sm:px-6 sm:py-3 bg-purple-50 border-t border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
          <Reply className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="text-purple-600 font-medium flex-shrink-0">Replying to {replyingTo.senderName}</span>
          <span className="text-gray-500 truncate">{replyingTo.message}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="flex-shrink-0 ml-2">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
})

// Memoized Typing Indicator Component
const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  )
})

// Memoized Character Counter Component
const CharacterCounter = React.memo(function CharacterCounter({ messageLength }: { messageLength: number }) {
  if (messageLength <= 400) return null

  return (
    <div className="mt-2 text-center">
      <span
        className={`text-xs px-2 py-1 sm:px-3 sm:py-1 rounded-full ${
          messageLength > 450 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
        }`}
      >
        {500 - messageLength} characters left!
        {messageLength > 450 ? " 🔥" : " ✍️"}
      </span>
    </div>
  )
})

const MessageInput = React.memo(function MessageInput({
  user,
  isConnected,
  replyingTo,
  onCancelReply,
  onScrollToBottom,
}: {
  user: UserType | undefined
  isConnected: boolean
  replyingTo: MessageReplyType | null
  onCancelReply: () => void
  onScrollToBottom: () => void
}) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { send } = useWebSocketConnectionStore()

  // Focus input when replying
  React.useEffect(() => {
    if (replyingTo) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [replyingTo])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
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
                senderId: replyingTo.senderId,
              }
            : undefined,
        }

        const eventData: EventType = {
          type: "public_send_message",
          payload,
        }
        send(JSON.stringify(eventData))
        setMessage("")
        setIsTyping(false)
        onCancelReply()
        toast.success("Message sent to the fun zone! 🚀", {
          icon: "🎉",
          style: { background: "#4ecdc4", color: "white" },
        })

        // Auto scroll to bottom after sending message
        setTimeout(onScrollToBottom, 100)
      } catch (error) {
        toast.error("Oops! Message got lost in space! 🛸", {
          icon: "😅",
          style: { background: "#ff6b6b", color: "white" },
        })
        console.error("Send error:", error)
      }
    },
    [isConnected, user, message, replyingTo, send, onCancelReply, onScrollToBottom],
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    setIsTyping(value.length > 0)
  }, [])

  return (
    <>
      {/* Reply Preview */}
      {replyingTo && <ReplyPreview replyingTo={replyingTo} onCancel={onCancelReply} />}

      {/* Message Input */}
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
            {isTyping && <TypingIndicator />}
          </div>
          <Button
            type="submit"
            disabled={!isConnected || !user || message.trim().length === 0}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Character counter */}
        <CharacterCounter messageLength={message.length} />
      </form>
    </>
  )
})

export default MessageInput
