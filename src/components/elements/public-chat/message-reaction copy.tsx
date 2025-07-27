"use client"

import { Badge } from "@/components/ui/badge"
import type { ReactionType } from "@/lib/utils/types/chat/types"

export default function MessageReactions({
  reactions,
  currentUserId,
  onReactionClick,
}: {
  reactions: ReactionType[]
  currentUserId: string
  onReactionClick: (emoji: string) => void
}) {
  if (!reactions || reactions.length === 0) return null

  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, ReactionType[]>,
  )

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some((r) => r.userId === currentUserId)
        return (
          <Badge
            key={emoji}
            variant={hasUserReacted ? "default" : "secondary"}
            className={`cursor-pointer active:scale-110 transition-transform text-xs sm:text-sm ${
              hasUserReacted ? "bg-purple-500 text-white" : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
            }`}
            onClick={() => onReactionClick(emoji)}
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-xs">{reactionList.length}</span>
          </Badge>
        )
      })}
    </div>
  )
}
