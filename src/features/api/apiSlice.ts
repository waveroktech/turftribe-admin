import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constants";
import { deleteUserToken, getUserToken } from "@/lib/session";
import { logOut } from "../auth/authSlice";
import { toast } from "sonner";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  async prepareHeaders(headers, { ...rest }) {
    const token = await getUserToken("access-token");

    //  Automatically set JSON headers for normal requests
    if (typeof rest?.arg === "object" && !(rest?.arg?.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
    }

    //  bearer token 
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result: any = await baseQuery(args, api, extraOptions);

  if (
    result?.error &&
    [
      "Please,login again",
      "Unauthorized, provide authorization token",
      "Oops, this user does not exist",
    ].includes(result?.error?.data?.message)
  ) {
    deleteUserToken("access-token");
    api.dispatch(logOut());
    toast.info("Your session has expired, please log in again.");
  }

  return result;
};

//  Base API slice with tag types for automatic cache invalidation
export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["admin"],
  endpoints: () => ({}),
});