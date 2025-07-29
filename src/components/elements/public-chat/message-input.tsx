"use client"
import React, { useState, useCallback, forwardRef, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Reply, X, Smile } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import type { UserType } from "@/lib/store/user-store"
import type { EventType, MessageReplyType } from "@/lib/utils/types/chat/types"
import { useChatStore } from "@/lib/store/use-chat-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { emojiCategories } from "@/lib/utils/emoji"
import { ExtendedEmojiPicker } from "./chat-message"
import { Textarea } from "@/components/ui/textarea"

// Memoized Reply Preview Component
const ReplyPreview = React.memo(function ReplyPreview({
  replyingTo,
  onCancel,
}: {
  replyingTo: MessageReplyType
  onCancel: () => void
}) {
  return (
    <div className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
          <Reply className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="text-purple-600 font-medium flex-shrink-0">Replying to {replyingTo.senderName}</span>
          <span className="text-gray-500 truncate">{replyingTo.message}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="flex-shrink-0 ml-2 hover:bg-purple-100">
          <X className="w-4 h-4" />
        </Button>
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
        className={`text-xs px-2 py-1 sm:px-3 sm:py-1 rounded-full transition-colors ${messageLength > 450 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
          }`}
      >
        {500 - messageLength} characters left!
        {messageLength > 450 ? " 🔥" : " ✍️"}
      </span>
    </div>
  )
})



const MessageInput = forwardRef<
  HTMLTextAreaElement,
  {
    user: UserType | undefined
    isConnected: boolean
    replyingTo: MessageReplyType | null
    onCancelReply: () => void
    onScrollToBottom: () => void
  }
>(function MessageInput({ user, isConnected, replyingTo, onCancelReply, onScrollToBottom }, forwardedRef) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const { send } = useWebSocketConnectionStore()
  const {isTyping} = useChatStore();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSent = useRef<number>(0)

  
    const internalTextareaRef = useRef<HTMLTextAreaElement>(null)

 useEffect(() => {
    if (!forwardedRef) return
    
    if (typeof forwardedRef === "function") {
      forwardedRef(internalTextareaRef.current)
    } else {
      forwardedRef.current = internalTextareaRef.current
    }
  }, [forwardedRef])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (internalTextareaRef.current) {
      internalTextareaRef.current.style.height = "auto"
      internalTextareaRef.current.style.height = `${Math.min(
        internalTextareaRef.current.scrollHeight,
        200 // max height
      )}px`
    }
  }, [message])

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && internalTextareaRef.current) {
      setTimeout(() => {
        internalTextareaRef.current?.focus()
      }, 100)
    }
  }, [replyingTo])

  const handleIsTyping = useCallback(async () => {
    if (!isConnected) {
      toast.error("Oops! Not connected to the fun zone! 🚫", {
        icon: "🔌",
        style: { background: "#ff6b6b", color: "white" },
      });
      return;
    }

    const now = Date.now();

    if (now - lastTypingSent.current > 2000) {
      try {
        const event: EventType = {
          type: "is_typing",
          payload: { isTyping: true },
        };
        send(JSON.stringify(event));
        
      } catch (error) {
        console.error("Failed to send typing indicator", error);
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      try {
        const stopTypingEvent: EventType = {
          type: "is_typing",
          payload: { isTyping: false },
        };
        send(JSON.stringify(stopTypingEvent));
      } catch (error) {
        console.error("Failed to send stop typing indicator", error);
      }
    }, 3000);
  }, [isConnected, send]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    handleIsTyping()
  }, [handleIsTyping, setMessage])

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    internalTextareaRef.current?.focus()
  }, [])
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!isConnected) {
        toast.error("Oops! Not connected to the fun zone! 🚫", {
          icon: "🔌",
          style: { background: "#ff6b6b", color: "white" },
        })
        return
      }

      if (!user || message.trim().length === 0 || isSending) return

      setIsSending(true)

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
        onCancelReply()
        setShowEmojiPicker(false)

        toast.success("Message sent! 🚀", {
          icon: "🎉",
          style: { background: "#4ecdc4", color: "white" },
          duration: 2000,
        })

        // Improved auto scroll after sending message
        setTimeout(() => {
          onScrollToBottom()
        }, 100)
      } catch (error) {
        toast.error("Oops! Message got lost in space! 🛸", {
          icon: "😅",
          style: { background: "#ff6b6b", color: "white" },
        })
        console.error("Send error:", error)
      } finally {
        setIsSending(false)
      }
    },
    [isConnected, user, message, replyingTo, send, onCancelReply, onScrollToBottom, isSending],
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(e as any)
      }
    },
    [handleSendMessage],
  )

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
            <div className="relative">
              <Textarea
              ref={internalTextareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={replyingTo ? "Type your reply... ↩️" : "Type something awesome... ✨"}
              className="min-h-[48px] max-h-[200px] pr-12 py-3 text-sm sm:text-base rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-200 focus:shadow-xl resize-none"
              maxLength={500}
              disabled={!isConnected || !user || isSending}
              rows={1}
            />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                disabled={!isConnected || !user}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!isConnected || !user || message.trim().length === 0 || isSending}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>

        {/* Character counter */}
        <CharacterCounter messageLength={message.length} />

        {/* Extended Emoji Picker Dialog */}
        <ExtendedEmojiPicker
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
        />
      </form>
    </>
  )
})

export default MessageInput