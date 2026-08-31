import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { secureStore } from "../store/secureStore";
import { onAuthEvent } from "../utils/authEvents";

export type RoleId = "user" | "empresa" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role_id: RoleId;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken: string | undefined, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isUser: () => boolean;
  isCompany: () => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await secureStore.removeItem("access_token");
    await secureStore.removeItem("refresh_token");
    await secureStore.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await secureStore.getItem("user");
        const token = await secureStore.getItem("access_token");
        if (savedUser && token) {
          setUser(JSON.parse(savedUser) as User);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();

    const unsubscribe = onAuthEvent((event) => {
      if (event.type === "expired" || event.type === "logged-out") {
        void clearSession();
      }
    });

    return unsubscribe;
  }, [clearSession]);

  const login = async (accessToken: string, refreshToken: string | undefined, userData: User) => {
    await secureStore.setItem("access_token", accessToken);
    if (refreshToken) {
      await secureStore.setItem("refresh_token", refreshToken);
    }
    await secureStore.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await clearSession();
  };

  const updateUser = async (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...data };
      void secureStore.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const isUser = () => user?.role_id === "user";
  const isCompany = () => user?.role_id === "empresa";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateUser,
        isUser,
        isCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}