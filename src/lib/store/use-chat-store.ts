import { create } from "zustand";
import { NewPayloadType, ReactionSendPayloadType } from "../utils/types/chat/types";


type ChatStore = {
  messages: NewPayloadType[];
  loadMessages : () => void;
  addMessage: (msg: NewPayloadType) => void;
  clearMessages: () => void;
  setMessages: (msgs: NewPayloadType[]) => void;
  setReactionUpdate: (data: ReactionSendPayloadType ) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loadMessages : () =>{
      
  },
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  clearMessages: () => set({ messages: [] }),
  setMessages: (msgs) => set({ messages: msgs }),
  setReactionUpdate: (data) => set({
  messages: get().messages.map((m) => {
    if (m.id === data.messageId) {
      // If emoji is empty, remove user's reaction
      if (data.emoji === "") {
        return {
          ...m,
          reactions: (m.reactions || []).filter(r => r.userId !== data.userId),
        };
      }

      // Otherwise, update or add user's reaction
      const existing = (m.reactions || []).some(r => r.userId === data.userId);
      const updatedReactions = existing
        ? m.reactions.map(r =>
            r.userId === data.userId ? { ...r, emoji: data.emoji } : r
          )
        : [...(m.reactions || []), {
            emoji: data.emoji,
            userName: data.userName,
            userId: data.userId,
          }];

      return {
        ...m,
        reactions: updatedReactions,
      };
    }
    return m;
  })
})


}));
