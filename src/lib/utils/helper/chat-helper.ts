import { EventType, NewEventType } from "../types/chat/types";

export function routeEvent(event : NewEventType | EventType){
    if (event.type === undefined){
        alert("no type field in the event")
    }
    switch(event.type){
        case "public_send_message":
            console.log("new message")
            break;

        case "public_new_message":
            console.log("new message ")
            break;
        default:
            alert("unsupported message type ")
            break;
    }
}


