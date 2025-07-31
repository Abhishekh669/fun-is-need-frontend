'use server'

import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import axios from "axios"


export const getUserInDb = async() =>{
    try {
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("user not authorized")
        }
        const url = await getBackEndUrl();
        const res = await axios.get(`${url}/auth/check-user-in-db`,{
            withCredentials : true,
            headers : {
                Cookie : `user_token=${user_token}`
            }
        })

        const data =res.data;
        if(!data.success){
            throw new Error("something went wrong")
        }
        return {
            message : "user exists",
            success : data.success
        }
    } catch (error) {
        error = getErrorMessage(error)
        return {
            error , success : false,
        }
        
    }
}