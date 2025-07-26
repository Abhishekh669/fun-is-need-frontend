import { useQuery } from "@tanstack/react-query";
import axios from "axios";
export const fetchUserName = async (userName : string) => {
    const res = await axios.get(`/api/get/check/${userName}`)
    const data = res.data.data;
    console.log("this is hte data for check user by token  : ",data)
    return data;
}

export const useGetCheckUserName= (userName : string) => {
    return useQuery({
        queryKey: ["check-user-name",userName],
        queryFn: () => fetchUserName(userName),
        enabled : !!userName && userName.trim() != "",
    })
}