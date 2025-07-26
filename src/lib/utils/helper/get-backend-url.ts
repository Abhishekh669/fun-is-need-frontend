"use server"
export const getBackEndUrl = async() =>{
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    return backendUrl;
}