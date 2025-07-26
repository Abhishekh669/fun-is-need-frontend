import { create } from "zustand";
import { NewPayloadType } from "../utils/types/chat/types";


type ChatStore = {
  messages: NewPayloadType[];
  addMessage: (msg: NewPayloadType) => void;
  clearMessages: () => void;
  setMessages: (msgs: NewPayloadType[]) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  clearMessages: () => set({ messages: [] }),
  setMessages: (msgs) => set({ messages: msgs }),
}));
