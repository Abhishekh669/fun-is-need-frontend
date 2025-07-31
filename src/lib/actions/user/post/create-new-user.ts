'use server'

import { get_cookies } from "@/lib/utils/cookies/get-cookies"
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import axios from "axios"

export interface NewUserType{
    userName : string,
    userId : string,
    email : string,
    image : string,
    googleId : string
}

export const createNewUser = async (userData : NewUserType) => {
    try {
        const user_token = await get_cookies("user_token")
        if(!user_token){
            throw new Error("user not authorized")
        }
        const url = await getBackEndUrl()
       
        const res = await axios.post(`${url}/auth/create-new-user`,userData,{
            withCredentials : true,
            headers : {
                Cookie : `user_token=${user_token}`
            }
        })

        const data = res.data;
        console.log("this is the data after creating hte new  user : ",data)
        if(!data.success){
            throw new Error(data.error || "failed to crate user")
        }
        return {
            message: data.message || "user created successfully",
            success: data.success
        }

    } catch (error) {
        error = getErrorMessage(error)
        console.log("this ish te eror in create new user :",error)
        return {
            error, success: false,
        }

    }
}