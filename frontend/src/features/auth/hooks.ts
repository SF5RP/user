import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/shared/hooks/redux";
import { setUser, clearUser } from "./authSlice";
import { api } from "@/shared/lib/api";
import type { User } from "@/shared/types/auth";
import Cookies from "js-cookie";

export function useCurrentUser() {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const data = await api.get<User>("/me", { requiresAuth: true });
      dispatch(setUser(data));
      return data;
    },
    enabled: !!Cookies.get("accessToken"),
    retry: false,
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async () => {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      dispatch(clearUser());
    },
  });
}

export function useLogin() {
  return () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    window.location.href = `${apiUrl}/login`;
  };
}
