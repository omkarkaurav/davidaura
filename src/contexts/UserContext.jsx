// src/contexts/UserContext.js
import React, { createContext, useState, useEffect } from "react";

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  // Initialize user data; here we use orderCount from localStorage (or default to 0)
  const [user, setUser] = useState({
    orderCount: Number(localStorage.getItem("orderCount")) || 0,
    // You can add more user-related properties here
  });

  // Persist orderCount in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("orderCount", user.orderCount);
  }, [user.orderCount]);

  // A helper function to increment the order count
  const incrementOrderCount = () => {
    setUser((prevUser) => ({
      ...prevUser,
      orderCount: prevUser.orderCount + 1,
    }));
  };

  return (
    <UserContext.Provider value={{ user, setUser, incrementOrderCount }}>
      {children}
    </UserContext.Provider>
  );
};
