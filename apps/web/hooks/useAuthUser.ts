"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe, getStoredAuthUser, setStoredAuthUser } from "@/lib/auth";

export const authUserQueryKey = ["auth", "me"];

export function useAuthUser() {
  return useQuery({
    queryKey: authUserQueryKey,
    queryFn: async () => {
      const user = await getMe();
      setStoredAuthUser(user);
      window.dispatchEvent(new Event("auth-user-updated"));
      return user;
    },
    initialData: getStoredAuthUser() ?? undefined,
    retry: false,
  });
}
