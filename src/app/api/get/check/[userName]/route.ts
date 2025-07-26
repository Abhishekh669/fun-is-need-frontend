'use server'

import { getErrorMessage } from "@/lib/utils/error/get-error";
import { getBackEndUrl } from "@/lib/utils/helper/get-backend-url";
import axios from "axios";
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ userName: string }> }) {
    try {
       

        const { userName } = await params;
        if (!userName) {
            return NextResponse.json({ error: "username is required", success: false }, { status: 400 });
        }

        const url = await getBackEndUrl()
        const res = await axios.get(`${url}/auth/check-username/${userName}`)

        const data = res.data;
        data.state = true
        return NextResponse.json({data}, { status: 200 })
    } catch (error) {
        error = getErrorMessage(error)
        console.log("this is app name error : ", error)
        return NextResponse.json({ error, success: false, state : true,}, { status: 400 })

    }
}