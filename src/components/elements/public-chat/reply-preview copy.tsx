"use client"
import type { MessageReplyType } from "@/lib/utils/types/chat/types"

export default function ReplyPreview({ replyTo }: { replyTo: MessageReplyType }) {
  return (
    <div className="bg-gray-100 border-l-4 border-purple-400 p-2 mb-2 rounded-r-lg">
      <div className="text-xs text-purple-600 font-semibold mb-1">Replying to {replyTo.senderName}</div>
      <div className="text-xs sm:text-sm text-gray-600 truncate">{replyTo.message}</div>
    </div>
  )
}
