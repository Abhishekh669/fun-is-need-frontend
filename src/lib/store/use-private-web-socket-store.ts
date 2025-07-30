// lib/store/private-websocket-store.ts
'use client';

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { usePrivateUserStore } from "./user-store";

let globalSocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

type PrivateWebSocketConnectionStore = {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastUrl: string | null;
  totalUser: number;
  updateTotaluser: (total: number) => void;
  connect: (url: string) => void;
  send: (data: string) => boolean;
  disconnect: () => void;
  reconnect: () => void;
};

export const usePrivateWebSocketStore = create<PrivateWebSocketConnectionStore>()(
  subscribeWithSelector((set, get) => ({
    totalUser: 0,
    updateTotaluser: (total) => set({ totalUser: total }),
    socket: globalSocket,
    isConnected: globalSocket?.readyState === WebSocket.OPEN || false,
    isConnecting: false,
    lastUrl: null,

    connect: (url: string) => {
      const current = get();
      const user = usePrivateUserStore.getState().privateUser;
      if (!user) {
        console.warn("[PrivateWebSocket] No private user available, cannot connect");
        return;
      }

      url = url + `?userId=${user.userId}&userName=${user.userName}`;

      if (globalSocket && current.lastUrl === url) {
        if (globalSocket.readyState === WebSocket.OPEN) {
          console.log("[PrivateWebSocket] Already connected to", url);
          return;
        }

        if (
          globalSocket.readyState === WebSocket.CLOSING ||
          globalSocket.readyState === WebSocket.CLOSED
        ) {
          globalSocket = null;
        }
      }

      if (current.isConnecting) {
        console.log("[PrivateWebSocket] Connection already in progress");
        return;
      }

      set({ isConnecting: true, lastUrl: url });

      try {
        const socket = new WebSocket(url);
        globalSocket = socket;

        socket.onopen = () => {
          console.log("[PrivateWebSocket] Connected to", url);
          reconnectAttempts = 0;
          set({
            socket,
            isConnected: true,
            isConnecting: false,
          });
        };

        socket.onclose = (event) => {
          console.warn("[PrivateWebSocket] Closed:", event.code, event.reason);
          set({
            socket: null,
            isConnected: false,
            isConnecting: false,
          });

          if (globalSocket === socket) {
            globalSocket = null;
          }
        };

        socket.onerror = (error) => {
          console.error("[PrivateWebSocket] Error:", error);
          set({ isConnecting: false });
        };

        socket.onmessage = (event) => {
          console.log("[PrivateWebSocket] Message received:", event.data);
        };

        set({ socket });
      } catch (err) {
        console.error("[PrivateWebSocket] Connection failed:", err);
        set({ isConnecting: false });
      }
    },

    send: (data: string) => {
      const socket = get().socket;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data);
        return true;
      } else {
        console.warn("[PrivateWebSocket] Cannot send, not connected");
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
        get().connect(process.env.NEXT_PUBLIC_PRIVATE_WEB_SOCKET!);
      } else {
        console.warn("[PrivateWebSocket] No URL to reconnect to");
      }
    },
  }))
);

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (globalSocket) {
      globalSocket.close(1001, "Page unload");
    }
  });
}
