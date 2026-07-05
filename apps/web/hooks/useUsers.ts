"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  changeUserPassword,
  getUsers,
  usersQueryKey,
} from "@/lib/users";

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: getUsers,
  });
}

export function useChangeUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      password,
    }: {
      id: string;
      password: string;
    }) => changeUserPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}
