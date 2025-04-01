// src/Components/ShoppingCart.js

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext"; // Global product state
import { UserContext } from "../contexts/UserContext"; // New User Context
import { db } from "../../configs";
import { addToCartTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";

const ShoppingCart = ({ wishlist, setWishlist }) => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext); // Retrieve global products
  const { userdetails } = useContext(UserContext); // Access user data (e.g., orderCount)

  const { cart, setCart } = useContext(CartContext);
  // -------------------------------
  // Checkout Handler
  // -------------------------------
  const handleCheckout = () => {
    if (!cart?.length) {
      alert(
        "Your cart is empty. Please add at least one item before checking out."
      );
      return;
    }
    // Save entire cart in localStorage for the checkout page
    localStorage.setItem("selectedItems", JSON.stringify(cart));
    navigate("/checkout");
  };
  console.log("hello");
  useEffect(() => {
    cart?.length && setCart(cart);
  }, [cart]);

  // -------------------------------
  // Cart Management Functions
  // -------------------------------
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.name === product.name);
      let updatedCart;
      if (existingItem) {
        updatedCart = prevCart.map((item) =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [
          ...prevCart,
          {
            ...product,
            dprice: Math.trunc(
              product.oprice - (product.oprice * product.discount) / 100
            ),
            quantity: 1,
          },
        ];
      }
      setCart(updatedCart); // Persist in global context
      return updatedCart;
    });
  };

  const moveToWishlist = (index) => {
    setCart((prevCart) => {
      const itemToMove = prevCart?.[index];
      if (!itemToMove) return prevCart;

      setWishlist((prevWishlist) => {
        if (
          prevWishlist?.some(
            (wishlistItem) => wishlistItem?.name === itemToMove?.name
          )
        ) {
          return prevWishlist;
        }
        return [...prevWishlist, itemToMove];
      });

      return prevCart?.filter((_, i) => i !== index);
    });
  };

  function updateQuantity(index, change) {
    setCart((prevCart) =>
      prevCart?.map(
        (item, i) =>
          i === index
            ? {
                ...item, // Preserve the item structure (itemid, userid, etc.)
                product: {
                  ...item.product, // Preserve product properties
                  quantity: Math.max(1, item.product.quantity + change), // Update quantity, ensuring it’s at least 1
                },
              }
            : item // If not the selected item, return it as-is
      )
    );
  }

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

      setCart((prevCart) => prevCart?.filter((_, i) => i !== index));
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const clearCart = async () => {
    try {
      await db
        .delete(addToCartTable)
        .where(eq(userdetails?.id, addToCartTable?.userId));
      setCart([]);
    } catch (error) {}
  };

  // -------------------------------
  // Price Calculation Variables
  // -------------------------------
  const totalOriginal = cart?.reduce(
    (acc, item) =>
      acc + (item?.product?.oprice || 0) * (item?.product?.quantity || 0),
    0
  );

  const totalDiscounted = cart?.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        (item?.product?.oprice || 0) -
          ((item?.product?.discount || 0) / 100) * (item?.product?.oprice || 0)
      ) *
        (item?.product?.quantity || 0),
    0
  );

  const finalPrice = totalDiscounted;

  // -------------------------------
  // Render Remaining Products Section
  // -------------------------------
  const renderRemainingProducts = () => {
    return products
      ?.filter(
        (product) => !cart?.some((cartItem) => cartItem?.name === product?.name)
      )
      .map((product) => {
        const discountedPrice = Math.trunc(
          (product?.oprice || 0) -
            ((product?.oprice || 0) * (product?.discount || 0)) / 100
        );

        return (
          <div key={product?.name} className="remaining-product-item">
            <img src={product?.imageurl} alt="Product" />
            <div className="r-product-title">
              <h3>{product?.name}</h3>
              <span>{product?.size} ml</span>
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
                  (₹{product?.oprice})
                </span>
              </div>
              <span className="discount" style={{ color: "blue" }}>
                {product?.discount}% Off
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
                  <button
                    className="decrease"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    -
                  </button>
                  <span className="item-quantity">
                    {item?.product?.quantity}
                  </span>
                  <button
                    className="increase"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    +
                  </button>
                </div>
                <div className="item-price">
                  <span style={{ color: "green" }}>
                    ₹{" "}
                    {Math.floor(
                      (item?.product?.oprice || 0) -
                        ((item?.product?.discount || 0) / 100) *
                          (item?.product?.oprice || 0)
                    )}
                  </span>
                  <span
                    style={{
                      color: "lightgray",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{item?.product?.oprice}
                  </span>
                </div>
                <button
                  className="remove"
                  onClick={() => removeFromCart(item, index)}
                >
                  Remove
                </button>
                <button
                  className="move-to-wishlist"
                  onClick={() => moveToWishlist(index)}
                >
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
