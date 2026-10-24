import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "opennotes:user";
const TOKEN_KEY = "opennotes:token";

const AuthContext = createContext(null);

const getApiBase = () => {
  if (typeof window !== "undefined") return "/api";
  return (process.env.VITE_API_URL || "http://localhost:5000") + "/api";
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {
        // Storage unavailable or corrupt
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return window.localStorage.getItem(TOKEN_KEY) || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isInitialized, setIsInitialized] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      if (stored) setUser(JSON.parse(stored));
      if (storedToken) setToken(storedToken);
    } catch {
      // Storage unavailable
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const login = useCallback(async ({ email, password, name }) => {
    // If password provided, attempt real MongoDB auth
    if (password) {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setToken(data.token);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        window.localStorage.setItem(TOKEN_KEY, data.token);
      } catch {
        // storage ignored
      }
      return data.user;
    } else {
      // Fallback for direct user session
      const mockUser = {
        name: name || email.split("@")[0] || "Student",
        email,
      };
      setUser(mockUser);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // ignore
      }
      return mockUser;
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const res = await fetch(`${getApiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    setUser(data.user);
    setToken(data.token);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      window.localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      // storage ignored
    }
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.email) return;
    const res = await fetch(`${getApiBase()}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, ...updates }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      } catch {
        // ignore
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: user !== null,
      isInitialized,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, token, isInitialized, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
