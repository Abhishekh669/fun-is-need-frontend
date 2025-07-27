"use client"
import type { ReactElement } from "react"
import React from "react"
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { Users, MessageCircle, ArrowDown, Loader2 } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import { useUserStore } from "@/lib/store/user-store"
import type { EventType, MessageReplyType, ReactionSendPayloadType, NewPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"
import MessageInput from "./message-input"
import { useGetPublicMessage } from "@/lib/hooks/tanstack-query/query-hook/messages/use-get-message"
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

export default function ChatInterface(): ReactElement {
  const { messages, setMessages, addMessage, setReactionUpdate } = useChatStore()
  const { user } = useUserStore()
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useGetPublicMessage()
  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [userScrolledUp, setUserScrolledUp] = useState(false) // Track if user deliberately scrolled up
  const [windowWidth, setWindowWidth] = useState(0)
  const parentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isConnected, send, socket } = useWebSocketConnectionStore()

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Set initial width
    setWindowWidth(window.innerWidth)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Get paginated messages and sort them properly for chat display
  const paginatedMessages = useMemo(() => {
    if (!data) return []
    const allMessages = data.pages.flatMap((page) => page.rows)
    // Sort by creation date (oldest first, newest last for chat display)
    return allMessages.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
  }, [data])

  console.log("this is paginated message : ", paginatedMessages)

  // Memoize unique user count
  const uniqueUserCount = useMemo(() => {
    return new Set(messages.map((m) => m.userId)).size
  }, [messages])

  // Set messages from paginated data
  useEffect(() => {
    if (isLoading && !isFetchingNextPage) return
    if (paginatedMessages.length > 0) {
      setMessages(paginatedMessages)
    }
  }, [paginatedMessages, setMessages, isLoading, isFetchingNextPage])

  // Detect if we're on mobile - now reactive
  const isMobile = useMemo(() => {
    return windowWidth > 0 && windowWidth < 640 // sm breakpoint
  }, [windowWidth])

  // Smooth scroll to bottom function with mobile-specific offset
  const scrollToBottom = useCallback(
    (smooth = true, customOffset?: number) => {
      if (parentRef.current) {
        const scrollElement = parentRef.current
        // Use different offsets for mobile vs desktop
        const defaultOffset = isMobile ? 80 : 50 // More space on mobile
        const offset = customOffset !== undefined ? customOffset : defaultOffset
        const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight - offset

        console.log("Scrolling to bottom:", {
          scrollHeight: scrollElement.scrollHeight,
          clientHeight: scrollElement.clientHeight,
          offset,
          targetScrollTop,
          isMobile,
        })

        scrollElement.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: smooth ? "smooth" : "auto",
        })

        // Reset user scrolled up state when scrolling to bottom
        setUserScrolledUp(false)
      }
    },
    [isMobile],
  )

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && !isLoading) {
      setIsInitialLoad(false)
      setTimeout(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight
        }
      }, 100)
    }
  }, [messages.length, isInitialLoad, isLoading])

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const newEvent = JSON.parse(event.data)
        console.log("WebSocket event received:", newEvent.type, newEvent.payload)

        switch (newEvent.type) {
          case "public_new_message":
            const newMessage = newEvent.payload as NewPayloadType
            addMessage(newMessage)
            console.log("New message added:", newMessage)

            // SIMPLIFIED AND MORE AGGRESSIVE AUTO-SCROLL LOGIC
            setTimeout(() => {
              if (parentRef.current) {
                const isUserMessage = newMessage.userId === user?.userId
                const { scrollTop, scrollHeight, clientHeight } = parentRef.current
                const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

                console.log("🔍 Auto-scroll analysis:", {
                  isUserMessage,
                  userScrolledUp,
                  distanceFromBottom,
                  isMobile,
                  scrollTop,
                  scrollHeight,
                  clientHeight,
                  windowWidth,
                })

                // MUCH MORE AGGRESSIVE AUTO-SCROLL CONDITIONS:
                // 1. Always scroll for user's own messages
                // 2. For others' messages: only DON'T scroll if user is REALLY far up (800px+ on mobile, 600px+ on desktop)
                const reallyScrolledUp = distanceFromBottom > (isMobile ? 800 : 600)
                const shouldAutoScroll = isUserMessage || !reallyScrolledUp

                console.log("🚀 Auto-scroll decision:", {
                  shouldAutoScroll,
                  reallyScrolledUp,
                  threshold: isMobile ? 800 : 600,
                })

                if (shouldAutoScroll) {
                  console.log("✅ AUTO-SCROLLING to new message")
                  const mobileOffset = isMobile ? 60 : 30

                  // Immediate scroll
                  scrollToBottom(false, mobileOffset)

                  // Multiple smooth scroll attempts
                  setTimeout(() => scrollToBottom(true, mobileOffset), 50)
                  setTimeout(() => scrollToBottom(true, mobileOffset), 150)
                  setTimeout(() => scrollToBottom(true, mobileOffset), 300)
                  setTimeout(() => scrollToBottom(true, mobileOffset), 500)
                } else {
                  console.log("❌ NOT auto-scrolling - user is really far up")
                }
              }
            }, 10) // Very fast initial response
            break

          case "public_reaction":
            const reactionPayload = newEvent.payload as ReactionSendPayloadType
            console.log("Reaction received:", reactionPayload)
            setReactionUpdate(reactionPayload)
            toast.success(`Reaction: ${reactionPayload.emoji}`, {
              icon: reactionPayload.emoji,
              duration: 1500,
            })
            break

          default:
            console.log("Unknown WebSocket event type:", newEvent.type)
            break
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    socket.onmessage = handleMessage
    return () => {
      if (socket.onmessage === handleMessage) {
        socket.onmessage = null
      }
    }
  }, [socket, addMessage, setReactionUpdate, scrollToBottom, user?.userId, userScrolledUp, isMobile, windowWidth])

  // Handle scroll events for infinite scroll and scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
    const nearBottom = distanceFromBottom <= (isMobile ? 400 : 300)
    const isNearTop = scrollTop <= 100

    // SIMPLIFIED: Only consider user "scrolled up" if they're REALLY far from bottom
    const reallyScrolledUp = distanceFromBottom > (isMobile ? 700 : 500)
    setUserScrolledUp(reallyScrolledUp)

    // Show/hide scroll to bottom button
    setShowScrollToBottom(!nearBottom && messages.length > 0)

    // Infinite scroll: fetch older messages when near top
    if (isNearTop && hasNextPage && !isFetchingNextPage && !isLoading) {
      console.log("Fetching next page...")
      const previousScrollHeight = scrollHeight
      const previousScrollTop = scrollTop

      fetchNextPage().then(() => {
        // Maintain scroll position after loading older messages
        setTimeout(() => {
          if (parentRef.current) {
            const newScrollHeight = parentRef.current.scrollHeight
            const heightDifference = newScrollHeight - previousScrollHeight
            parentRef.current.scrollTop = previousScrollTop + heightDifference
          }
        }, 100)
      })
    }
  }, [messages.length, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, isMobile])

  // Throttled scroll handler for better performance
  const throttledHandleScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 50) // Even faster response
    }
  }, [handleScroll])

  useEffect(() => {
    const scrollElement = parentRef.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", throttledHandleScroll, { passive: true })
      return () => scrollElement.removeEventListener("scroll", throttledHandleScroll)
    }
  }, [throttledHandleScroll])

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

      if (emoji) {
        toast.success(`Reacted with ${emoji}!`, {
          icon: emoji,
          duration: 1500,
        })
      }
    },
    [user, send],
  )

  const cancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleScrollToBottom = useCallback(() => {
    const mobileOffset = isMobile ? 40 : 20
    scrollToBottom(true, mobileOffset)
  }, [scrollToBottom, isMobile])

  console.log("Chat Interface Debug:", {
    messagesLength: messages.length,
    paginatedMessagesLength: paginatedMessages.length,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    user: user?.userName,
    userScrolledUp,
    isMobile,
    windowWidth,
  })

  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <ChatHeader isConnected={isConnected} messageCount={messages.length} uniqueUserCount={uniqueUserCount} />

      {/* Messages Area */}
      <div className="flex-1 relative bg-white overflow-hidden">
        <div
          ref={parentRef}
          className="h-full overflow-y-auto overscroll-behavior-y-contain"
          style={{
            scrollBehavior: "smooth",
          }}
        >
          {/* Loading indicator at top when fetching older messages */}
          {isFetchingNextPage && <LoadingIndicator />}

          {/* Messages Container */}
          <div className="min-h-full">
            {messages.length > 0 ? (
              <div className="p-3 space-y-2 pb-4 sm:pb-6">
                {messages.map((message, index) => (
                  <div key={`${message.id}-${index}`} className="animate-in slide-in-from-bottom-2 duration-300">
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
                ))}
                {/* Extra padding at bottom for mobile */}
                <div className="h-4 sm:h-2" />
              </div>
            ) : !isLoading ? (
              <EmptyState />
            ) : null}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={handleScrollToBottom}
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

      {/* Message Input - Always visible */}
      <div className="flex-shrink-0">
        <MessageInput
          ref={inputRef}
          user={user}
          isConnected={isConnected}
          replyingTo={replyingTo}
          onCancelReply={cancelReply}
          onScrollToBottom={handleScrollToBottom}
        />
      </div>
    </div>
  )
}
