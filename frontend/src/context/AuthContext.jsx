import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_USER } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("smriti_patient_user");
    return saved ? JSON.parse(saved) : MOCK_USER; // Default logged in for smooth demo or can be logged out
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [pendingPhone, setPendingPhone] = useState("+91 9876543210");

  const loginWithPhone = (phone) => {
    setPendingPhone(phone);
    return true;
  };

  const verifyOTP = (otp) => {
    // Demo accepts any 6-digit or 123456
    const updatedUser = {
      ...MOCK_USER,
      phone: pendingPhone,
      maskedPhone: pendingPhone.replace(/(\+\d{2}\s\d{2})\d{6}(\d{2})/, "$1******$2")
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem("smriti_patient_user", JSON.stringify(updatedUser));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("smriti_patient_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        pendingPhone,
        loginWithPhone,
        verifyOTP,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
