"use client"
import type React from "react"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useGetCheckUserName } from "@/lib/hooks/tanstack-query/query-hook/user/use-get-username"
import { useCreateTempUser } from "@/lib/hooks/tanstack-query/mutate-hook/user/use-create-temp-user"
import { CheckUserFromToken } from "@/lib/actions/user/get/check-token"
import { type UserType, useUserStore } from "@/lib/store/user-store"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import { useChatStore } from "@/lib/store/use-chat-store"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import ChatInterface from "./chat-interface"
import UsernameModal from "./user-name-model"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { EventType, NewPayloadType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"
import { useGetPublicMessage } from "@/lib/hooks/tanstack-query/query-hook/messages/use-get-message"

export default function MainAppPage({ tokenStatus, user }: { tokenStatus: boolean; user: UserType }) {
  const [inputValue, setInputValue] = useState("")
  const [userName, setUserName] = useState("")
  const { data: userData } = useGetCheckUserName(userName)
  const { mutate: create_temp_user, isPending } = useCreateTempUser()
  const isUsernameValid = userData?.success && userData?.state
  const [open, setOpen] = useState(tokenStatus)
  const { user: Userdatta, setUser } = useUserStore()
  const { messages, addMessage, setReactionUpdate, setMessages } = useChatStore()
  const { socket, isConnected, connect } = useWebSocketConnectionStore()
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, status, error } = useGetPublicMessage()

  const paginatedMessages = useMemo(() => (data ? data.pages.flatMap((page) => page.rows) : []), [data])

  const parentRef = useRef<HTMLDivElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // For chat, we want newest messages at bottom
  const displayMessages = useMemo(() => [...messages], [messages])

  // Create virtualizer with fixed height
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? displayMessages.length + 1 : displayMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Fixed height for debugging
    overscan: 5,
  })



  useEffect(() => {
    if (isConnected) return
    if (user?.userId) {
      const baseUrl = "ws://localhost:8080/ws"
      connect(baseUrl)
    }
  }, [user, connect, isConnected])
  useEffect(() => {
  if (!isInitialLoad || messages.length === 0) return
  
  const timer = setTimeout(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight
    }
    setIsInitialLoad(false)
  }, 300)

  return () => clearTimeout(timer)
}, [messages.length, isInitialLoad])

  useEffect(() => {
    console.log("Setting messages effect:", {
      isLoading,
      isFetchingNextPage,
      paginatedMessagesLength: paginatedMessages.length,
    })

    if (isLoading && !isFetchingNextPage) return
    setMessages(paginatedMessages || [])

    // Auto-scroll to bottom on initial load
    if (isInitialLoad && paginatedMessages.length > 0) {
      setIsInitialLoad(false)
      setTimeout(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight
        }
      }, 100)
    }
  }, [isLoading, paginatedMessages, isFetchingNextPage, setMessages, isInitialLoad])


  useEffect(() => {
    if (!socket) return
    const handleMessage = (event: MessageEvent) => {
      const newEvent = JSON.parse(event.data)
      console.log("this is new event data :  : ", newEvent.type, " and this is too ", newEvent.payload)
      routeEvent(newEvent)
    }
    socket.onmessage = handleMessage
    return () => {
      socket.removeEventListener("message", handleMessage)
    }
  }, [socket, addMessage])

  function routeEvent(event: EventType) {
    if (event.type === undefined) {
      alert("no type field in the event")
    }
    console.log("this is hte message tpye : ", event.type)
    switch (event.type) {
      case "public_send_message":
        console.log("new message")
        break
      case "public_new_message":
        const payloadData = event.payload as NewPayloadType
        addMessage(payloadData)
        console.log("new message added:", payloadData)

        // Auto-scroll to bottom when new message arrives (if user is near bottom)
        setTimeout(() => {
          if (parentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = parentRef.current
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

            if (isNearBottom) {
              parentRef.current.scrollTop = parentRef.current.scrollHeight
            }
          }
        }, 100)
        break
      case "public_reaction":
        const payload = event.payload as ReactionSendPayloadType
        console.log("this is new reaction hoi payload : ", payload)
        setReactionUpdate(payload)
        toast.success(`reaction is this : ${payload.emoji} `)
        break
      default:
        alert("unsupported message type ")
        break
    }
  }

  const handleCreateTempUser = () => {
    if (!userName) return
    create_temp_user(userName, {
      onSuccess: async (res) => {
        if (res.success && res.message) {
          const data = await CheckUserFromToken()
          if (data.success) {
            toast.success(`Welcome to the fun zone, ${userName}! 🎉`, {
              icon: "🚀",
              style: { background: "#4ecdc4", color: "white" },
            })
            const newUser = data.user
            setUser(newUser)
            setOpen(false)
            const baseUrl = process.env.NEXT_PUBLIC_WEB_SOCKET || "ws://localhost:8080/ws"
            connect(baseUrl)
          } else {
            toast.error("Oops! Something went wrong! 😅")
          }
        } else {
          toast.error("Failed to join the fun! Try again! 🔄")
        }
      },
      onError: () => {
        toast.error("Connection failed! Try again! 🔄")
      },
    })
  }

  useEffect(() => {
    if (inputValue.trim() === "") {
      setUserName("")
      return
    }
    const timeoutId = setTimeout(() => {
      setUserName(inputValue.trim())
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [inputValue])

  useEffect(() => {
    if (user?.userId && user?.userName) {
      setUser(user)
    } else {
      setUser(undefined)
    }
  }, [user, setUser])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <UsernameModal
        open={open}
        inputValue={inputValue}
        isPending={isPending}
        isUsernameValid={isUsernameValid}
        onInputChange={handleInputChange}
        onSubmit={handleCreateTempUser}
      />
      <div>
        <header className="flex items-center justify-between px-4 sm:px-10 lg:px-20 py-4 sm:py-6 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-xl">
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            fun-is-need
            <span className="text-lg sm:text-2xl animate-bounce">🎪</span>
          </h1>
          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
            <button className="hover:bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 transform active:scale-95">
              Private Chat 💬
            </button>
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full px-3 sm:px-6 text-xs sm:text-sm"
            >
              Login ✨
            </Button>
          </nav>
        </header>
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
          <div className="mb-4 sm:mb-6 text-center">
            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome to the Fun Zone, {user?.userName || "Guest"}! 🎉
            </h2>
            <p className="text-sm sm:text-lg text-gray-600">
              Where conversations come alive! Drop a message and make some friends!
              <span className="inline-block animate-pulse">💫</span>
            </p>
          </div>

          {/* Debug Panel */}
          <div className="mb-4 p-4 bg-yellow-100 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Data Status:</strong>
                <div>Paginated Messages: {paginatedMessages.length}</div>
                <div>Store Messages: {messages.length}</div>
                <div>Display Messages: {displayMessages.length}</div>
                <div>Is Loading: {isLoading ? "Yes" : "No"}</div>
                <div>Has Next Page: {hasNextPage ? "Yes" : "No"}</div>
              </div>
              <div>
                <strong>Virtualizer Status:</strong>
                <div>Virtual Items: {rowVirtualizer.getVirtualItems().length}</div>
                <div>Total Size: {rowVirtualizer.getTotalSize()}px</div>
                <div>Count: {rowVirtualizer.options.count}</div>
                {displayMessages.length > 0 && <div>Sample: {displayMessages[0]?.message?.substring(0, 30)}...</div>}
              </div>
            </div>
          </div>

          <ChatInterface
            user={user}
            messages={displayMessages}
            parentRef={parentRef}
            rowVirtualizer={rowVirtualizer}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  )
}














//chat-interafce 

"use client"
import React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Users, MessageCircle, ArrowDown } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import type { UserType } from "@/lib/store/user-store"
import type { EventType, MessageReplyType, NewPayloadType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"
import MessageInput from "./message-input"
import type { Virtualizer } from "@tanstack/react-virtual"

// Memoized Chat Header Component
const ChatHeader = React.memo(function ChatHeader({
  isConnected,
  messageCount,
  uniqueUserCount,
}: {
  isConnected: boolean
  messageCount: number
  uniqueUserCount: number
}) {
  return (
    <div className="relative p-4 sm:p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
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
            className={`inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${isConnected ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
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

// Memoized Virtual Message Item Component
const VirtualMessageItem = React.memo(function VirtualMessageItem({
  virtualRow,
  message,
  isLoaderRow,
  hasNextPage,
  user,
  onReply,
  onReaction,
}: {
  virtualRow: any
  message?: NewPayloadType
  isLoaderRow: boolean
  hasNextPage: boolean
  user: UserType | undefined
  onReply: (message: MessageReplyType) => void
  onReaction: (messageId: string, emoji: string) => void
}) {
  if (isLoaderRow) {
    return (
      <div className="flex items-center justify-center h-full p-4 z-999">
        <div className="text-sm text-gray-500">
          {hasNextPage ? "Scroll up for more messages..." : "You've reached the beginning! 🎉"}
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="p-3">
        <div className="text-red-500 text-sm">Message not foud for index {virtualRow.index}</div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <ChatMessage
        message={message}
        isCurrentUser={user?.userId === message.userId}
        currentUserId={user?.userId || ""}
        onReply={onReply}
        onReaction={onReaction}
      />
    </div>
  )
})

// Memoized Empty State Component
const EmptyState = React.memo(function EmptyState() {
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

// Memoized Loading Indicator Component
const LoadingIndicator = React.memo(function LoadingIndicator() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-purple-50 border-b border-purple-200 p-3">
      <div className="flex items-center justify-center gap-2 text-purple-600">
        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading older messages...</span>
      </div>
    </div>
  )
})

const ChatInterface = React.memo(function ChatInterface({
  user,
  messages,
  parentRef,
  rowVirtualizer,
  hasNextPage,
  isFetchingNextPage,
}: {
  user: UserType | undefined
  messages: NewPayloadType[]
  parentRef: React.RefObject<HTMLDivElement | null>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  hasNextPage: boolean
  isFetchingNextPage: boolean
}) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const { isConnected, send } = useWebSocketConnectionStore()

  console.log("this is hte message  ;" ,messages)

  // Memoize expensive calculations
  const uniqueUserCount = useMemo(() => {
    return new Set(messages.map((m) => m.userId)).size
  }, [messages])

  const virtualItems = useMemo(() => {
    return rowVirtualizer.getVirtualItems()
  }, [rowVirtualizer])

  // Check if user is near bottom to show/hide scroll to bottom button
  const handleScroll = useCallback(() => {
    if (parentRef?.current) {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200
      setShowScrollToBottom(!isNearBottom && messages.length > 0)
    }
  }, [parentRef, messages.length])

  useEffect(() => {
    const scrollElement = parentRef?.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll)
      return () => scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const scrollToBottom = useCallback(() => {
    if (parentRef?.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight
    }
  }, [parentRef])

  const handleReply = useCallback((messageToReply: MessageReplyType) => {
    setReplyingTo(messageToReply)
  }, [])

  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!user) return

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

  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <ChatHeader isConnected={isConnected} messageCount={messages.length} uniqueUserCount={uniqueUserCount} />

      {/* Messages Area with Virtualization */}
      <div className="flex-1  bg-red-600">
        <div>
          hello man
        </div>
        {/* {JSON.stringify(messages)} */}
        <div
          ref={parentRef}
          className="h-full w-full overflow-auto z-100"
          style={{
            contain: 'strict',
            height: '100%', // Ensure full height
            willChange: 'transform' // Performance optimization
          }}
        > hello world
          {/* Loading indicator at top when fetching older messages */}
          {/* Virtualized rendering */}
          {messages.length > 0 ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
              }}
            >

              {virtualItems.map((virtualRow) => {
                const isLoaderRow = virtualRow.index > messages.length - 1
                const message = messages[virtualRow.index]

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="z-990"
                  >
                    {isLoaderRow ? (
                      <div className="flex justify-center p-4">
                        {hasNextPage ? 'Loading more...' : 'No more messages'}
                      </div>
                    ) : (
                      <>
                        <ChatMessage
                          message={message}
                          isCurrentUser={user?.userId === message.userId}
                          currentUserId={user?.userId || ""}
                          onReply={handleReply}
                          onReaction={handleReaction}
                        />

                       
                      </>
                    )}
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
            className="absolute bottom-4 right-4 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform active:scale-95 z-10"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message Input Component */}
      <MessageInput
        user={user}
        isConnected={isConnected}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
        onScrollToBottom={scrollToBottom}
      />
    </div>
  )
})

export default ChatInterface
