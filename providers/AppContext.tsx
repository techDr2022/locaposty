"use client";
import { createContext, useContext, ReactNode } from "react";

interface AppContextType {
  basename: string;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <AppContext.Provider value={{ basename: "my-site" }}>
    {children}
  </AppContext.Provider>
);
