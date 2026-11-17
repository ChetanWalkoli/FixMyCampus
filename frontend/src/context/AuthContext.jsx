import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";

const AuthContext = createContext(null);

const ROLE_DASHBOARD_MAP = {
  student: "/student",
  admin: "/admin",
  staff: "/staff",
};

// eslint-disable-next-line react-refresh/only-export-components
export function getDashboardPathByRole(role) {
  return ROLE_DASHBOARD_MAP[role] || "/";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchCurrentUser();
      setUser(data?.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const loggedInUser = data?.data?.user || null;
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    const registeredUser = data?.data?.user || null;
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
