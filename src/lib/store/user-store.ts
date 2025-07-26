import { create } from "zustand";

export type UserType = {
  userId: string;
  userName: string;
};

type UserStore = {
  user: UserType | undefined;
  resetUser: () => void;
  setUser: (u: UserType  | undefined) => void;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: undefined,
  setUser: (u: UserType | undefined) => set({ user: u }),
  resetUser: () => set({ user: undefined }),
}));
