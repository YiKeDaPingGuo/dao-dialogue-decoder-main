import { useEffect, useState } from "react";
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  setAuthSession,
  subscribeAuth,
  type AuthUser,
} from "@/lib/auth";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    const sync = () => {
      setToken(getAuthToken());
      setUser(getAuthUser());
    };
    return subscribeAuth(sync);
  }, []);

  return {
    token,
    user,
    loggedIn: Boolean(token && user),
    setSession: setAuthSession,
    logout: clearAuthSession,
  };
};
