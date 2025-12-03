import { useSession } from "next-auth/react";
import { Role } from "@/types";

export function useCurrentRole() {
  const { data: session } = useSession();
  return (session?.user as any)?.role as Role | undefined;
}
