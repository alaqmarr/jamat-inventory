"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useModuleAccess() {
  const { data: session, status } = useSession();
  const {
    data,
    error,
    isLoading: swrLoading,
  } = useSWR(status === "authenticated" ? "/api/user/modules" : null, fetcher, {
    revalidateOnFocus: false,
  });

  const isLoading = status === "loading" || swrLoading;
  const isAdmin = data?.isAdmin || false;
  const modules: string[] = data?.modules || [];

  /**
   * Check if user has access to a module.
   * ADMIN has access to all modules.
   */
  const hasModuleAccess = (moduleId: string): boolean => {
    if (isLoading) return false;
    if (isAdmin) return true;
    return modules.includes(moduleId);
  };

  return {
    hasModuleAccess,
    modules,
    isAdmin,
    isLoading,
    error,
  };
}
