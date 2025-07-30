'use server'

import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import axios from "axios"


export const CheckUserFromTokenForPrivate = async() =>{
    try {
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("user not authorized")
        }
        const url = await getBackEndUrl()
        const res = await axios.get(`${url}/auth/check-token-for-private`,{
            withCredentials : true,
            headers : {
                Cookie : `user_token=${user_token}`
            }
        })
        const data = res.data;
        console.log('this is user data for verifiy token : ', data)
        if(!data.success){
            throw new Error("user not authorized")
        }
        
        console.log("this is data  backend  by appname : ", (data))
        return {
            message : data.message,
            success : true,
            user : data.user
        }
    } catch (error) {
        error = getErrorMessage(error)
        console.log("this is app name error : ", error)
        return { error, success: false}
    }
}