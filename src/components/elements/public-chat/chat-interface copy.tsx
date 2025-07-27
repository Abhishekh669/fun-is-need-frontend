"use client"

import type React from "react"

import { useRef, useState, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, MessageCircle, X, Reply } from "lucide-react"
import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store"
import toast from "react-hot-toast"
import { useUserStore, type UserType } from "@/lib/store/user-store"
import type { EventType, MessageReplyType, NewPayloadType, ReactionSendPayloadType } from "@/lib/utils/types/chat/types"
import ChatMessage from "./chat-message"
import MessageInput from "./message-input"
import { useGetPublicMessage } from "@/lib/hooks/tanstack-query/query-hook/messages/use-get-message"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useChatStore } from "@/lib/store/use-chat-store"


export default function ChatInterface() {
  const { messages , setMessages} = useChatStore();
  const { user } = useUserStore();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, status, error } = useGetPublicMessage()

  const [replyingTo, setReplyingTo] = useState<MessageReplyType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const parentRef = useRef<HTMLInputElement>(null)
  const { isConnected, send } = useWebSocketConnectionStore()

  const paginatedMessages = useMemo(() => (data ? data.pages.flatMap((page) => page.rows) : []), [data])

  useEffect(()=>{
    if(isLoading || isFetchingNextPage) return;
    if(data){
      setMessages(paginatedMessages)
    }
  },[isLoading, isFetchingNextPage, setMessages, data, paginatedMessages])

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? messages.length + 1 : messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Fixed height for debugging
    overscan: 5,
  })


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const handleReply = (messageToReply: MessageReplyType) => {
    setReplyingTo(messageToReply)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if (!user) {
      toast.success("user not found refresh the page")
      return;
    }
    const reactionPayload: ReactionSendPayloadType = {
      userId: user.userId,
      userName: user.userName,
      messageId,
      emoji
    }

    const eventData: EventType = {
      type: "public_reaction",
      payload: reactionPayload
    }
    send(JSON.stringify(eventData))
    toast.success(`Added reaction ${messageId} ${emoji} to message!`, {
      icon: emoji,
      duration: 1500,
    })
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= paginatedMessages.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    paginatedMessages.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);



  return (
    <div className="flex flex-col h-[500px] sm:h-[650px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Chat Header - Mobile Optimized */}
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
                {messages.length > 0
                  ? `${new Set(messages.map((m) => m.userId)).size} people chatting`
                  : "Be the first to chat!"}
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

      {/* Messages Area - Mobile Optimized */}
      {isFetchingNextPage && (
        <p className="p-4 text-center text-gray-500">Fetching more products...</p>
      )}
      <div
        ref={parentRef}
        className="List"
        style={{
          height: `600px`,
          width: `100%`,
          overflow: 'auto',
          border: '1px solid #ccc'
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const isLoaderRow = virtualRow.index > messages.length - 1;
            const message : NewPayloadType = messages[virtualRow.index];
            if(!user)return null;

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: "16px",
                  borderBottom: '1px solid #eee',
                }}
              >
                {isLoaderRow
                  ? hasNextPage
                    ? 'Loading more...'
                    : 'Nothing more to load'
                  : (
                    <ChatMessage message={message} isCurrentUser={message.userId == user.userId} currentUserId={user.userId} onReply={handleReply} onReaction={handleReaction}  />
                  )}
              </div>
            )
          })}
        </div>
      </div>

      {/* <ScrollArea className="flex-1 h-[450px]  p-3 sm:p-6 ">
        <div className=" inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg"></div>
        </div>
        <div className=" space-y-2">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isCurrentUser={user?.userId === msg.userId}
                currentUserId={user?.userId || ""}
                onReply={handleReply}
                onReaction={handleReaction}
              />
            ))
          ) : (
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
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea> */}

      <MessageInput user={user} isConnected={isConnected} replyingTo={replyingTo} onCancelReply={cancelReply} onScrollToBottom={() => { }} />
    </div>
  )
}