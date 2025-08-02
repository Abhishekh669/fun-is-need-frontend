import { LoggedInUsersType } from "@/lib/store/user-store";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

export interface LoggedInUsersResponse {
  success: boolean;
  rows: LoggedInUsersType[];
  hasMore: boolean;
  nextOffset: number;
}

export const fetchLoggedInUsers = async (
  limit: number,
  pageParam: number = 0
): Promise<LoggedInUsersResponse> => {
  const res = await axios.get(
    `/api/get/check/session?page=${limit}&perPage=${pageParam}`
  );
  const data = res.data.data;
  console.log("thijs is in tanstack logged in user : ",data)
  return {
    success: data.success ?? true,
    rows: data.rows ?? [],
    hasMore: data.hasMore ?? false,
    nextOffset: data.nextOffset ?? pageParam + 1,
  } as LoggedInUsersResponse;
};

export const useGetLoggedInUsers = (limit: number = 10) => {
  return useInfiniteQuery<LoggedInUsersResponse, Error>({
    queryKey: ["get-logged-in-users", limit],
    queryFn: ({ pageParam = 0 }) => fetchLoggedInUsers(limit, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
};
