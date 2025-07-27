"use client"
import type { ReactElement } from "react"
import React from "react"

import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { Users, MessageCircle, ArrowDown, Loader2 } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import { useUserStore } from "@/lib/store/user-store"
import type { EventType, MessageReplyType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"
import MessageInput from "./message-input"
import { useGetPublicMessage } from "@/lib/hooks/tanstack-query/query-hook/messages/use-get-message"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useChatStore } from "@/lib/store/use-chat-store"

// Memoized Chat Header Component
const ChatHeader = React.memo(function ChatHeader({
  isConnected,
  messageCount,
  uniqueUserCount,
}: {
  isConnected: boolean
  messageCount: number
  uniqueUserCount: number
}): ReactElement {
  return (
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
              {messageCount > 0 ? `${uniqueUserCount} people chatting` : "Be the first to chat!"}
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
  )
})

// Memoized Loading Indicator Component
const LoadingIndicator = React.memo(function LoadingIndicator(): ReactElement {
  return (
    <div className="flex items-center justify-center p-4 bg-purple-50 border-b border-purple-200">
      <div className="flex items-center gap-2 text-purple-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading older messages...</span>
      </div>
    </div>
  )
})

// Memoized Empty State Component
const EmptyState = React.memo(function EmptyState(): ReactElement {
  return (
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
  )
})

export default function ChatInterface(): ReactElement {
  const { messages, setMessages } = useChatStore()
  const { user } = useUserStore()
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGetPublicMessage()
  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const parentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isConnected, send } = useWebSocketConnectionStore()

  const paginatedMessages = useMemo(() => (data ? data.pages.flatMap((page) => page.rows) : []), [data])

  // Memoize unique user count
  const uniqueUserCount = useMemo(() => {
    return new Set(messages.map((m) => m.userId)).size
  }, [messages])

  // Create virtualizer with proper chat behavior
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? messages.length + 1 : messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 10,
  })

  // Set messages from paginated data
  useEffect(() => {
    if (isLoading && !isFetchingNextPage) return
    if (data) {
      setMessages(paginatedMessages)
    }
  }, [isLoading, isFetchingNextPage, setMessages, data, paginatedMessages])

  // Auto-scroll to bottom on initial load and new messages
  useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      setIsInitialLoad(false)
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [messages.length, isInitialLoad])

  // Infinite scroll - fetch when scrolling to TOP (for older messages)
  useEffect(() => {
    const [firstItem] = rowVirtualizer.getVirtualItems()
    if (!firstItem) return

    // Check if we're near the top and should fetch more messages
    if (firstItem.index <= 1 && hasNextPage && !isFetchingNextPage) {
      const scrollElement = parentRef.current
      if (scrollElement) {
        const previousScrollHeight = scrollElement.scrollHeight
        const previousScrollTop = scrollElement.scrollTop

        fetchNextPage().then(() => {
          // Maintain scroll position after new messages are loaded
          setTimeout(() => {
            if (scrollElement) {
              const newScrollHeight = scrollElement.scrollHeight
              const heightDifference = newScrollHeight - previousScrollHeight
              scrollElement.scrollTop = previousScrollTop + heightDifference
            }
          }, 50)
        })
      }
    }
  }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, fetchNextPage])

  // Check scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200
      setShowScrollToBottom(!isNearBottom && messages.length > 0)
    }
  }, [messages.length])

  useEffect(() => {
    const scrollElement = parentRef.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll)
      return () => scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  const handleReply = useCallback((messageToReply: MessageReplyType) => {
    setReplyingTo(messageToReply)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!user) {
        toast.error("Please login to react to messages! 🔐")
        return
      }

      const reactionPayload: ReactionSendPayloadType = {
        userId: user.userId,
        userName: user.userName,
        messageId,
        emoji,
      }
      const eventData: EventType = {
        type: "public_reaction",
        payload: reactionPayload,
      }
      send(JSON.stringify(eventData))
      toast.success(`Reacted with ${emoji}!`, {
        icon: emoji,
        duration: 1500,
      })
    },
    [user, send],
  )

  const cancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  // Auto-scroll to bottom when new message is sent
  const handleScrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [scrollToBottom])
console.log("this is pagination message  ;",paginatedMessages)
  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <ChatHeader isConnected={isConnected} messageCount={messages.length} uniqueUserCount={uniqueUserCount} />

      {/* Messages Area */}
      <div className="flex-1 relative">
        <div
          ref={parentRef}
          className="h-full overflow-auto"
          style={{
            contain: "strict",
          }}
        >
          {/* Loading indicator at top when fetching older messages */}
          {isFetchingNextPage && <LoadingIndicator />}

          {/* Messages */}
          {messages.length > 0 ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const isLoaderRow = virtualRow.index > messages.length - 1
                const message = messages[virtualRow.index]

                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <div className="flex items-center justify-center h-full p-4">
                        <div className="text-sm text-gray-500">
                          {hasNextPage ? "Scroll up for more messages..." : "You've reached the beginning! 🎉"}
                        </div>
                      </div>
                    ) : message && user ? (
                      <div className="px-3 py-2">
                        <ChatMessage
                          message={message}
                          isCurrentUser={message.userId === user.userId}
                          currentUserId={user.userId}
                          onReply={handleReply}
                          onReaction={handleReaction}
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 z-10"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        ref={inputRef}
        user={user}
        isConnected={isConnected}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
        onScrollToBottom={handleScrollToBottom}
      />
    </div>
  )
}
