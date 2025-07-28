import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"


export const fetchPublicMessages = async(limit : number, pageParam : number = 0) =>{
    const res = await axios.get(`/api/get/messages/public?page=${limit}&perPage=${pageParam}`)
    const data = res.data.data;
    return data;
}

export const useGetPublicMessage = (limit  : number = 10)=>{
    return useInfiniteQuery({
        queryKey : ["get-public-message", limit],
        queryFn : ({pageParam = 0}) => fetchPublicMessages(limit, pageParam),
        getNextPageParam : (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
        initialPageParam : 0,
        placeholderData : keepPreviousData,
        refetchOnWindowFocus : false,
    })
}