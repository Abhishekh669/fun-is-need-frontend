import { createTempUser } from "@/lib/actions/user/post/create-temp-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export const useCreateTempUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTempUser,
    onSuccess: (res) => {
        if(res.success && res.message){
            queryClient.invalidateQueries({ queryKey: ["check-user-from-token"] })
        } 
    },
    onError: () => { },
    onSettled: () => { },
    onMutate: () => { },
})
}