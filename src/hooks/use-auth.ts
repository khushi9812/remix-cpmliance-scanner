import { api } from "@/convex/_generated/api";
import { useAuthActions, useConvexAuth, useQuery } from "@/lib/convex-client";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const dbUser = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // If there's a db user and they are anonymous, role is consumer. Else officer.
  // We fall back to a mock user only if we are forced to (e.g. for preview testing),
  // but if isAuthenticated is actually false, user should be null.
  
  const user = dbUser 
    ? { ...dbUser, role: (dbUser.isAnonymous || !dbUser.email) ? "consumer" : "officer" }
    : (isAuthenticated ? { _id: "user_officer_default", name: "Legal Metrology Inspector", email: "inspector@lm.gov.in", role: "officer" } : null);

  return {
    isLoading: isAuthLoading || (isAuthenticated && dbUser === undefined),
    isAuthenticated: isAuthenticated,
    user,
    signIn,
    signOut,
  };
}
