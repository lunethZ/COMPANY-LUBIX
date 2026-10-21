import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface AuthModalContextType {
  isOpen: boolean;
  initialTab: "login" | "register";
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error("useAuthModal must be used within AuthModalProvider");
  return context;
};

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"login" | "register">("login");

  const openLogin = useCallback(() => {
    setInitialTab("login");
    setIsOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setInitialTab("register");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, initialTab, openLogin, openRegister, close }}>
      {children}
    </AuthModalContext.Provider>
  );
}
