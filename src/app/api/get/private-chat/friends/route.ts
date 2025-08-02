'use server'

import { auth } from "@/lib/utils/auth/auth"
import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import axios from "axios"


export async function GET(req :Request){
    try {
        const [session, user_token, url] = await Promise.all([
            auth(),
            get_cookies("user_token"),
            getBackEndUrl()
        ]) 

        if(!session || !user_token || !url){
            throw new Error("user not uathorized")
        }
        const res = await axios.get(`${url}/private/get-user-friends`, {
            withCredentials : true,
            headers : {
                Cookie : `user_token=${user_token}`
            }
        })

        const data = res.data
        if(!data.success){
            throw new Error("user not  authorized")
        }

        return data;
    } catch (error) {
        error = getErrorMessage(error)
        return {
            error, success : false,
        }
        
    }

}