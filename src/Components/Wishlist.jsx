// src/pages/Wishlist.js

import React, { useContext } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { eq, and } from "drizzle-orm";
import { UserContext } from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";

const Wishlist = () => {
  const { wishlist, setWishlist, cart, setCart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  // Function to prevent duplicate items in wishlist (if needed)
  const addToWishlist = (newItem) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some(
        (item) => (item.product?.id || item.id) === newItem.id
      );
      if (!exists) {
        return [...prevWishlist, newItem];
      }
      return prevWishlist;
    });
  };

  // Move item to cart and remove from wishlist
  const moveToCart = async (wishlistItem) => {
    try {
      const product = wishlistItem.product || wishlistItem;

      // Add item to cart in DB
      const [res1] = await db
        .insert(addToCartTable)
        .values({
          productId: product.id,
          userId: userdetails?.id,
        })
        .returning({
          cartId: addToCartTable.id,
          userId: addToCartTable.userId,
        });

      // Update cart state immediately
      setCart((prevCart) => [
        ...prevCart,
        {
          product: { ...product },
          cartId: res1.cartId,
          userId: res1.userId,
          quantity: 1,
          dprice: Math.trunc(
            product.oprice - (product.oprice * product.discount) / 100
          ),
        },
      ]);

      // Remove the item from the wishlist in the database
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, userdetails?.id),
            eq(wishlistTable.productId, product.id)
          )
        );

      // Update wishlist state immediately
      setWishlist((prevWishlist) =>
        prevWishlist.filter(
          (item) => (item.product?.id || item.id) !== product.id
        )
      );

      toast.success("Item moved to cart successfully!");
    } catch (error) {
      toast.error("Failed to move item to cart");
      console.error("Error moving to cart:", error);
    }
  };

  // Remove an item from wishlist permanently
  const removeWishlistItem = async (wishlistItem) => {
    try {
      const product = wishlistItem.product || wishlistItem;

      // Delete from database
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, userdetails?.id),
            eq(wishlistTable.productId, product.id)
          )
        );

      // Update state
      setWishlist((prevWishlist) =>
        prevWishlist.filter(
          (item) => (item.product?.id || item.id) !== product.id
        )
      );

      toast.success("Item removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove item");
      console.error("Error removing from wishlist:", error);
    }
  };

  // Clear entire wishlist permanently
  const clearWishlist = async () => {
    try {
      await db
        .delete(wishlistTable)
        .where(eq(wishlistTable.userId, userdetails?.id));

      setWishlist([]);
      toast.success("Wishlist cleared");
    } catch (error) {
      toast.error("Failed to clear wishlist");
      console.error("Error clearing wishlist:", error);
    }
  };

  return (
    <div className="main-container">
      <div className="absolute">
        <ToastContainer />
      </div>
      <h2 className="w-title">MY WISHLIST</h2>
      <div id="wishlistitems-container">
        <div id="wishlistitems-items">
          {wishlist.length === 0 ? (
            <div id="empty-wishlistitems-message" style={{ color: "black" }}>
              Your Wishlist is empty.
            </div>
          ) : (
            wishlist.map((wishlistItem) => {
              const item = wishlistItem.product || wishlistItem;
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );

              return (
                <div key={item.id} className="wishlistitems-item">
                  <img src={item.imageurl} alt={item.name} className="w-52" />
                  <div className="item-title">
                    <h3>{item.name}</h3>
                    <span style={{ fontWeight: 100, fontSize: "1rem" }}>
                      {item.size}ml
                    </span>
                  </div>
                  <div className="item-price">
                    <span>
                      <strong style={{ color: "green" }}>
                        ₹{discountedPrice}
                      </strong>
                      <del style={{ color: "lightgray" }}>₹{item.oprice}</del>
                    </span>
                    <span style={{ color: "blue" }}>{item.discount}% Off</span>
                  </div>
                  <button
                    className="move-to-cart"
                    onClick={() => moveToCart(wishlistItem)}
                  >
                    Move to Cart
                  </button>
                  <button
                    className="remove-wishlistitems"
                    onClick={() => removeWishlistItem(wishlistItem)}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
          {wishlist.length > 0 && (
            <button id="clear-wishlistitems" onClick={clearWishlist}>
              Clear Wishlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
