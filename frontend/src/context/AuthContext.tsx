import { createContext, useContext } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: "user" | "empresa" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isUser: () => boolean;
  isCompany: () => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Hook limpio
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};