"use client"
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePrivateChatStore } from '@/lib/store/use-private-chat-store';
import { usePrivateWebSocketStore } from '@/lib/store/use-private-web-socket-store';
import { usePrivateUserStore } from '@/lib/store/user-store'
import { PrivateEventTpye } from '@/lib/utils/types/chat/types';
import { Send, Smile } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'

function PrivateMainAppPage() {
    const { privateUser } = usePrivateUserStore();
    console.log("this ish te privaet user in teh main page : ",privateUser)
    const { socket, isConnected, connect, updateTotaluser, totalUser, reconnect } = usePrivateWebSocketStore();
    const { messages, setMessages, addMessage } = usePrivateChatStore();

    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)


    const internalTextareaRef = useRef<HTMLTextAreaElement>(null)


    useEffect(() => {
        if (isConnected) return;
        if (privateUser?.userId) {
            reconnect();
        }
    }, [isConnected, privateUser, isConnected])


    useEffect(() => {
        if (!socket) return;
        const handleMessage = (event: MessageEvent) => {
            const newEvent = JSON.parse(event.data)
            routeEvent(newEvent)
            console.log("new event in pr8ivate chat : ", newEvent)
        }

        socket.onmessage = handleMessage

        return () => {
            socket.removeEventListener("message", handleMessage)
        }
    }, [socket])

    const handleSendMessage = (e : React.FormEvent) =>{
        e.preventDefault();

    }

      const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value)
        // handleIsTyping()
      }, [ setMessage])

        const handleKeyPress = useCallback(
          (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(e as any)
            }
          },
          [handleSendMessage],
        )

    function routeEvent(event: PrivateEventTpye) {
        if (event.type == undefined || !event.type) {
            alert("no type filed inth event")
        }

        switch (event.type) {
            case "private_send_message":
                console.log("new messsage ; ")
                break;
            default:
                alert("unsuported type in privte chat ")
                break;
        }
    }


    return (
        <div>


            <div className="flex gap-2 sm:gap-3 items-end">
                <div className="flex-1 relative">
                    <div className="relative">
                        <Textarea
                            ref={internalTextareaRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            className="min-h-[48px] max-h-[200px] pr-12 py-3 text-sm sm:text-base rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-200 focus:shadow-xl resize-none"
                            maxLength={500}
                            rows={1}
                        />
                        <Button
                            type="button"
                            onClick={() => setShowEmojiPicker(true)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                        >
                            <Smile className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                <Button
                    type="submit"
                    className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                >
                    {isSending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </Button>
            </div>
        </div>
    )
}

export default PrivateMainAppPage
