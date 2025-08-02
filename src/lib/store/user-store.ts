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
  allowToMessage : boolean,
}


export type LoggedInUsersType =  {
  id : string
  userId : string;
  userName : string;
  email : string;
  googleId : string;
  subscription : string;
  allowMessagesFromNonFriends : boolean
}
type PrivateUserStore = {
  privateUser  : PrivateUserType | undefined;
  resetPrivateUser : () => void;
  setPrivateUser : (user : PrivateUserType) => void
}

type UserStore = {
  user: UserType | undefined;
  loggedInUsers : LoggedInUsersType[],
  addLoggedInUser : (u : LoggedInUsersType) => void,
  setLoggedInUser : (u : LoggedInUsersType[])=>void
  clearLoggedInUsers : () => void,
  resetUser: () => void;
  setUser: (u: UserType  | undefined) => void;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: undefined,
  loggedInUsers : [],
  addLoggedInUser : (u) => set((state)=>(
    {loggedInUsers : [...state.loggedInUsers, u]}
  )),
  setLoggedInUser : (u) => set({loggedInUsers : u}),
  clearLoggedInUsers : ()=> set({loggedInUsers : []}),
  setUser: (u: UserType | undefined) => set({ user: u }),
  resetUser: () => set({ user: undefined }),
}));



export const usePrivateUserStore = create<PrivateUserStore>((set, get)=>({
  privateUser : undefined, 
  setPrivateUser : (u ) => set({privateUser : u}),
  resetPrivateUser : ()=> set({privateUser : undefined}) 
}))
