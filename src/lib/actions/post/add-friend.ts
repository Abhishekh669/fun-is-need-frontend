'use server'

import { auth } from "@/lib/utils/auth/auth"
import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import { FriendPayload } from "@/lib/utils/types/chat/types"
import axios from "axios"


export const AddUser = async(value : Omit<FriendPayload,"userId">)=>{
    try {
       const [session, user_token, url] = await Promise.all([
        auth(),
        get_cookies("user_token"),
        getBackEndUrl()
       ])

       if(!session || !user_token){
        throw new Error("user not authorized")
       }

       const payload  : FriendPayload = {
         userId : session.user?.googleId,
         friendId : value.friendId
       }


       const res = await axios.post(`${url}/private/add-friend`,payload, {
        withCredentials : true,
        headers : {
            Cookie : `user_token=${user_token}`
        }
       })

       const data = res.data;
       if(!data.success){
        throw new Error("failed to add ")
       }

       return {
            data, 
            success : data.success
       }

        
    } catch (error) {
        error = getErrorMessage(error)
        return {
            success : false, error
        }
        
    }
}