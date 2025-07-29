
"use client"
import type { ReactElement } from "react"
import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react"
import { Users, MessageCircle, ArrowDown, Loader2 } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import { useUserStore } from "@/lib/store/user-store"
import type { EventType, MessageReplyType, ReactionSendPayloadType, NewPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"
import MessageInput from "./message-input"
import { fetchPublicMessages, useGetPublicMessage } from "@/lib/hooks/tanstack-query/query-hook/messages/use-get-message"
import { useChatStore } from "@/lib/store/use-chat-store"
import { useVirtualizer } from "@tanstack/react-virtual"
import IsTypingIndicator from "./is-typing-indicator"

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
    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
      <div className="flex items-center gap-2 text-purple-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Loading older messages...</span>
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

export interface ChildRef{
triggerAction: () => Promise<void>

}

const  ChatInterface = forwardRef<ChildRef>((props, ref) => {
  const { messages, setMessages, addMessage, setReactionUpdate } = useChatStore()
  const { user } = useUserStore()
  const { isConnected, send, socket } = useWebSocketConnectionStore()
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage , refetch} = useGetPublicMessage()

  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [windowWidth, setWindowWidth] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const isLoadingMoreRef = useRef(false)

  const parentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>(null)
  const lastMessageCountRef = useRef(0)

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Get paginated messages and sort them properly (oldest first, newest last)
  const sortedMessages = useMemo(() => {
    if (!data) return []
    const allMessages = data.pages.flatMap((page) => page.rows)
    // Sort by creation date (oldest first for proper chat display)
    return allMessages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
  }, [data])

  // Set messages from paginated data
  useEffect(() => {
    if (isLoading && !isFetchingNextPage) return
    if (sortedMessages.length > 0) {
      setMessages(sortedMessages)
    }
  }, [sortedMessages, setMessages, isLoading, isFetchingNextPage])

  // Improved dynamic size estimation based on message content
  const estimateMessageSize = useCallback(
    (index: number) => {
      const message = messages[index]
      if (!message) return 140

      let baseHeight = 90 // Increased base message height

      // Add height for reply (more accurate)
      if (message.replyTo) {
        const replyLength = message.replyTo.message?.length || 0
        if (replyLength > 100) {
          baseHeight += 80 // Expandable reply
        } else {
          baseHeight += 65
        }
      }

      // Add height for reactions
      if (message.reactions && message.reactions.length > 0) {
        baseHeight += 45
      }

      // Add height based on message length (more accurate calculation)
      const messageLength = message.message?.length || 0
      const wordsPerLine = 40 // Average words per line
      const extraLines = Math.ceil(messageLength / wordsPerLine)
      baseHeight += Math.max(0, extraLines - 1) * 22 // 22px per extra line

      // Add padding for actions and spacing
      baseHeight += 25

      return Math.max(baseHeight, 140) // Increased minimum height
    },
    [messages],
  )

  // Virtualizer setup for chat with improved dynamic sizing
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateMessageSize,
    overscan: 2, // Further reduced for better performance
    measureElement: (element) => {
      // Measure actual element height for better accuracy
      const height = element?.getBoundingClientRect().height
      return height ?? estimateMessageSize(0)
    },
  })

  useImperativeHandle(ref, ()=>({
    triggerAction : async() =>{
       const data = await fetchPublicMessages(100, 0);
       setMessages(data.rows || [])
    }
  }))

  // Check if user is near bottom
  const checkIfNearBottom = useCallback(() => {
    if (!parentRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
    return distanceFromBottom < 150
  }, [])

  // Improved scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (!parentRef.current) return

    const scrollElement = parentRef.current
    const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight

    if (smooth) {
      scrollElement.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      })
    } else {
      scrollElement.scrollTop = targetScrollTop
    }

    setIsNearBottom(true)
    setShowScrollToBottom(false)
  }, [])

  // Improved scroll handling with better position maintenance
  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoadingMoreRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    // Check if near bottom
    const nearBottom = distanceFromBottom < 150
    setIsNearBottom(nearBottom)
    setShowScrollToBottom(!nearBottom && messages.length > 0)

    // Check if near top for infinite scroll (load older messages)
    const nearTop = scrollTop < 200
    if (nearTop && hasNextPage && !isFetchingNextPage && !isLoading && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true

      // Store current scroll position more precisely
      const currentScrollHeight = scrollHeight
      const currentScrollTop = scrollTop

      fetchNextPage()
        .then(() => {
          // Better scroll position maintenance
          requestAnimationFrame(() => {
            if (parentRef.current) {
              const newScrollHeight = parentRef.current.scrollHeight
              const heightDifference = newScrollHeight - currentScrollHeight
              const newScrollTop = currentScrollTop + heightDifference

              parentRef.current.scrollTop = newScrollTop

              // Double-check after a short delay
              setTimeout(() => {
                if (parentRef.current && Math.abs(parentRef.current.scrollTop - newScrollTop) > 10) {
                  parentRef.current.scrollTop = newScrollTop
                }
                isLoadingMoreRef.current = false
              }, 100)
            } else {
              isLoadingMoreRef.current = false
            }
          })
        })
        .catch(() => {
          isLoadingMoreRef.current = false
        })
    }
  }, [messages.length, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  // Throttled scroll handler with better performance
  useEffect(() => {
    const scrollElement = parentRef.current
    if (!scrollElement) return

    const throttledScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(handleScroll, 16) // 60fps
    }

    scrollElement.addEventListener("scroll", throttledScroll, { passive: true })
    return () => {
      scrollElement.removeEventListener("scroll", throttledScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [handleScroll])

  // Auto-scroll on initial load
   useEffect(() => {
    if (isInitialLoad && messages.length > 0 && !isLoading) {
      setIsInitialLoad(false);
      
      // Wait for both virtual items to render and layout to stabilize
      const attemptScroll = (attempts = 0) => {
        if (attempts >= 5) return; // Max 5 attempts
        
        // Check if we have virtual items rendered
        if (virtualItems.length > 0 && parentRef.current) {
          // Calculate if we're already at bottom (don't scroll if we are)
          const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
          const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
          
          // Only scroll if we're not already near bottom
          if (distanceFromBottom > 100) {
            scrollToBottom(false);
          }
        } else {
          // Try again after a short delay
          setTimeout(() => attemptScroll(attempts + 1), 100 * (attempts + 1));
        }
      };
      
      // Start the attempt
      attemptScroll();
    }
  }, [messages.length, isInitialLoad, isLoading, scrollToBottom]);

  // Improved new message handling
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = lastMessageCountRef.current;

    if (currentMessageCount > previousMessageCount) {
      // Only auto-scroll if:
      // 1. We're near the bottom OR
      // 2. The new message is from the current user
      const shouldScroll = isNearBottom || 
                         (currentMessageCount > 0 && 
                          user && 
                          messages[currentMessageCount - 1]?.userId === user.userId);

      if (shouldScroll && !isLoadingMoreRef.current) {
        // Use a small delay to ensure the message is rendered
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      }
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages.length, isNearBottom, scrollToBottom, user]);
  // Handle WebSocket messages
 

  // Memoize unique user count
  const uniqueUserCount = useMemo(() => {
    return new Set(messages.map((m) => m.userId)).size
  }, [messages])

  const isMobile = useMemo(() => windowWidth > 0 && windowWidth < 640, [windowWidth])

  const handleReply = useCallback((messageToReply: MessageReplyType) => {
    setReplyingTo(messageToReply)
    setTimeout(() => inputRef.current?.focus(), 100)
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
    },
    [user, send],
  )

  const cancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  // Get virtual items
  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      <ChatHeader isConnected={isConnected} messageCount={messages.length} uniqueUserCount={uniqueUserCount} />

      <div className="flex-1 relative bg-white overflow-hidden">
        {/* Loading indicator at top when fetching older messages */}
        {isFetchingNextPage && <LoadingIndicator />}

        <div
          ref={parentRef}
          className="h-full overflow-y-auto overscroll-behavior-y-contain"
          style={{
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {messages.length > 0 ? (
            <div
              style={{
                height: `${totalSize}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const message = messages[virtualRow.index]
                if (!message) return null

                return (
                  <div
                    key={message.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="px-3 py-1" // Reduced padding to prevent overlapping
                  >
                    {user && (
                      <ChatMessage
                        message={message}
                        isCurrentUser={message.userId === user.userId}
                        currentUserId={user.userId}
                        onReply={handleReply}
                        onReaction={handleReaction}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : !isLoading ? (
            <EmptyState />
          ) : null}
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 z-10 animate-in slide-in-from-bottom-2"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="sr-only">Scroll to bottom</span>
          </button>
        )}

        {/* Loading overlay for initial load */}
        {isLoading && !isFetchingNextPage && messages.length === 0 && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Loading messages...</span>
            </div>
          </div>
        )}
      </div>
 <IsTypingIndicator />
      <div className="flex-shrink-0">
        <MessageInput
          ref={inputRef}
          user={user}
          isConnected={isConnected}
          replyingTo={replyingTo}
          onCancelReply={cancelReply}
          onScrollToBottom={() => scrollToBottom(true)}
        />
      </div>
    </div>
  )
}
)

export default ChatInterface