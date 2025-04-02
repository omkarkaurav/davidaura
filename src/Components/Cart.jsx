// src/Components/ShoppingCart.js

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext"; // Global product state
import { UserContext } from "../contexts/UserContext"; // User data context
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { toast, ToastContainer } from "react-toastify";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext); // Global products
  const { userdetails } = useContext(UserContext); // User details
  const { cart, setCart } = useContext(CartContext);

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

  useEffect(() => {
    if (cart?.length) {
      setCart(cart);
    }
  }, [cart, setCart]);

  // -------------------------------
  // Add to Cart Functionality (Match Product ID)
  // -------------------------------
  const addToCart = async (product) => {
    // Check if the product already exists in the cart by matching product.id
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      // Increase quantity if it already exists
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      // Optionally: update the database quantity if needed.
    } else {
      // Add new product to the database and then update the cart state
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
        // Update local cart state with full product details
        setCart((prevCart) => [
          ...prevCart,
          { product: product, quantity: 1, cartId: res.cartId, userId: res.userId },
        ]);
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
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
        <div className=" absolute">
          <ToastContainer />
        </div>
        <h1 className="cart-title">Your Shopping Cart</h1>
        <div className="cart-item-summary-container">
          {/* ---------- Cart Items List ---------- */}
          <div className="cart-items-box">
            {cartitems?.map((item, index) => (
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
                  <span
                    style={{ color: "lightgray", textDecoration: "line-through" }}
                  >
                    ₹{item?.product?.oprice}
                  </span>
                </div>
                <button className="remove" onClick={() => removeFromCart(item, index)}>
                  Remove
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
              <button
                id="checkout-button"
                disabled={!cart?.length}
                onClick={handleCheckout}
              >
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
