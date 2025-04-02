// src/pages/Products.js

import React, { useContext, useEffect, useState } from "react";
import { ProductContext } from "../contexts/productContext"; // Global product data
import WishlistImage from "../assets/wishlist-svgrepo-com.svg"; // Default wishlist icon
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg"; // Filled wishlist icon
import CartImage from "../assets/cart-svgrepo-com copy.svg"; // Cart icon
import { useLocation } from "react-router-dom";
import { db } from "../../configs";
import {
  addToCartTable,
  wishlistTable,
  productsTable,  // Import products table to fetch fresh details
} from "../../configs/schema";
import { useUser } from "@clerk/clerk-react";
import { eq, and } from "drizzle-orm";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";

// -------------------------------
// Modal Component (Detailed Perfume Info)
// -------------------------------
const Modal = ({ product, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setAnimate(true);

    if (location.state && location.state.scrollTo) {
      const timeoutId = setTimeout(() => {
        const targetElement = document.getElementById(location.state.scrollTo);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [location]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          transform: animate ? "scale(1)" : "scale(0)",
          transition: "transform 0.5s ease",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "black",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
        <img
          src={product.imageurl}
          alt={product.name}
          style={{
            width: "250px",
            height: "100px", // Do not change this image size
            objectFit: "cover",
            borderRadius: "8px",
            margin: "0 auto",
            display: "block",
          }}
        />
        <h2
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: "600",
            color: "#333",
          }}
        >
          {product.name}
        </h2>
        <div style={{ fontSize: "12px", lineHeight: "1", color: "#444" }}>
          {product.description && (
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  margin: "25px 0 12px",
                  fontSize: "18px",
                  fontWeight: "500",
                  color: "#222",
                }}
              >
                Description :
              </h3>
              <p style={{ margin: 5 }}>{product.description}</p>
            </div>
          )}
          {product.composition && (
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  margin: "8px 0 12px",
                  fontSize: "18px",
                  fontWeight: "500",
                  color: "#222",
                }}
              >
                Composition :
              </h3>
              <p style={{ margin: 5 }}>{product.composition}</p>
            </div>
          )}
          {product.fragranceNotes && (
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  margin: "8px 0 12px",
                  fontSize: "18px",
                  fontWeight: "500",
                  color: "#222",
                }}
              >
                Fragrance Notes :
              </h3>
              <p style={{ margin: 5 }}>{product.fragranceNotes}</p>
            </div>
          )}
          {product.fragrance && (
            <div style={{ marginBottom: "0px" }}>
              <h3
                style={{
                  margin: "8px 0 12px",
                  fontSize: "18px",
                  fontWeight: "500",
                  color: "#222",
                }}
              >
                Fragrance Type :
              </h3>
              <p style={{ margin: 5 }}>{product.fragrance}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------
// Products Component
// -------------------------------
const Products = () => {
  const { products } = useContext(ProductContext);
  const [modalProduct, setModalProduct] = useState(null);
  const { setCart, cart, wishlist, setWishlist } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  // Prevent background scrolling when modal is open.
  useEffect(() => {
    if (modalProduct) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [modalProduct]);

  // -------------------------------
  // Toggle Cart: Add or Remove Product with Matched Details
  // -------------------------------
  const toggleCart = async (product) => {
    try {
      // Fetch latest product details from the database using product ID
      const latestProducts = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id));
  
      if (!latestProducts || latestProducts.length === 0) {
        console.error("Product not found in DB");
        return;
      }
      const latestProduct = latestProducts[0];
  
      // Check if product is already in cart
      const existingCartItem = cart.find((item) => item.product.id === latestProduct.id);
  
      if (existingCartItem) {
        // Remove from cart in the database
        await db
          .delete(addToCartTable)
          .where(
            and(
              eq(addToCartTable.productId, latestProduct.id),
              eq(addToCartTable.userId, userdetails?.id)
            )
          );
  
        // Remove from state
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== latestProduct.id));
      } else {
        // Add to cart in the database
        const res = await db
          .insert(addToCartTable)
          .values({
            productId: latestProduct.id,
            userId: userdetails?.id,
          })
          .returning({
            cartId: addToCartTable.id,
            userId: addToCartTable.userId,
          });
  
        // Ensure no duplicates before updating state
        setCart((prevCart) => {
          const isAlreadyAdded = prevCart.some((item) => item.product.id === latestProduct.id);
          return isAlreadyAdded ? prevCart : [...prevCart, { product: latestProduct, quantity: 1 }];
        });
      }
    } catch (error) {
      console.error("Error toggling cart:", error);
    }
  };
  

  // -------------------------------
  // Toggle Wishlist: Add or Remove Product with Matched Details
  // -------------------------------
  const toggleWishlist = async (product) => {
    const tempWishlistItem = {
      productId: product.id,
      wishlistId: `temp-${product.id + count++}`, // Temporary wishlist ID
      userId: userdetails?.id,
    };

    // Optimistically update the wishlist
    setWishlist((prev) => [...prev, tempWishlistItem]);

    try {
      // Fetch latest product details from the database
      const latestProducts = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id));
  
      if (!latestProducts || latestProducts.length === 0) return;
      const latestProduct = latestProducts[0];
  
      // Check if product is already in the wishlist
      const existingWishlistItem = wishlist.find((item) => item.productId === latestProduct.id);
  
      if (existingWishlistItem) {
        // Remove from wishlist in the database
        await db
          .delete(wishlistTable)
          .where(
            and(
              eq(wishlistTable.userId, userdetails?.id),
              eq(wishlistTable.productId, latestProduct.id)
            )
          );
  
        // Remove from state
        setWishlist((prevWishlist) => prevWishlist.filter((item) => item.productId !== latestProduct.id));
      } else {
        // Add to wishlist in the database
        const res = await db
          .insert(wishlistTable)
          .values({
            userId: userdetails?.id,
            productId: latestProduct.id,
          })
          .returning({
            wishlistId: wishlistTable.id,
            productId: wishlistTable.productId,
            userId: wishlistTable.userId,
          });
  
        // Ensure no duplicates before updating state
        setWishlist((prevWishlist) => {
          const isAlreadyAdded = prevWishlist.some((item) => item.productId === latestProduct.id);
          return isAlreadyAdded ? prevWishlist : [...prevWishlist, { ...latestProduct, productId: latestProduct.id }];
        });
      }
    } catch (error) {
      // console.error("Error toggling wishlist:", error);
      // Remove the temp item if DB call fails
      setWishlist((prev) =>
        prev.filter((item) => item.wishlistId !== tempWishlistItem.wishlistId)
      );
    }
  };
  

  const handleSlideClick = (product) => {
    setModalProduct(product);
  };

  const closeModal = () => {
    setModalProduct(null);
  };

  return (
    <section className="py-20 mt-50 flex flex-col items-center">
      <h1 id="shop-section" className="product-heading">
        Shop The Luxury
      </h1>

      {/* Products Container */}
      <div className="w-full flex flex-wrap justify-center gap-8 px-6">
        {products.map((product, index) => {
          const discountedPrice = Math.trunc(
            product.oprice - (product.oprice * product.discount) / 100
          );
          const inCart = cart.some((item) => item.product.id === product.id);
          const inWishlist = wishlist.some((item) => item.productId == product.id);

          return (
            <div
              key={index}
              className="relative w-72 h-96 flex flex-col items-center gap-2 p-12 rounded-xl overflow-hidden shadow-lg bg-white"
            >
              <img
                className="w-72 h-64 object-cover"
                src={product.imageurl}
                alt={product.name}
                onClick={() => handleSlideClick(product)}
                style={{ cursor: "pointer" }}
              />
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-2 right-2 p-2 rounded-full transition"
              >
                <img
                  src={inWishlist ? WishlistFilledImage : WishlistImage}
                  alt="wishlist"
                  className="w-10 h-10"
                />
              </button>
              <div className="w-9/10 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <span className="text-gray-700 font-medium">
                  {product.size} ml
                </span>
              </div>
              <div className="w-9/10 flex justify-between items-center">
                <span className="flex justify-between gap-4 items-center">
                  <span className="text-lg font-bold text-black">
                    ₹{discountedPrice}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    (₹{product.oprice})
                  </span>
                </span>
                <span className="text-blue-700 font-semibold">
                  {product.discount}% Off
                </span>
              </div>
              <button
                onClick={() => toggleCart(product)}
                className={`w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 transition ${
                  inCart ? "bg-black text-white" : "bg-black text-white"
                }`}
              >
                {inCart ? "Remove from Cart" : "Add to Cart"}
                <img src={CartImage} alt="Cart" className="w-8 h-8" />
              </button>
            </div>
          );
        })}
      </div>
      {modalProduct && <Modal product={modalProduct} onClose={closeModal} />}
    </section>
  );
};

export default Products;
