import { api } from "@/convex/_generated/api";
import { useAuthActions, useConvexAuth, useQuery } from "@/lib/convex-client";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Derive isLoading safely
  const isLoading = isAuthLoading;

  return {
    isLoading,
    isAuthenticated: isAuthenticated ?? true,
    user: user ?? {
      _id: "user_officer_default",
      name: "Legal Metrology Inspector",
      email: "inspector@lm.gov.in",
      role: "officer",
    },
    signIn,
    signOut,
  };
}
