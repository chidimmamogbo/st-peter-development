import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { User, Role } from "@/types";
import {
  authApi,
  clearStoredAuth,
  getStoredToken,
  setStoredToken,
  USER_STORAGE_KEY,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session on initial client mount
    const initAuth = async () => {
      const savedToken = getStoredToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);

      // Try quick restore from cached user profile for zero-flicker UI
      const cachedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore corrupted cache
        }
      }

      // Verify and sync live profile from backend
      try {
        const liveUser = await authApi.getMe();
        setUser(liveUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(liveUser));
      } catch (err: any) {
        console.error("Session revalidation failed:", err);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const tokenRes = await authApi.login(username, password);
      setStoredToken(tokenRes.access_token);
      setToken(tokenRes.access_token);

      const userProfile = await authApi.getMe();
      setUser(userProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
      return userProfile;
    } catch (err) {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
