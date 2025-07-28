"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import React from "react"
import { Smile, Reply, MoreHorizontal } from "lucide-react"
import type { MessageReplyType, NewPayloadType, ReactionType } from "@/lib/utils/types/chat/types"
import toast from "react-hot-toast"
import FunAvatar from "./fun-avatar"
import ReplyPreview from "./reply-preview"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { emojiCategories } from "@/lib/utils/emoji"

// Enhanced Message Reactions with "more" functionality
const MessageReactionsWithMore = React.memo(function MessageReactionsWithMore({
  reactions,
  currentUserId,
  onReactionClick,
  onShowMore,
}: {
  reactions: ReactionType[]
  currentUserId: string
  onReactionClick: (emoji: string) => void
  onShowMore: () => void
}) {
  if (!reactions || reactions.length === 0) return null

  // Group reactions by emoji
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

  const reactionEntries = Object.entries(groupedReactions)
  const shouldShowMore = reactionEntries.length > 3
  const displayedReactions = shouldShowMore ? reactionEntries.slice(0, 3) : reactionEntries

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {displayedReactions.map(([emoji, reactionList]) => {
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
      {shouldShowMore && (
        <Badge
          variant="outline"
          className="cursor-pointer active:scale-110 transition-transform text-xs sm:text-sm bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border-dashed"
          onClick={onShowMore}
        >
          <span className="text-gray-600">+{reactionEntries.length - 3} more...</span>
        </Badge>
      )}
    </div>
  )
})

// Reactions List for Dialog
const ReactionsList = React.memo(function ReactionsList({
  reactions,
  currentUserId,
  onReactionClick,
}: {
  reactions: ReactionType[]
  currentUserId: string
  onReactionClick: (emoji: string) => void
}) {
  if (!reactions || reactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">😔</div>
        <p className="text-sm">No reactions yet!</p>
      </div>
    )
  }

  // Group reactions by emoji
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
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some((r) => r.userId === currentUserId)
        return (
          <div
            key={emoji}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {reactionList.slice(0, 3).map((reaction, index) => (
                    <span key={index} className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                      {reaction.userName}
                    </span>
                  ))}
                  {reactionList.length > 3 && (
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      +{reactionList.length - 3} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {reactionList.length} {reactionList.length === 1 ? "person" : "people"} reacted
                </p>
              </div>
            </div>
            <button
              onClick={() => onReactionClick(emoji)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors active:scale-95 ${
                hasUserReacted
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {hasUserReacted ? "Remove" : "Add"}
            </button>
          </div>
        )
      })}
    </div>
  )
})

// Extended Emoji Picker Dialog
const ExtendedEmojiPicker = React.memo(function ExtendedEmojiPicker({
  open,
  onOpenChange,
  onEmojiSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmojiSelect: (emoji: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-purple-200 max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-purple-600 text-center">Choose Your Emoji 🎭</DialogTitle>
        </DialogHeader>
        <div className="py-4 overflow-y-auto max-h-[60vh]">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">{category}</h3>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 px-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={`${category}-${index}`}
                    onClick={() => onEmojiSelect(emoji)}
                    className="text-xl sm:text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 aspect-square flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
})

const ChatMessage = React.memo(function ChatMessage({
  message,
  isCurrentUser,
  currentUserId,
  onReply,
  onReaction,
}: {
  message: NewPayloadType
  isCurrentUser: boolean
  currentUserId: string
  onReply: (message: MessageReplyType) => void
  onReaction?: (messageId: string, emoji: string) => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [showReactionsDialog, setShowReactionsDialog] = useState(false)
  const [showExtendedEmojiPicker, setShowExtendedEmojiPicker] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Close actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
        setShowMoreOptions(false)
      }
    }

    if (showEmojiPicker || showMoreOptions) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [showEmojiPicker, showMoreOptions])

  const formatTime = useCallback((timestamp: string | Date) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }, [])

  const handleReply = useCallback(() => {
    const payload: MessageReplyType = {
      senderId: message.userId,
      senderName: message.userName,
      messageId: message.id,
      message: message.message,
    }
    onReply(payload)
    setShowMoreOptions(false)
    toast.success("Reply mode activated! 💬", {
      icon: "↩️",
      duration: 1500,
    })
  }, [message, onReply])

  const handleReaction = useCallback(
    (emoji: string) => {
      const existingReaction = message.reactions?.find((r) => r.userId === currentUserId)
      // If the same emoji was already sent by this user, remove it
      if (existingReaction?.emoji === emoji) {
        emoji = ""
      }

      if (onReaction) {
        onReaction(message.id, emoji)
      }

      // Close all popovers after reaction
      setShowEmojiPicker(false)
      setShowMoreOptions(false)
      setShowExtendedEmojiPicker(false)

      if (emoji) {
        toast.success(`Reacted with ${emoji}!`, {
          icon: emoji,
          duration: 1500,
        })
      }
    },
    [message, currentUserId, onReaction],
  )

  const handleMoreOptions = useCallback(
    (action: string) => {
      setShowMoreOptions(false)
      switch (action) {
        case "copy":
          navigator.clipboard?.writeText(message.message)
          toast.success("Message copied! 📋", { duration: 1500 })
          break
        case "report":
          toast.success("Message reported! 🚨", { duration: 1500 })
          break
        case "reactions":
          setTimeout(() => {
            setShowReactionsDialog(true)
          }, 0)
          break
        case "moreEmojis":
          setTimeout(() => {
            setShowExtendedEmojiPicker(true)
          }, 0)
          break
        default:
          break
      }
    },
    [message.message],
  )

  return (
    <div
      className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${isCurrentUser ? "flex-row-reverse" : "flex-row"} ${
        isVisible ? "animate-in slide-in-from-bottom-2 duration-300" : "opacity-0"
      }`}
    >
      {/* Fun Avatar */}
      <div className="flex-shrink-0">
        <FunAvatar name={message.userName} isCurrentUser={isCurrentUser} />
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[75%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col relative min-w-0`}
        ref={actionsRef}
      >
        {/* Username and Time */}
        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
          <span
            className={`text-xs sm:text-sm font-bold ${
              isCurrentUser ? "text-orange-600" : "text-purple-600"
            } transition-transform cursor-default`}
          >
            {message.userName} ✨
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {message.createdAt ? formatTime(message.createdAt) : formatTime(new Date())}
          </span>
        </div>

        {/* Reply Preview */}
        {message.replyTo && (
          <div className="w-full mb-2">
            <ReplyPreview replyTo={message.replyTo} />
          </div>
        )}

        {/* Message Container with Actions */}
        <div className="relative flex items-start gap-2 w-full">
          {/* Left Side Actions (for current user messages) */}
          {isCurrentUser && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Emoji Reaction Button */}
              <div className="relative">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                    >
                      <Smile className="h-3.5 w-3.5 text-purple-500" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Add Reaction
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" side="top" align="center">
                    <div className="flex gap-2">
                      {["👍", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className="text-lg p-1 hover:bg-gray-100 rounded transition-colors active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Reply Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                onClick={handleReply}
              >
                <Reply className="h-3.5 w-3.5 text-purple-500" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Reply
                </div>
              </Button>

              {/* More Options Button */}
              <div className="relative">
                <Popover open={showMoreOptions} onOpenChange={setShowMoreOptions}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-purple-500" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        More Options
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-2" side="top" align="center">
                    <div className="space-y-1">
                      <button
                        onClick={handleReply}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        💬 Reply to Message
                      </button>
                      <button
                        onClick={() => handleMoreOptions("moreEmojis")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        😀 More Emojis
                      </button>
                      <button
                        onClick={() => handleMoreOptions("reactions")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        😊 View All Reactions
                      </button>
                      <button
                        onClick={() => handleMoreOptions("copy")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        📋 Copy Message
                      </button>
                      <button
                        onClick={() => handleMoreOptions("report")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600"
                      >
                        🚨 Report Message
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words shadow-lg transition-all duration-200 flex-1 min-w-0 ${
              isCurrentUser
                ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-br-md shadow-orange-200"
                : "bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-bl-md border border-purple-200"
            }`}
          >
            <p className="text-sm leading-relaxed break-words">{message.message}</p>
          </div>

          {/* Right Side Actions (for other users' messages) */}
          {!isCurrentUser && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Emoji Reaction Button */}
              <div className="relative">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                    >
                      <Smile className="h-3.5 w-3.5 text-purple-500" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Add Reaction
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" side="top" align="center">
                    <div className="flex gap-2">
                      {["👍", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className="text-lg p-1 hover:bg-gray-100 rounded transition-colors active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Reply Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                onClick={handleReply}
              >
                <Reply className="h-3.5 w-3.5 text-purple-500" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Reply
                </div>
              </Button>

              {/* More Options Button */}
              <div className="relative">
                <Popover open={showMoreOptions} onOpenChange={setShowMoreOptions}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full relative group"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-purple-500" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        More Options
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-2" side="top" align="center">
                    <div className="space-y-1">
                      <button
                        onClick={handleReply}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        💬 Reply to Message
                      </button>
                      <button
                        onClick={() => handleMoreOptions("moreEmojis")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        😀 More Emojis
                      </button>
                      <button
                        onClick={() => handleMoreOptions("reactions")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        😊 View All Reactions
                      </button>
                      <button
                        onClick={() => handleMoreOptions("copy")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-sm"
                      >
                        📋 Copy Message
                      </button>
                      <button
                        onClick={() => handleMoreOptions("report")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600"
                      >
                        🚨 Report Message
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Message Reactions */}
        <div className="w-full">
          <MessageReactionsWithMore
            reactions={message.reactions || []}
            currentUserId={currentUserId}
            onReactionClick={handleReaction}
            onShowMore={() => setShowReactionsDialog(true)}
          />
        </div>

        {/* Reactions Dialog */}
        <Dialog open={showReactionsDialog} onOpenChange={setShowReactionsDialog}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl border-2 border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-purple-600 text-center">Message Reactions 🎭</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ReactionsList
                reactions={message.reactions || []}
                currentUserId={currentUserId}
                onReactionClick={(emoji) => {
                  handleReaction(emoji)
                  setShowReactionsDialog(false)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Extended Emoji Picker Dialog */}
        <ExtendedEmojiPicker
          open={showExtendedEmojiPicker}
          onOpenChange={setShowExtendedEmojiPicker}
          onEmojiSelect={handleReaction}
        />
      </div>
    </div>
  )
})

export default ChatMessage
