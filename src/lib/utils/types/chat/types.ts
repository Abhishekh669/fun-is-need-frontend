
export type EventType = {
    type: "is_typing" |  "public_send_message" | "private_send_message" | "public_new_message" | "new_user_join" | "public_reply_message" | "public_reaction" | 'delete_public_message' | "delete_user"
    payload:IsTypingPayload |  NewUserPayloadType | PayloadType | ReactionSendPayloadType | NewPayloadType | DeletePublicMessage
}

export type PrivateEventTpye = {
    type : "private_send_message" | "add_friend",
    payload : PrivateMessagePayload | FriendPayload
}


export type IsTypingPayload = {
        isTyping : boolean
}

export type addReqeustResponse = {
    friendId : string,
    friendName : string,
    userId : string,
    userName : string,
    alreadyExists : boolean
}

export type ReactionSendPayloadType = {
    emoji: string;
    userName: string;
    userId: string;
    messageId: string;
}

export type PayloadType = {
    userId: string
    userName: string
    message: string
    replyTo: MessageReplyType | undefined
}

export type NewPublicMessage = {
    message: string,
    userId: string,
    userName: string,
    createdAt: Date,
}


export type DeletePublicMessage = {
    prunedCount: number,
    prunedUntil: string,
}


export type NewEventType = {
    type: "public_send_message" | "private_send_message" | "public_new_message" | "public_reply_message" | "public_reaction",
    payload: NewPayloadType
}

export type ReactionType = {
    emoji: string;
    userName: string;
    userId: string;
}

export type MessageReplyType = {
    messageId: string,
    message: string,
    senderId: string,
    senderName: string,
}

export type NewPayloadType = {
    userId: string
    userName: string
    message: string
    id: string
    createdAt: string
    reactions: ReactionType[]
    replyTo: MessageReplyType | undefined
}


export type PrivateMessageType = {
    id : string
    senderId : string
    receiverId : string
    message : string
    imageUrl : string,
    conversationId : string,
    updatedAt : string,
    createdAt : string,
    reactions : ReactionType[],
    replyTo : MessageReplyType,
    seenByUserIds : string[]
}


export type PrivateMessagePayload = {
    senderId : string;
    receiverId : string;
    message : string;
    conversationId : string,
    imageUrl : string,
    replyTo : MessageReplyType
}






export type NewUserPayloadType = {
    totalUser: number;
    userId: string,
    userName: string
}


  export interface CoonversationPayload{
    members : string[],
    isGroup : boolean,
    
  }


  export interface FriendPayload {
    userId : string,
    friendId : string,
  }
