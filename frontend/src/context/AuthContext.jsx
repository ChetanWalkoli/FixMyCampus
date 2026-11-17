import { createContext, useContext } from "react";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

/**
 * Placeholder AuthProvider for Phase 0.
 * Full authentication and role-based session handling will be added in Phase 1.
 */
export function AuthProvider({ children }) {
  const value = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
