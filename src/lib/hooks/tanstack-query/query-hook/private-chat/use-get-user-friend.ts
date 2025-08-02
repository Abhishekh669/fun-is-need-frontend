import { useQuery } from "@tanstack/react-query";
import axios from "axios";
export const fetchUserFriends = async () => {
    const res = await axios.get(`/api/get/private-chat/friends`)
    const data = res.data;
    console.log("this is hte data for check user by token fin tanstakc : ",data)
    return data;
}

export const useGetuserFriends = () => {
    return useQuery({
        queryKey: ["get-user-friends"],
        queryFn: () => fetchUserFriends(),
    })
}