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
  usersTable,
  wishlistTable,
} from "../../configs/schema";
import { useUser } from "@clerk/clerk-react";
import { and, eq } from "drizzle-orm";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";

// -------------------------------
// Modal Component (Detailed Perfume Info)
// -------------------------------
const Modal = ({ product, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setAnimate(true);

    if (location.state && location.state.scrollTo) {
      const timeoutId = setTimeout(() => {
        const targetElement = document.getElementById(location.state.scrollTo);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Adjust delay if necessary

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
          borderRadius: "10px", // Button radius remains unchanged
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          transform: animate ? "scale(1)" : "scale(0)",
          transition: "transform 0.5s ease",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh", // Limit modal height to 90% of viewport
          // overflowY: "auto",
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
            Height: "100px", // Do not change this image size
            objectFit: "cover",
            borderRadius: "8px", // Remains unchanged
            margin: "0 auto ",
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
        <div
          style={{
            fontSize: "12px",
            lineHeight: "1",
            color: "#444",
          }}
        >
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
  const [loading, setLoading] = useState(false);
  // const [cart, setCart] = useState([]);
  const { products } = useContext(ProductContext);
  const [modalProduct, setModalProduct] = useState(null);
  // const { user } = useUser();
  const { setCart, cart, wishlist, setWishlist } = useContext(CartContext);
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

  const { userdetails } = useContext(UserContext);
  let count = 1;
  const addtocart = async (product) => {
    const tempCartItem = {
      product,
      cartId: `temp-${product.id + count++}`, // Temporary cart ID
      userId: userdetails?.id,
    };

    // Optimistically update the cart
    setCart((prev) => [...prev, tempCartItem]);

    try {
      setLoading(true);
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

      // Replace temp cart item with actual DB response
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id && item.userId === userdetails?.id
            ? { ...item, cartId: res1.cartId }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // Remove the temp item if DB call fails
      setCart((prev) =>
        prev.filter((item) => item.cartId !== tempCartItem.cartId)
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (product) => {
    const backupCart = [...cart]; // Backup the cart state in case of failure

    try {
      setCart((prev) => prev.filter((item) => item.product.id !== product.id));

      await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, userdetails?.id),
            eq(addToCartTable.productId, product?.id)
          )
        );
    } catch (error) {
      // console.error("Failed to remove from cart:", error);
      setCart(backupCart); // Restore the previous state if the call fails
    } finally {
      setLoading(false);
    }
  };

  // const getcartsitem = async () => {
  //   try {
  //     const res = await db
  //       .select({
  //         product: productsTable,
  //         userId: addToCartTable.userId,
  //         cartId: addToCartTable.id,
  //       })
  //       .from(addToCartTable)
  //       .innerJoin(
  //         productsTable,
  //         eq(addToCartTable.productId, productsTable.id)
  //       )
  //       .where(eq(addToCartTable.userId, userdetails.id));
  //     setCartitem(res);
  //     console.log(res);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const toggleCart = (product) => {
  //   console.log(product);
  //   setCart((prevCart) => {
  //     const existingItem = prevCart.find((item) => item.name === product.name);
  //     if (existingItem) {
  //       return prevCart.filter((item) => item.name !== product.name);
  //     } else {
  //       const discountedPrice = Math.trunc(
  //         product.oprice - (product.oprice * product.discount) / 100
  //       );

  //       return [
  //         ...prevCart,
  //         { ...product, dprice: discountedPrice, quantity: 1 },
  //       ];
  //     }
  //   });
  // };

  const toggleWishlist = async (product) => {
    const tempWishlistItem = {
      productId: product.id,
      wishlistId: `temp-${product.id + count++}`, // Temporary wishlist ID
      userId: userdetails?.id,
    };

    // Optimistically update the wishlist
    setWishlist((prev) => [...prev, tempWishlistItem]);

    try {
      const existingWishlistItem = wishlist.find(
        (item) => item.productId === product.id
      );

      if (existingWishlistItem) {
        // Remove from wishlist
        setWishlist((prev) =>
          prev.filter((item) => item.productId !== product.id)
        );

        await db
          .delete(wishlistTable)
          .where(
            and(
              eq(wishlistTable.userId, userdetails?.id),
              eq(wishlistTable.productId, product.id)
            )
          );
      } else {
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

        // Replace temp wishlist item with actual DB response
        setWishlist((prev) =>
          prev.map((item) =>
            item.productId === product.id && item.userId === userdetails?.id
              ? { ...item, wishlistId: res.wishlistId }
              : item
          )
        );
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
      {/* <h1 id="products-section" className="product-heading">
        Our Collection
      </h1> */}

      {/* Custom 3D Coverflow Carousel Section */}
      {/* <div className="w-9/10 flex items-center justify-center py-10  ">
        <CoverflowCarousel
          products={products}
          pause={modalProduct !== null}
          onSlideClick={handleSlideClick}
        />
      </div> */}

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
          const inWishlist = wishlist.some(
            (item) => item.productId == product.id
          );

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
              {inCart ? (
                <button
                  onClick={() => {
                    removeFromCart(product);
                  }}
                  className={`w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 transition ${
                    inCart ? "bg-black text-white" : "bg-black text-white"
                  }`}
                >
                  {"remove from cart"}
                  <img src={CartImage} alt="Cart" className="w-8 h-8" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    addtocart(product);
                  }}
                  className={`w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 transition ${
                    inCart ? "bg-black text-white" : "bg-black text-white"
                  }`}
                >
                  {"add to cart"}
                  <img src={CartImage} alt="Cart" className="w-8 h-8" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {modalProduct && <Modal product={modalProduct} onClose={closeModal} />}
    </section>
  );
};

export default Products;
