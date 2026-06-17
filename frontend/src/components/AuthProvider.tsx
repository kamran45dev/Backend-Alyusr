"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, removeToken } from "@/lib/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: () => {}, refresh: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch("/api/auth/me");
      setUser(data);
    } catch {
      removeToken();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
