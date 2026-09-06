export type AuthUser = {
  id: number;
  username?: string;
  displayName: string;
  avatarUrl?: string | null;
};

export const AUTH_TOKEN_KEY = "nankaiquetao_token";
export const AUTH_USER_KEY = "nankaiquetao_user";
export const AUTH_EVENT = "nankaiquetao-auth";

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getAuthUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.displayName && !parsed?.username) return null;
    return {
      ...parsed,
      displayName: parsed.displayName || parsed.username || "Usuario",
    };
  } catch {
    return null;
  }
};

export const setAuthSession = (token: string, user: AuthUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const subscribeAuth = (onChange: () => void) => {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const authHeaders = (extra?: HeadersInit): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
