import React, { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  //  estado inicial desde localStorage (sin useEffect)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");

    if (!savedUser || !token) return null;

    try {
      const parsedUser = JSON.parse(savedUser) as User;
      return parsedUser;
    } catch {
      return null;
    }
  });

  //  LOGIN
  const login = (token: string, userData: User) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  };

  //  LOGOUT - limpia todo y evita que el botón volver muestre sesión cacheada
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  //  HELPERS
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  //  Helper methods
  const isUser = () => user?.role_id === "user";
  const isCompany = () => user?.role_id === "empresa";

  const isAdmin = () => user?.role_id === "admin";

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      login, 
      logout,
      updateUser,
      isUser,
      isCompany,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};