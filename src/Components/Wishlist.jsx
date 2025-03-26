// src/pages/Wishlist.js

import React from "react";
import "../style/wishlist.css";

/**
 * Wishlist Component
 * Renders a list of wishlist items with options to remove an item,
 * move an item to the cart, or clear the entire wishlist.
 *
 * Props:
 * - wishlist: Array of wishlist items.
 * - setWishlist: Function to update the wishlist.
 * - cart: Array of cart items.
 * - setCart: Function to update the cart.
 */
const Wishlist = ({ wishlist, setWishlist, cart, setCart }) => {
  // -----------------------------------------------------------
  // Function: moveToCart
  // Adds a wishlist item to the cart and removes it from the wishlist.
  // -----------------------------------------------------------
  const moveToCart = (index) => {
    const item = wishlist[index]; // Get the item from the wishlist.
    if (!item) return;

    // Update cart state.
    setCart((prevCart) => {
      // If the cart is empty, add the item directly.
      if (prevCart.length === 0) {
        return [{ ...item, quantity: 1 }];
      }
      // Check if the item already exists in the cart.
      const existingItem = prevCart.find((cartItem) => cartItem.name === item.name);
      if (existingItem) {
        // Increase quantity if it exists.
        return prevCart.map((cartItem) =>
          cartItem.name === item.name ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        // Otherwise, add the new item with initial quantity of 1.
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    // Remove the item from the wishlist.
    setWishlist((prevWishlist) => prevWishlist.filter((_, i) => i !== index));
  };

  // -----------------------------------------------------------
  // Function: removeWishlistItem
  // Removes a single item from the wishlist.
  // -----------------------------------------------------------
  const removeWishlistItem = (index) => {
    setWishlist((prevWishlist) => prevWishlist.filter((_, i) => i !== index));
  };

  // -----------------------------------------------------------
  // Function: clearWishlist
  // Clears the entire wishlist.
  // -----------------------------------------------------------
  const clearWishlist = () => {
    setWishlist([]);
  };

  // -----------------------------------------------------------
  // Render the Wishlist UI
  // -----------------------------------------------------------
  return (
    <div className="main-container">
      <h2 className="w-title">MY WISHLIST</h2>
      <div id="wishlist-container">
        <div id="wishlist-items">
          {wishlist.length === 0 ? (
            <div id="empty-wishlist-message" style={{ color: "black" }}>
              Your Wishlist is empty.
            </div>
          ) : (
            wishlist.map((item, index) => {
              // Calculate discounted price.
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );
              return (
                <div key={item.id} className="wishlist-item">
                  {/* Product Image */}
                  <img src={item.img} alt={item.name} />
                  {/* Product Title & Size */}
                  <div className="item-title">
                    <h3>{item.name}</h3>
                    <span style={{ fontWeight: 100, fontSize: "1rem" }}>{item.size}ml</span>
                  </div>
                  {/* Pricing Details */}
                  <div className="item-price">
                    <span>
                      <strong style={{ color: "green" }}>₹{discountedPrice}</strong>
                      <del style={{ color: "lightgray" }}>₹{item.oprice}</del>
                    </span>
                    <span style={{ color: "blue" }}>{item.discount}% Off</span>
                  </div>
                  {/* Action Buttons */}
                  <button className="move-to-cart" onClick={() => moveToCart(index)}>
                    Move to Cart
                  </button>
                  <button className="remove-wishlist" onClick={() => removeWishlistItem(index)}>
                    Remove
                  </button>
                </div>
              );
            })
          )}
          {/* Clear Wishlist Button: only shown if there are items */}
          {wishlist.length > 0 && (
            <button id="clear-wishlist" onClick={clearWishlist}>
              Clear Wishlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
