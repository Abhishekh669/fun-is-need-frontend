// components/elements/PrivateWebSocketWrapper.tsx
'use client';

import { usePrivateWebSocketStore } from "@/lib/store/use-private-web-socket-store";
import { usePrivateUserStore } from "@/lib/store/user-store";
import React, { useEffect } from "react";
import toast from "react-hot-toast";

function PrivateWebSocketWrapper({ children }: { children: React.ReactNode }) {
  const webSocketUrl = process.env.NEXT_PUBLIC_PRIVATE_WEB_SOCKET;
  const {isConnected, connect} = usePrivateWebSocketStore();
  const {privateUser} = usePrivateUserStore();
  console.log("i am in private weobsocket wrapper: ", webSocketUrl)

  useEffect(() => {
    if (!webSocketUrl) {
      console.error("Missing Private WebSocket URL");
      toast.error("Private WebSocket configuration error.");
      return;
    }

    if(!privateUser)return;

    const currentState = usePrivateWebSocketStore.getState();
    console.log("this is hte current state in private socket wrapper : ",currentState)
    if (!currentState.isConnected && !currentState.isConnecting) {
      connect(webSocketUrl);
    }

    const unsubscribe = usePrivateWebSocketStore.subscribe(
      (state) => state.isConnected,
      (connected, prev) => {
        if (connected && !prev) {
          toast.success("Connected to Private WebSocket");
        } else if (!connected && prev) {
          toast.error("Disconnected from Private WebSocket");
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [webSocketUrl, privateUser]);

  console.log("private socket status : ",isConnected)

  if (!webSocketUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Configuration Error
          </h2>
          <p className="text-gray-600">
            Private WebSocket URL not configured. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default PrivateWebSocketWrapper;
