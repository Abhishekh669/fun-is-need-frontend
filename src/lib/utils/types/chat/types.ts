export type EventType = {
    type : "public_send_message" | "private_send_message" | "public_new_message",
    payload : PayloadType
}

export type PayloadType = {
    userId : string 
    userName : string
    message : string
}

export type NewPublicMessage = {
    message : string,
    userId : string,
    userName : string,
    createdAt : Date,
}


export type NewEventType = {
    type : "public_send_message" | "private_send_message" | "public_new_message",
    payload : NewPayloadType
}

export type NewPayloadType = {
    userId : string 
    userName : string
    message : string
    id : string
    createdAt : string
}
