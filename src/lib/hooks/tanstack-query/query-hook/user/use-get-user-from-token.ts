import { useQuery } from "@tanstack/react-query";
import axios from "axios";
export const FetchUserFromToken = async () => {
    const res = await axios.get(`/api/get/check/token`)
    const data = res.data;
    console.log("this is hte data for check user by token fin tanstakc : ",data)
    return data;
}

export const useCheckUserFromToken = () => {
    return useQuery({
        queryKey: ["check-user-from-token"],
        queryFn: () => FetchUserFromToken(),
    })
}