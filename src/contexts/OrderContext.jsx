// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../../configs";
import {
  addressTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  usersTable,
} from "../../configs/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const { userdetails } = useContext(UserContext);
  // Load orders from localStorage
  const getorders = async () => {
    if (!userdetails) return;
    try {
      const orderQuery = await db
        .select({
          orderId: ordersTable.id,
          userId: ordersTable.userId,
          userName: usersTable.name,
          phone: usersTable.phone,
          paymentMode: ordersTable.paymentMode,
          totalAmount: ordersTable.totalAmount,
          paymentStatus: ordersTable.paymentStatus,
          trasactionId: ordersTable.transactionId,
          status: ordersTable.status,
          progressStep: ordersTable.progressStep,
          createdAt: ordersTable.createdAt,

          address: addressTable.street ?? "No Address",
          city: addressTable.city ?? "N/A",
          state: addressTable.state ?? "N/A",
          zip: addressTable.postalCode ?? "N/A",
          country: addressTable.country ?? "N/A",
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .leftJoin(addressTable, eq(usersTable.id, addressTable.userId));

      const orderIds = orderQuery.map((order) => order.orderId);

      const productQuery = await db
        .select({
          orderId: orderItemsTable.orderId,
          productId: orderItemsTable.productId,
          productName: productsTable.name,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
        })
        .from(orderItemsTable)
        .innerJoin(
          productsTable,
          eq(orderItemsTable.productId, productsTable.id)
        )
        .where(inArray(orderItemsTable.orderId, orderIds));

      // 🛑 Use a Map to remove duplicate orders while merging products
      const orderMap = new Map();

      orderQuery.forEach((order) => {
        orderMap.set(order.orderId, { ...order, products: [] });
      });

      productQuery.forEach((product) => {
        if (orderMap.has(product.orderId)) {
          orderMap.get(product.orderId).products.push(product);
        }
      });

      const ordersWithProducts = Array.from(orderMap.values());

      console.log("Orders fetched successfully:", ordersWithProducts);
      setOrders(ordersWithProducts);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    userdetails && getorders();
  }, [userdetails]);

  // Persist orders to localStorage
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  return (
    <OrderContext.Provider value={{ getorders, orders, setOrders }}>
      {children}
    </OrderContext.Provider>
  );
};
