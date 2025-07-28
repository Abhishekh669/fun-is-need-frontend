// lib/store/websocket-connection-store.ts
'use client';

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useUserStore } from "./user-store";

let globalSocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

type WebSocketConnectionStore = {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastUrl: string | null;
  totalUser : number,
  updateTotaluser : (total : number)=> void, 
  connect: (url: string) => void;
  send: (data: string) => boolean;
  disconnect: () => void;
  reconnect: () => void;
};

export const useWebSocketConnectionStore = create<WebSocketConnectionStore>()(
  subscribeWithSelector((set, get) => ({
    totalUser :  0,
    updateTotaluser : (total) => set({totalUser : total}),
    socket: globalSocket,
    isConnected: globalSocket?.readyState === WebSocket.OPEN || false,
    isConnecting: false,
    lastUrl: null,

    // In your websocket-connection-store.ts
    connect: (url: string) => {
      const current = get();
      const user = useUserStore.getState().user;
      if (!user) {
        console.warn("[WebSocket] No user available, cannot connect");
        return;
      }

      url = url + `?userId=${user.userId}&userName=${user.userName}`;

      // Check if we're already connected to the same URL
      if (globalSocket && current.lastUrl === url) {
        if (globalSocket.readyState === WebSocket.OPEN) {
          console.log("[WebSocket] Already connected to", url);
          return;
        }

        // Clean up if in closing/closed state
        if (globalSocket.readyState === WebSocket.CLOSING ||
          globalSocket.readyState === WebSocket.CLOSED) {
          globalSocket = null;
        }
      }

      // Prevent multiple connection attempts
      if (current.isConnecting) {
        console.log("[WebSocket] Connection already in progress");
        return;
      }

      set({ isConnecting: true, lastUrl: url });

      try {
        const socket = new WebSocket(url);
        globalSocket = socket;

        socket.onopen = () => {
          console.log("[WebSocket] Connected to", url);
          reconnectAttempts = 0;
          set({
            socket,
            isConnected: true,
            isConnecting: false,
          });
        };

        socket.onclose = (event) => {
          console.warn("[WebSocket] Closed:", event.code, event.reason);
          set({
            socket: null,
            isConnected: false,
            isConnecting: false,
          });

          // Clean up
          if (globalSocket === socket) {
            globalSocket = null;
          }
        };

        socket.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          set({ isConnecting: false });
        };

        socket.onmessage = (event) => {
          console.log("[WebSocket] Message received:", event.data);
        };

        set({ socket });
      } catch (err) {
        console.error("[WebSocket] Connection failed:", err);
        set({ isConnecting: false });
      }
    },
    send: (data: string) => {
      const socket = get().socket;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data);
        return true;
      } else {
        console.warn("[WebSocket] Cannot send, not connected");
        return false;
      }
    },

    disconnect: () => {
      if (globalSocket) {
        globalSocket.close(1000, "Manual disconnect");
        globalSocket = null;
      }
      reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
      set({
        socket: null,
        isConnected: false,
        isConnecting: false,
        lastUrl: null,
      });
    },

    reconnect: () => {
      const { lastUrl } = get();
      if (lastUrl) {
        reconnectAttempts = 0;
        get().connect(lastUrl);
      } else {
        console.warn("[WebSocket] No URL to reconnect to");
      }
    },
  }))
);

// Graceful shutdown
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (globalSocket) {
      globalSocket.close(1001, "Page unload");
    }
  });
}
