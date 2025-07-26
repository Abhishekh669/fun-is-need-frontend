
export type EventType = {
    type : "public_send_message" | "private_send_message" | "public_new_message" | "public_reply_message" | "public_reaction"
    payload : PayloadType | ReactionSendPayloadType |  NewPayloadType
}

export type ReactionSendPayloadType = {
    emoji : string;
    userName : string;
    userId : string;
    messageId : string;
}

export type PayloadType = {
    userId : string 
    userName : string
    message : string
    replyTo : MessageReplyType | undefined
}

export type NewPublicMessage = {
    message : string,
    userId : string,
    userName : string,
    createdAt : Date,
}


export type NewEventType = {
    type : "public_send_message" | "private_send_message" | "public_new_message" | "public_reply_message" | "public_reaction",
    payload : NewPayloadType
}

export type ReactionType = {
    emoji : string;
    userName : string;
    userId : string;
}

export type MessageReplyType = {
    messageId : string,
    message : string,
    senderId : string,
    senderName : string,
}

export type NewPayloadType = {
    userId : string 
    userName : string
    message : string
    id : string
    createdAt : string
    reactions : ReactionType[]
    replyTo : MessageReplyType | undefined
}



