import { useUser } from "@clerk/clerk-react";
import React, { createContext, useState, useEffect } from "react";
import { db } from "../../configs";
import {
  orderItemsTable,
  ordersTable,
  usersTable,
  productsTable,
} from "../../configs/schema";
import { eq } from "drizzle-orm";
// import { object } from "framer-motion/client";

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [userdetails, setUserdetails] = useState();
  const [orders, setOrders] = useState([]);
  const { user } = useUser();

  // Fetch user details from DB
  const getuserdetail = async () => {
    try {
      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, user?.primaryPhoneNumber.phoneNumber));

      if (res.length > 0) {
        setUserdetails(res[0]);
        // console.log("User details:", res[0]);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // Fetch user's orders with order items and product details
  const getMyOrders = async () => {
    try {
      if (!userdetails) return; // Prevent running if userdetails is not set

      const res = await db
        .select({
          orderId: ordersTable.id,
          totalAmount: ordersTable.totalAmount,
          status: ordersTable.status,
          createdAt: ordersTable.createdAt,
          productId: orderItemsTable.productId,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
          productName: productsTable.name,
          productImage: productsTable.imageurl,
        })
        .from(ordersTable)
        .innerJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
        .innerJoin(
          productsTable,
          eq(orderItemsTable.productId, productsTable.id)
        )
        .where(eq(ordersTable.userId, userdetails.id))
        .orderBy(ordersTable.createdAt);

      const groupedOrders = res.reduce((acc, item) => {
        const orderId = item.orderId;
        if (!acc[orderId]) {
          acc[orderId] = {
            orderId: item.orderId,
            totalAmount: item.totalAmount,
            status: item.status,
            createdAt: item.createdAt,
            items: [], // Store products inside each order
          };
        }
        acc[orderId].items.push({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
        });
        return acc;
      }, {});
      console.log(Object.values(groupedOrders));
      setOrders(Object.values(groupedOrders));

      // console.log("Fetched Orders:", res); // Corrected console log
      // setOrders(res);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch user details when user changes
  useEffect(() => {
    if (user) getuserdetail();
  }, [user]);

  // Fetch orders when userdetails is available
  useEffect(() => {
    if (userdetails) getMyOrders();
  }, [userdetails]);

  return (
    <UserContext.Provider value={{ userdetails, setUserdetails, orders }}>
      {children}
    </UserContext.Provider>
  );
};
