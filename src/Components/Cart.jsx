// src/Components/ShoppingCart.js

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext"; // Global products
import { UserContext } from "../contexts/UserContext"; // User details
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { toast, ToastContainer } from "react-toastify";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  // Include wishlist and setWishlist from CartContext
  const { cart, setCart, wishlist, setWishlist } = useContext(CartContext);

  // -------------------------------
  // Checkout Handler
  // -------------------------------
  const handleCheckout = () => {
    if (!cart?.length) {
      alert("Your cart is empty. Please add at least one item before checking out.");
      return;
    }
    // Save the cart in localStorage for the checkout page
    localStorage.setItem("selectedItems", JSON.stringify(cart));
    navigate("/checkout");
  };

  // -------------------------------
  // Add to Cart Functionality
  // -------------------------------
  const addToCart = async (product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      try {
        const res = await db
          .insert(addToCartTable)
          .values({
            productId: product.id,
            userId: userdetails?.id,
          })
          .returning({
            cartId: addToCartTable.id,
            userId: addToCartTable.userId,
          });
        setCart((prevCart) => [
          ...prevCart,
          {
            product: product,
            quantity: 1,
            cartId: res.cartId,
            userId: res.userId,
          },
        ]);
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    }
  };

  // -------------------------------
  // Move to Wishlist Functionality
  // -------------------------------
  const moveToWishlist = async (item, index) => {
    const product = item.product;
    // Check if product is already wishlisted
    const exists = wishlist.some(
      (wItem) => (wItem.product?.id || wItem.id) === product.id
    );
    if (exists) {
      toast.info("Already wishlisted");
      return;
    }

    // Create a temporary wishlist item
    const tempWishlistItem = {
      productId: product.id,
      wishlistId: `temp-${product.id}`,
      userId: userdetails?.id,
      product: product,
    };
    // Optimistically update wishlist state
    setWishlist((prev) => [...prev, tempWishlistItem]);

    try {
      // Add product to wishlist in DB
      const res = await db
        .insert(wishlistTable)
        .values({
          userId: userdetails?.id,
          productId: product.id,
        })
        .returning({
          wishlistId: wishlistTable.id,
          productId: wishlistTable.productId,
          userId: wishlistTable.userId,
        });
      // Remove from cart in DB
      await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.productId, product.id),
            eq(addToCartTable.userId, userdetails?.id)
          )
        );
      toast.success("Moved to wishlist");
      // Remove item from cart state
      setCart((prevCart) => prevCart.filter((_, i) => i !== index));
      // Replace temporary wishlist item with DB response
      setWishlist((prevWishlist) =>
        prevWishlist.map((wItem) =>
          (wItem.product?.id || wItem.productId) === product.id
            ? { ...res[0], product }
            : wItem
        )
      );
    } catch (error) {
      toast.error("Failed to move to wishlist");
      setWishlist((prev) =>
        prev.filter((wItem) => (wItem.product?.id || wItem.productId) !== product.id)
      );
      console.error("Error moving to wishlist:", error);
    }
  };

  // -------------------------------
  // Other Cart Management Functions
  // -------------------------------
  const updateQuantity = (index, change) => {
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeFromCart = async (item, index) => {
    try {
      const res = await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, userdetails?.id),
            eq(addToCartTable.productId, item?.product?.id)
          )
        );
      setCart((prevCart) => prevCart.filter((_, i) => i !== index));
      console.log("Remove response:", res);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      await db
        .delete(addToCartTable)
        .where(eq(userdetails?.id, addToCartTable.userId));
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // -------------------------------
  // Price Calculations
  // -------------------------------
  const totalOriginal = cart?.reduce(
    (acc, item) => acc + (item?.product?.oprice || 0) * item.quantity,
    0
  );

  const totalDiscounted = cart?.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        (item?.product?.oprice || 0) -
          ((item?.product?.discount || 0) / 100) * (item?.product?.oprice || 0)
      ) *
        item.quantity,
    0
  );

  const finalPrice = totalDiscounted;

  // -------------------------------
  // Render Remaining Products (Explore More)
  // -------------------------------
  const renderRemainingProducts = () => {
    return products
      ?.filter(
        (product) =>
          !cart?.some((cartItem) => cartItem?.product?.id === product.id)
      )
      .map((product) => {
        const discountedPrice = Math.trunc(
          product.oprice - (product.oprice * product.discount) / 100
        );

        return (
          <div key={product.id} className="remaining-product-item">
            <img src={product.imageurl} alt={product.name} />
            <div className="r-product-title">
              <h3>{product.name}</h3>
              <span>{product.size} ml</span>
            </div>
            <div className="product-price">
              <div className="price">
                <span style={{ color: "green", fontWeight: "bold" }}>
                  ₹{Math.floor(discountedPrice)}
                </span>
                <span
                  className="old-price"
                  style={{ color: "lightgray", textDecoration: "line-through" }}
                >
                  (₹{product.oprice})
                </span>
              </div>
              <span className="discount" style={{ color: "blue" }}>
                {product.discount}% Off
              </span>
            </div>
            <button className="add-to-cart" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        );
      });
  };

  // -------------------------------
  // Render Component UI
  // -------------------------------
  return (
    <>
      <main className="main-container">
        <div className="absolute">
          <ToastContainer />
        </div>
        <h1 className="cart-title">Your Shopping Cart</h1>
        <div className="cart-item-summary-container">
          {/* ---------- Cart Items List ---------- */}
          <div className="cart-items-box">
            {cart?.map((item, index) => (
              <div key={index} className="cart-item">
                <img src={item?.product?.imageurl} alt={item?.product?.name} />
                <div className="product-title">
                  <h3>{item?.product?.name}</h3>
                  <span>{item?.product?.size} ml</span>
                </div>
                <div className="quantity-controls">
                  <button className="decrease" onClick={() => updateQuantity(index, -1)}>
                    -
                  </button>
                  <span className="item-quantity">{item.quantity}</span>
                  <button className="increase" onClick={() => updateQuantity(index, 1)}>
                    +
                  </button>
                </div>
                <div className="item-price">
                  <span style={{ color: "green" }}>
                    ₹{" "}
                    {Math.floor(
                      item?.product?.oprice -
                        ((item?.product?.discount || 0) / 100) *
                          (item?.product?.oprice || 0)
                    )}
                  </span>
                  <span style={{ color: "lightgray", textDecoration: "line-through" }}>
                    ₹{item?.product?.oprice}
                  </span>
                </div>
                <button className="remove" onClick={() => removeFromCart(item, index)}>
                  Remove
                </button>
                <button className="move-to-wishlist" onClick={() => moveToWishlist(item, index)}>
                  Move to Wishlist
                </button>
              </div>
            ))}
          </div>

          {/* ---------- Cart Summary Section ---------- */}
          <div className="cart-summary">
            <div className="cart-summary-button">
              <button id="clear-cart" onClick={clearCart}>
                Clear Cart
              </button>
              <button id="checkout-button" disabled={!cart?.length} onClick={handleCheckout}>
                Checkout
              </button>
            </div>
            <div className="cart-summary-price">
              <h3>Total: ₹{totalOriginal}</h3>
              <h3>Discounted Total: ₹{finalPrice}</h3>
            </div>
          </div>
        </div>
      </main>
      <div id="remaining-products-container">
        <h3>Explore more</h3>
        <div id="remaining-products">{renderRemainingProducts()}</div>
      </div>
    </>
  );
};

export default ShoppingCart;
