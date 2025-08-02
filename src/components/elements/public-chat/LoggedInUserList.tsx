"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Users, Crown, Loader2, ArrowUp, LogIn, MessageCircle, Heart, UserPlus, X } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import FunAvatar from "./fun-avatar"
import { useGetLoggedInUsers } from "@/lib/hooks/tanstack-query/query-hook/user/use-get-user-from-goolgeId"
import { type LoggedInUsersType, PrivateUserType, usePrivateUserStore, useUserStore } from "@/lib/store/user-store"
import Link from "next/link"
import { addReqeustResponse, FriendPayload, PrivateEventTpye } from "@/lib/utils/types/chat/types"
import { usePrivateWebSocketStore } from "@/lib/store/use-private-web-socket-store"
import { CheckUserFromTokenForPrivate } from "@/lib/actions/user/get/check-token-for-private"
import toast from "react-hot-toast"


export default function UserListCard() {
  const [open, setOpen] = useState(false)
  const [hasEnoughSpace, setHasEnoughSpace] = useState(false)
  const { loggedInUsers, setLoggedInUser, user: currentUser } = useUserStore()
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, error } = useGetLoggedInUsers()
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const parentMobileRef = useRef<HTMLDivElement>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [showMobileScrollToTop, setShowMobileScrollToTop] = useState(false)
  const { privateUser, setPrivateUser } = usePrivateUserStore();
  const { send, isConnected, connect, disconnect, socket } = usePrivateWebSocketStore();
  const privateWebSocketUrl = process.env.NEXT_PUBLIC_PRIVATE_WEB_SOCKET
  var pl = false;

  console.log("private socket : ", isConnected)

  useEffect(() => {
    const fetchPrivateData = async () => {
      pl = true;
      const { user } = await CheckUserFromTokenForPrivate();
      console.log("this is the user  for private user : ", user)
      if (user) {
        const data: PrivateUserType = {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          isAuthenticated: user.isAuthenticated,
          googleId: user.googleId,
          allowToMessage: user.allowMessagesFromNonFriends
        }
        setPrivateUser(data)
      }
      pl = false;
    }

    fetchPrivateData();
  }, [])

  useEffect(() => {
    if (!privateUser || !privateWebSocketUrl) return;
    console.log("this is private user man : ", privateUser)
    connect(privateWebSocketUrl)

    return () => {
      disconnect()
    }
  }, [privateUser, privateWebSocketUrl, connect, disconnect])



  // Check available space on mount and resize
  useEffect(() => {
    const checkSpace = () => {
      if (!containerRef.current) return
      const enoughSpace = window.innerWidth >= 1600 // xl breakpoint
      setHasEnoughSpace(enoughSpace)
    }
    checkSpace()
    window.addEventListener("resize", checkSpace)
    return () => window.removeEventListener("resize", checkSpace)
  }, [])

 const success = data?.pages[0].success;

  const loggedUsers = useMemo(() => {
    if (!data || !data.pages) {
      return []
    }
    const users = data.pages.flatMap((page) => {
      if (!page || !page.rows) {
        return []
      }
      return page.rows
    }) as LoggedInUsersType[]
    return users
  }, [data])

  useEffect(() => {
    if (!isLoading && loggedUsers.length > 0) {
      setLoggedInUser(loggedUsers)
    }
  }, [loggedUsers, setLoggedInUser, isLoading])

  const estimateUserSize = useCallback(() => 68, [])

  // Desktop virtualizer
  const rowVirtualizer = useVirtualizer({
    count: loggedInUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateUserSize,
    overscan: 5,
  })

  // Mobile virtualizer
  const mobileRowVirtualizer = useVirtualizer({
    count: loggedInUsers.length,
    getScrollElement: () => parentMobileRef.current,
    estimateSize: estimateUserSize,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const mobileVirtualItems = mobileRowVirtualizer.getVirtualItems()
  const mobileTotalSize = mobileRowVirtualizer.getTotalSize()

  // Desktop scroll handling
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse()
    if (lastItem?.index >= loggedInUsers.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, loggedInUsers.length, isFetchingNextPage, virtualItems])

  // Mobile scroll handling
  useEffect(() => {
    const [lastItem] = [...mobileVirtualItems].reverse()
    if (lastItem?.index >= loggedInUsers.length - 1 && hasNextPage && !isFetchingNextPage && open) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, loggedInUsers.length, isFetchingNextPage, mobileVirtualItems, open])

  // Desktop scroll to top
  useEffect(() => {
    const element = parentRef.current
    if (!element) return
    const handleScroll = () => setShowScrollToTop(element.scrollTop > 200)
    element.addEventListener("scroll", handleScroll)
    return () => element.removeEventListener("scroll", handleScroll)
  }, [])

  // Mobile scroll to top
  useEffect(() => {
    const element = parentMobileRef.current
    if (!element) return
    const handleScroll = () => setShowMobileScrollToTop(element.scrollTop > 200)
    element.addEventListener("scroll", handleScroll)
    return () => element.removeEventListener("scroll", handleScroll)
  }, [open])

  const scrollToTop = () => {
    parentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToTopMobile = () => {
    parentMobileRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatJoinTime = () => "Active now"

  const handleTalkInPrivate = (user: LoggedInUsersType) => {
    console.log("Talk in private with:", user.userName)
  }

  const handleSendMessage = (user: LoggedInUsersType) => {
    console.log("Send message to:", user.userName)
  }


// Store last friend request times (friendId -> timestamp)
const lastFriendRequestTime: Record<string, number> = {}

const handleAddFriend = async (user: LoggedInUsersType) => {
  if (!user || !privateUser || !isConnected) return;

  const friendId = user.googleId
  const now = Date.now()
  const lastTime = lastFriendRequestTime[friendId] || 0

  // 2 minute = 120000 ms
  if (now - lastTime < 2 * 60 * 1000) {
    const remaining = Math.ceil((2*60*1000 - (now - lastTime)) / 1000)
    alert(`You can send a friend request to this user again in ${remaining} seconds.`)
    return
  }

  // Update last request time
  lastFriendRequestTime[friendId] = now

  const payload: FriendPayload = {
    userId: privateUser.googleId,
    friendId: friendId,
  }

  const event: PrivateEventTpye = {
    type: "add_friend",
    payload,
  }

  console.log("Sending add friend event:", event)
  send(JSON.stringify(event))
}







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
  }, [socket])


  function routeEvent(event: PrivateEventTpye) {
    if (event.type === undefined) {
      alert("no type field in the event")
    }
    switch (event.type) {
      case "add_friend":
        console.log("this is hte evnet in logged user : ", event)
        const addFrnPaylod = event.payload as addReqeustResponse;
        if (addFrnPaylod.alreadyExists) {
          if (privateUser?.googleId == addFrnPaylod.userId) {
            toast.success(`already sent`)
          }
        } else {
          if (privateUser?.googleId == addFrnPaylod.userId) {
            toast.success(`Reqeust to  ${addFrnPaylod.friendName || "user"} sent`)
          } else {
            toast.success(`${addFrnPaylod.friendName || "user"} has sent you friend request. login to see it `)
          }
        }
        break;
      default:
        break;
    }
  }
  console.log("this is private user : ", privateUser)
  const UserItem = ({ user }: { user: LoggedInUsersType }) => {
    if (user.userId === currentUser?.userId) {
      return (
        <div className="flex items-center gap-3 p-2.5 rounded-md bg-amber-50 border border-amber-200">
          <div className="relative flex-shrink-0">
            <FunAvatar name={user.userName} isCurrentUser={true} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate text-sm">{user.userName}</span>
              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">{formatJoinTime()}</span>
              {user.subscription && user.subscription !== "free" && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-blue-600 border-blue-200">
                  {user.subscription}
                </Badge>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
            You
          </Badge>
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-md transition-colors group cursor-pointer">
            <div className="relative flex-shrink-0">
              <FunAvatar name={user.userName} isCurrentUser={false} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate text-sm">{user.userName}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{formatJoinTime()}</span>
                {user.subscription && user.subscription !== "free" && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-blue-600 border-blue-200">
                    {user.subscription}
                  </Badge>
                )}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleTalkInPrivate(user)} className="cursor-pointer">
            <Users className="w-4 h-4 mr-2" />
            Add Friends
          </DropdownMenuItem>
          {user.allowMessagesFromNonFriends && (
            <DropdownMenuItem onClick={() => handleTalkInPrivate(user)} className="cursor-pointer">
              <MessageCircle className="w-4 h-4 mr-2" />
              Talk in Private
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAddFriend(user)} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const LoadingIndicator = () => (
    <div className="flex items-center justify-center py-3">
      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      <span className="text-sm text-gray-500 ml-2">Loading more...</span>
    </div>
  )

  const LoginPrompt = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <LogIn className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-2">Login Required</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">Please login to view active users in the community</p>
      <Link href="/login">
        <Button size="sm" className="gap-2">
          <LogIn className="w-4 h-4" />
          Login
        </Button>
      </Link>
    </div>
  )

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-2">Failed to Load Users</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        {error?.message || "Something went wrong while loading users"}
      </p>
      <Button size="sm" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  )

  const shouldShowLoginPrompt = !success 

  return (
    <div ref={containerRef}>
      {/* Desktop View - Only show when enough space */}
      {hasEnoughSpace ? (
        <div className="w-100 ml-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900">Active Users</h3>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1">
                  {loggedInUsers.length}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="relative">
              <div
                ref={parentRef}
                className="h-96 overflow-y-auto custom-scrollbar"
                style={{ scrollBehavior: "smooth" }}
              >
                {shouldShowLoginPrompt ? (
                  <LoginPrompt />
                )  : loggedInUsers.length > 0 ? (
                  <div style={{ height: `${totalSize}px`, position: "relative" }} className="px-2 py-2">
                    {virtualItems.map((virtualRow) => {
                      const user = loggedInUsers[virtualRow.index]
                      return user ? (
                        <div
                          key={user.id || `user-${virtualRow.index}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="px-2"
                        >
                          <UserItem user={user} />
                        </div>
                      ) : null
                    })}
                  </div>
                ) : !isLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No users online</p>
                    </div>
                  </div>
                ) : null}
                {isFetchingNextPage && <LoadingIndicator />}
              </div>

              {showScrollToTop && (
                <button
                  onClick={scrollToTop}
                  className="absolute top-2 right-2 bg-white text-gray-600 p-1.5 rounded-full shadow-md border border-gray-200 transition-all hover:bg-gray-50 hover:scale-105"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}

              {isLoading && !isFetchingNextPage && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-600">Loading users...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live updates</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3" />
                  Find your perfect partner
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile View - Card instead of Dialog */
        <>
          {/* Floating Action Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="icon"
              onClick={() => setOpen(!open)}
              className="rounded-full shadow-lg h-12 w-12 bg-white text-gray-700 border hover:bg-gray-50 relative"
            >
              <Users className="w-5 h-5" />
              {loggedInUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {loggedInUsers.length > 99 ? "99+" : loggedInUsers.length}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Card - Slides up from bottom */}
          {open && (
            <div className="fixed inset-0 z-40 pointer-events-none">
              <div className="absolute inset-0 bg-black/20 pointer-events-auto " onClick={() => setOpen(false)} />
              <div className="absolute bottom-0 md:left-[20%]  pointer-events-auto animate-in slide-in-from-bottom duration-300">
                <Card className="mx-4 mb-20 max-h-[70vh]  max-w-xl md:w-xl overflow-hidden shadow-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-base text-gray-900">Active Users ({loggedInUsers.length})</h3>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative">
                      <div
                        ref={parentMobileRef}
                        className="h-[50vh] overflow-y-auto custom-scrollbar"
                        style={{ scrollBehavior: "smooth" }}
                      >
                        {shouldShowLoginPrompt ? (
                          <LoginPrompt />
                        ) : error ? (
                          <ErrorState />
                        ) : loggedInUsers.length > 0 ? (
                          <div style={{ height: `${mobileTotalSize}px`, position: "relative" }} className="px-2 py-2">
                            {mobileVirtualItems.map((virtualRow) => {
                              const user = loggedInUsers[virtualRow.index]
                              return user ? (
                                <div
                                  key={user.id || `user-${virtualRow.index}`}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualRow.start}px)`,
                                  }}
                                  className="px-2"
                                >
                                  <UserItem user={user} />
                                </div>
                              ) : null
                            })}
                          </div>
                        ) : !isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-500">
                              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No users online</p>
                            </div>
                          </div>
                        ) : null}
                        {isFetchingNextPage && <LoadingIndicator />}
                      </div>

                      {showMobileScrollToTop && (
                        <button
                          onClick={scrollToTopMobile}
                          className="absolute top-2 right-2 bg-white text-gray-600 p-1.5 rounded-full shadow-md border border-gray-200 transition-all hover:bg-gray-50 hover:scale-105"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isLoading && !isFetchingNextPage && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-600">Loading users...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile Footer */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live updates</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                          <Heart className="w-3 h-3" />
                          Find your perfect partner
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}
