"use client"
import type { MessageReplyType } from "@/lib/utils/types/chat/types"
import { useState } from "react"

export default function ReplyPreview({ replyTo }: { replyTo: MessageReplyType }) {
  const [showFullMessage, setShowFullMessage] = useState(false)

  // Truncate message if it's longer than 100 characters
  const maxLength = 100
  const shouldTruncate = replyTo.message.length > maxLength
  const displayMessage =
    shouldTruncate && !showFullMessage ? replyTo.message.slice(0, maxLength) + "..." : replyTo.message

  return (
    <div className="bg-gray-100 border-l-4 border-purple-400 p-2 mb-2 rounded-r-lg max-w-full">
      <div className="text-xs text-purple-600 font-semibold mb-1">Replying to {replyTo.senderName}</div>
      <div className="text-xs sm:text-sm text-gray-600">
        <div className="break-words">{displayMessage}</div>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullMessage(!showFullMessage)}
            className="text-purple-500 hover:text-purple-700 text-xs mt-1 underline"
          >
            {showFullMessage ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  )
}
