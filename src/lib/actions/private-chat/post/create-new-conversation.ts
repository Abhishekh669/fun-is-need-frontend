'use server'

import { auth } from "@/lib/utils/auth/auth"
import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import {  getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import axios from "axios"

export interface conversationPayload {
    members : string[],
    isGroup : boolean,
}


export const createConversation = async(data : conversationPayload)=>{
    try {
        const [session, user_token, url] = await Promise.all([
            auth(),
            get_cookies("user_token"),
            getBackEndUrl()
        ])
        if(!session || !user_token  || !url){
            throw new Error("user unauthorized")
        }
        const res = await axios.post(`${url}/private-chat/create-conversation`, data,{
            withCredentials : true,
            headers : {
                Cookie : `user_token=${user_token}`
            }
        })

        const value = res.data;

        if(!value.success){
            throw new Error('failed to create conversation')
        }

        return value;
    } catch (error) {
        error = getErrorMessage(error)
        return {
            error, success : false
        }
        
    }
}