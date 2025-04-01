// src/pages/Wishlist.js

import React, { useContext, useEffect, useState } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";

/**
 * Wishlist Component
 * Renders a list of wishlistitems items with options to remove an item,
 * move an item to the cart, or clear the entire wishlistitems.
 *
 * Props:
 * - wishlistitems: Array of wishlistitems items.
 * - setWishlistitems: Function to update the wishlistitems.
 * - cart: Array of cart items.
 * - setCart: Function to update the cart.
 */
const Wishlist = ({ cart, setCart }) => {
  const [wishlistitems, setWishlistitems] = useState([]);
  const { wishlist } = useContext(CartContext);
  // -----------------------------------------------------------
  // Function: moveToCart
  // Adds a wishlistitems item to the cart and removes it from the wishlistitems.
  // -----------------------------------------------------------

  useEffect(() => {
    wishlist && setWishlistitems(wishlist);
  }, [wishlist]);
  const moveToCart = (wishlistitem, index) => {
    const item = wishlistitems[index]; // Get the item from the wishlistitems.
    if (!item) return;

    // Update cart state.
    setCart((prevCart) => {
      // If the cart is empty, add the item directly.
      if (prevCart.length === 0) {
        return [{ ...item, quantity: 1 }];
      }
      // Check if the item already exists in the cart.
      const existingItem = prevCart.find(
        (cartItem) => cartItem.name === item.name
      );
      if (existingItem) {
        // Increase quantity if it exists.
        return prevCart.map((cartItem) =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Otherwise, add the new item with initial quantity of 1.
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    // Remove the item from the wishlistitems.
    setWishlistitems((prevWishlist) =>
      prevWishlist.filter((_, i) => i !== index)
    );
  };

  // -----------------------------------------------------------
  // Function: removeWishlistItem
  // Removes a single item from the wishlistitems.
  // -----------------------------------------------------------
  const removeWishlistItem = (index) => {
    setWishlistitems((prevWishlist) =>
      prevWishlist.filter((_, i) => i !== index)
    );
  };

  // -----------------------------------------------------------
  // Function: clearWishlist
  // Clears the entire wishlistitems.
  // -----------------------------------------------------------
  const clearWishlist = () => {
    setWishlistitems([]);
  };

  // -----------------------------------------------------------
  // Render the Wishlist UI
  // -----------------------------------------------------------
  return (
    <div className="main-container">
      <h2 className="w-title">MY WISHLIST</h2>
      <div id="wishlistitems-container   ">
        <div id="wishlistitems-items">
          {wishlistitems.length === 0 ? (
            <div id="empty-wishlistitems-message" style={{ color: "black" }}>
              Your Wishlist is empty.
            </div>
          ) : (
            wishlistitems?.map((wishlisti, index) => {
              // console.log(item);
              const item = wishlisti.product || {};
              // Calculate discounted price.
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );
              return (
                <div key={item.id} className="wishlistitems-item">
                  {/* Product Image */}
                  <img src={item.imageurl} alt={item.name} className="  w-52" />
                  {/* Product Title & Size */}
                  <div className="item-title">
                    <h3>{item.name}</h3>
                    <span style={{ fontWeight: 100, fontSize: "1rem" }}>
                      {item.size}ml
                    </span>
                  </div>
                  {/* Pricing Details */}
                  <div className="item-price">
                    <span>
                      <strong style={{ color: "green" }}>
                        ₹{discountedPrice}
                      </strong>
                      <del style={{ color: "lightgray" }}>₹{item.oprice}</del>
                    </span>
                    <span style={{ color: "blue" }}>{item.discount}% Off</span>
                  </div>
                  {/* Action Buttons */}
                  <button
                    className="move-to-cart"
                    onClick={() => moveToCart(wishlisti, index)}
                  >
                    Move to Cart
                  </button>
                  <button
                    className="remove-wishlistitems"
                    onClick={() => removeWishlistItem(index)}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
          {/* Clear Wishlist Button: only shown if there are items */}
          {wishlistitems.length > 0 && (
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
