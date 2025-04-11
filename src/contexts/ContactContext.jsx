// src/contexts/ContactContext.js
import React, { createContext, useState, useEffect } from "react";
import { db } from "../../configs";
import { querytable } from "../../configs/schema";

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [queries, setQueries] = useState([]);

  const getquery = async () => {
    try {
      const res = await db.select().from(querytable);
      setQueries(res);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    localStorage.setItem("queries", JSON.stringify(queries));
  }, [queries]);

  const addQuery = async (newQuery) => {
    let time = new Date();

    try {
      await db
        .insert(querytable)
        .values({ ...newQuery, createdAt: time.toString() });
      newQuery.date = new Date().toISOString().split("T")[0];
      setQueries((prevQueries) => [...prevQueries, newQuery]);
    } catch (error) {}
    // Add current date (formatted as YYYY-MM-DD)
  };

  return (
    <ContactContext.Provider
      value={{ queries, setQueries, addQuery, getquery }}
    >
      {children}
    </ContactContext.Provider>
  );
};
