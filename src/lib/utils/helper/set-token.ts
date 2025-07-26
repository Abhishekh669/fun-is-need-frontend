'use server'

import { cookies } from "next/headers";

export interface createCookieServerActionType{
    expiryDate : Date,
    cookieName : string,
    token : string,
    isProduction : boolean,
}
export const createCookieServerAction = async (cookieData: createCookieServerActionType): Promise<boolean> => {
    try {
        const { expiryDate, cookieName, token, isProduction } = cookieData;
        
        if (!cookieName || !token) {
            return false;
        }

        const cookieStore = await cookies();

        cookieStore.set(cookieName, token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: !isProduction ? "none" : "lax",
            expires: expiryDate,
            path: "/",
        });

        return true; // Success
    } catch (error) {
        console.error("Failed to set cookie:", error);
        return false; // Failure
    }
};