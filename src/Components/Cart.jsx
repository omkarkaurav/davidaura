// src/Components/ShoppingCart.js

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext"; // Global product state
import { UserContext } from "../contexts/UserContext"; // New User Context
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { toast, ToastContainer } from "react-toastify";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartitems, setCartitems] = useState([]);
  const { products } = useContext(ProductContext); // Retrieve global products
  const { userdetails } = useContext(UserContext); // Access user data (e.g., orderCount)

  const { cart, setCart, wishlist, setWishlist, getCartitems } =
    useContext(CartContext);
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

  useEffect(() => {
    getCartitems();
  }, []);

  useEffect(() => {
    setCartitems(cart);
  }, [cart]);

  // -------------------------------
  // Cart Management Functions
  // -------------------------------
  let count = 1;
  const addToCart = async (product) => {
    const tempCartItem = {
      product,
      cartId: `temp-${product.id + count++}`, // Temporary cart ID
      userId: userdetails?.id,
      quantity: 1, // Set default quantity to 1
    };

    // Optimistically update the cart
    setCart((prev) => [...prev, tempCartItem]);

    try {
      const res1 = await db
        .insert(addToCartTable)
        .values({
          productId: product.id,
          userId: userdetails?.id,
        })
        .returning({
          cartId: addToCartTable.id,
          userId: addToCartTable.userId,
        });

      // Replace temp cart item with actual DB response while preserving quantity
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id && item.userId === userdetails?.id
            ? { ...item, cartId: res1.cartId }
            : item
        )
      );
    } catch (error) {
      // Remove the temp item if DB call fails
      setCart((prev) =>
        prev.filter((item) => item.cartId !== tempCartItem.cartId)
      );
    }
  };

  const moveToWishlist = async (prod) => {
    const product = prod?.product || {};
    if (!product.id) {
      toast.error("Invalid product");
      return;
    }

    const existingWishlistItem = wishlist.find(
      (item) => item.productId === product.id
    );
    if (existingWishlistItem) {
      toast.info("Already Wishlisted");
      return;
    } else {
      const tempWishlistItem = {
        productId: product.id,
        wishlistId: `temp-${product.id + count++}`,
        userId: userdetails?.id,
      };

      // Optimistically update the wishlist
      setWishlist((prev) => [...prev, tempWishlistItem]);

      try {
        // Add to wishlist in DB
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
        await db
          .delete(addToCartTable)
          .where(
            and(
              eq(addToCartTable.productId, product.id),
              eq(addToCartTable.userId, prod.userId)
            )
          );

        if (res.length > 0) {
          toast.success("Moved to wishlist");

          // Remove from cart only after DB success
          setCart((prev) =>
            prev.filter((item) => item.product.id !== product.id)
          );

          // Replace temp wishlist item with actual DB response
          setWishlist((prev) =>
            prev.map((item) =>
              item.productId === product.id && item.userId === userdetails?.id
                ? { ...res[0] } // Use the actual DB response
                : item
            )
          );
        }
      } catch (error) {
        toast.error("Failed to move to wishlist");

        // Remove the temp item if DB call fails
        setWishlist((prev) =>
          prev.filter((item) => item.productId !== tempWishlistItem.productId)
        );
      }
    }
  };

  function updateQuantity(index, change) {
    setCart((prevCart) =>
      prevCart?.map(
        (item, i) =>
          i === index
            ? {
                ...item, // Preserve the item structure (itemid, userid, etc.)
                // Preserve product properties
                quantity: Math.max(1, item.quantity + change), // Update quantity, ensuring it’s at least 1
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
    (acc, item) => acc + (item?.product?.oprice || 0) * (item?.quantity || 0),
    0
  );

  const totalDiscounted = cart?.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        (item?.product?.oprice || 0) -
          ((item?.product?.discount || 0) / 100) * (item?.product?.oprice || 0)
      ) *
        (item?.quantity || 0),
    0
  );

  const finalPrice = totalDiscounted;

  // -------------------------------
  // Render Remaining Products Section
  // -------------------------------
  const renderRemainingProducts = () => {
    return products
      ?.filter(
        (product) =>
          !cart?.some((cartItem) => cartItem?.product.id === product?.id)
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
                  <button
                    className="decrease"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    -
                  </button>
                  <span className="item-quantity">{item?.quantity}</span>
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
                  onClick={() => moveToWishlist(item, index)}
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
