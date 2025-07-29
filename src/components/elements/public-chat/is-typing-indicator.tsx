"use client"
import React from "react"
import { useChatStore } from "@/lib/store/use-chat-store"

const IsTypingIndicator: React.FC = () => {
  const { isTyping } = useChatStore()

  if (!isTyping) return null

  return (
    <div className="px-4 py-3 text-sm text-pink-700 bg-pink-50 border-t border-pink-200 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-semibold">🔥 Someone’s typing something sizzling...</span>
          <span className="text-xs text-pink-500 italic">
            Don’t miss it — could be just for you 🔥
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default React.memo(IsTypingIndicator)