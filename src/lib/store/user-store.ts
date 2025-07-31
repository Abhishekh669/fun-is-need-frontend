import { create } from "zustand";

export type UserType = {
  userId: string;
  userName: string;
};

export type PrivateUserType = {
  userId : string;
  userName : string;
  userEmail : string;
  isAuthenticated  : boolean
  googleId : string
}

type PrivateUserStore = {
  privateUser  : PrivateUserType | undefined;
  resetPrivateUser : () => void;
  setPrivateUser : (user : PrivateUserType) => void
}

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



export const usePrivateUserStore = create<PrivateUserStore>((set, get)=>({
  privateUser : undefined, 
  setPrivateUser : (u ) => set({privateUser : u}),
  resetPrivateUser : ()=> set({privateUser : undefined}) 
}))
