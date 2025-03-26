// src/contexts/ContactContext.js
import React, { createContext, useState, useEffect } from "react";

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    const storedQueries = localStorage.getItem("queries");
    if (storedQueries) {
      setQueries(JSON.parse(storedQueries));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("queries", JSON.stringify(queries));
  }, [queries]);

  const addQuery = (newQuery) => {
    // Add current date (formatted as YYYY-MM-DD)
    newQuery.date = new Date().toISOString().split("T")[0];
    setQueries((prevQueries) => [...prevQueries, newQuery]);
  };

  return (
    <ContactContext.Provider value={{ queries, setQueries, addQuery }}>
      {children}
    </ContactContext.Provider>
  );
};
