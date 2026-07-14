"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeOwnPassword,
  getMe,
  getStoredAuthUser,
  setStoredAuthUser,
  updateProfile,
  type ChangeOwnPasswordDto,
  type UpdateProfileDto,
} from "@/lib/auth";

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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => updateProfile(dto),
    onSuccess: (user) => {
      setStoredAuthUser(user);
      window.dispatchEvent(new Event("auth-user-updated"));
      queryClient.setQueryData(authUserQueryKey, user);
      queryClient.invalidateQueries({ queryKey: authUserQueryKey });
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (dto: ChangeOwnPasswordDto) => changeOwnPassword(dto),
  });
}
