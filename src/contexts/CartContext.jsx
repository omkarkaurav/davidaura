import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../../configs";
import {
  addToCartTable,
  productsTable,
  wishlistTable,
} from "../../configs/schema";
import { eq } from "drizzle-orm";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const { userdetails } = useContext(UserContext);
  // You could also add logic here for loading/saving cart data from localStorage
  const getCartitems = async () => {
    if (!userdetails) return;
    try {
      const res = await db
        .select({
          product: productsTable,
          userId: addToCartTable.userId,
          cartId: addToCartTable.id,
          quantity: addToCartTable.quantity,
        })
        .from(addToCartTable)
        .innerJoin(
          productsTable,
          eq(addToCartTable.productId, productsTable.id)
        )
        .where(eq(addToCartTable.userId, userdetails.id));
      setCart(res);
      console.log(res);
      // console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const getwishlist = async () => {
    if (!userdetails) return;
    try {
      const res = await db
        .select({
          product: productsTable,
          wishlistId: wishlistTable.id,
          userId: wishlistTable.userId,
          productId: wishlistTable.productId,
        })
        .from(wishlistTable)
        .innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
        .where(eq(wishlistTable.userId, userdetails.id));
      setWishlist(res);
      // console.log(res);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    userdetails && getCartitems();
    userdetails && getwishlist();
  }, [userdetails]);
  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        wishlist,
        setWishlist,
        selectedCoupon,
        setSelectedCoupon,
        couponDiscount,
        setCouponDiscount,
        selectedItems,
        setSelectedItems,
        getwishlist,
        getCartitems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
