'use server'

import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url"
import { createCookieServerAction } from "@/lib/utils/helper/set-token"
import axios from "axios"

export const createTempUser = async (userName: string) => {
    try {
        const url = await getBackEndUrl()
        const tempName = {
            userName
        }
        console.log('this is hte temp user : ', tempName)
        const res = await axios.post(`${url}/auth/create-temp-user`, tempName)
        const data = res.data;
        const token = data.token;

        if (!token || !data.success) {
            throw new Error("failed to create user")
        }

        const cookieData = {
            expiryDate: new Date(Date.now() + 7 * 12 * 60 * 60 * 1000),
            cookieName: 'user_token',
            token,
            isProduction: true
        }

        const cookieStatus = await createCookieServerAction(cookieData)

        if (!cookieStatus) {
            throw new Error("failed to set cookie")
        }

        return {
            message: "created new temporary user",
            success: true
        }

    } catch (error) {
        error = getErrorMessage(error)
        console.log("this ish te eror  :",error)
        return {
            error, success: false,
        }

    }
}