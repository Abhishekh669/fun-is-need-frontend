'use server'

import { auth } from "@/lib/utils/auth/auth";
import { get_cookies } from "@/lib/utils/cookies/get-cookies";
import { getErrorMessage } from "@/lib/utils/error/get-error"
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url";
import axios from "axios";
import { NextResponse } from "next/server"

var defaultLimit = 10
var defaultPerpage = 0

export async function GET(req: Request) {
    try {
        const sesison = await auth();
        if(!sesison){
            throw new Error("not logged in")
        }
        const { searchParams } = new URL(req.url)
        const limit = searchParams.has("page")
            ? parseInt(searchParams.get("page")!, 10)
            : defaultLimit;

        const offset = searchParams.has("perPage")
            ? parseInt(searchParams.get("perPage")!, 10)
            : defaultPerpage;
        console.log("this is defualt : ", limit, offset)
        const user_token = await get_cookies("user_token")
        if (!user_token) {
            throw new Error("user not authorized")
        }

        const url = await getBackEndUrl()
        const res = await axios.get(`${url}/auth/get-all-logged-in-user?limit=${limit}&offset=${offset}`, {
            withCredentials: true,
            headers: {
                Cookie: `user_token=${user_token};`
            }
        })
        const data = res.data;
        console.log("this is hte data hoi in route.ts for logged in users",data)
        if(data.rows == null){
            data.rows = []

        }
        data.success = true
        console.log("after : this is hte data hoi in route.ts",data)
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        error = getErrorMessage(error)
        console.log("this is error okei  in logged n user : : ", error)
        return NextResponse.json({ error, success: false }, { status: 400 })

    }
}