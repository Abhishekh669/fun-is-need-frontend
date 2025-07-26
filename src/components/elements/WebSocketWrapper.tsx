// components/elements/WebSocketWrapper.tsx
'use client';

import { useWebSocketConnectionStore } from "@/lib/store/use-web-socket-store";
import React, { useEffect } from "react";
import toast from "react-hot-toast";

function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  const webSocketUrl = process.env.NEXT_PUBLIC_WEB_SOCKET;
  const connect = useWebSocketConnectionStore((state) => state.connect);
  
  

useEffect(() => {
    if (!webSocketUrl) {
        console.error("Missing WebSocket URL");
        toast.error("WebSocket configuration error.");
        return;
    }

    // Only connect if not already connected or connecting
    const currentState = useWebSocketConnectionStore.getState();
    if (!currentState.isConnected && !currentState.isConnecting) {
        connect(webSocketUrl);
    }

    const unsubscribe = useWebSocketConnectionStore.subscribe(
        (state) => state.isConnected,
        (connected, prev) => {
            if (connected && !prev) {
                toast.success("Connected to WebSocket");
            } else if (!connected && prev) {
                toast.error("Disconnected from WebSocket");
                // Optionally attempt to reconnect here
            }
        }
    );

    return () => {
        unsubscribe();
    };
}, [webSocketUrl]); // no dependency on `connect`

  if (!webSocketUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Configuration Error
          </h2>
          <p className="text-gray-600">
            WebSocket URL not configured. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default WebSocketWrapper;
