// src/pages/Products.js

import React, { useContext, useEffect, useState } from "react";
import { ProductContext } from "../contexts/productContext"; // Global product data
import WishlistImage from "../assets/wishlist-svgrepo-com.svg"; // Default wishlist icon
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg"; // Filled wishlist icon
import CartImage from "../assets/cart-svgrepo-com copy.svg"; // Cart icon
import { useLocation } from "react-router-dom";
import { db } from "../../configs";
import { addToCartTable, usersTable } from "../../configs/schema";
import { useUser } from "@clerk/clerk-react";
import { eq } from "drizzle-orm";
import { UserContext } from "../contexts/UserContext";

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
          src={product.img}
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
// Custom 3D Coverflow Carousel with Infinite One‑Direction Loop (Append at Third Index)
// -------------------------------
const CoverflowCarousel = ({ products, pause, onSlideClick }) => {
  // console.log(products);
  // Start with a doubled list for initial smoothness.
  const [carouselItems, setCarouselItems] = useState([
    ...products,
    ...products,
  ]);
  const N = products.length; // Original list count
  // "shift" increases continuously (in units of slides).
  const [shift, setShift] = useState(0);
  // "animate" flag controls whether to apply CSS transition.
  const [animate, setAnimate] = useState(true);

  // Track current window width for responsive spacing.
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate dynamic spacing:
  // For devices ≤480px, use a multiplier of 0.74; otherwise, 0.22.
  const spacing =
    windowWidth <= 480
      ? windowWidth * 0.54
      : windowWidth <= 780
      ? windowWidth * 0.4
      : windowWidth * 0.22;

  // Every 3 seconds, increase the shift by 1 slide if not paused.
  useEffect(() => {
    if (!pause) {
      const interval = setInterval(() => {
        setShift((prev) => prev + 1);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [pause]);

  // When shift reaches 3, append a new copy of the original products and subtract 3.
  useEffect(() => {
    if (shift >= 3) {
      setAnimate(false);
      setCarouselItems((prev) => [...prev, ...products]);
      setShift((prev) => prev - 3);
      setTimeout(() => {
        setAnimate(true);
      }, 50);
    }
  }, [shift, products]);

  // Define the center index as the beginning of the second copy.
  const center = N;

  // Compute the 3D transform style for each slide.
  const getSlideStyle = (index) => {
    // Set slide dimensions based on screen width
    const slideWidth = windowWidth <= 480 ? 200 : 300;
    const slideHeight = windowWidth <= 480 ? "65%" : "90%";

    const offset = index - center - shift;
    const baseScale = 0.8;
    const scale = Math.abs(offset) < 0.001 ? 1 : baseScale;
    const rotateY = offset * -45;
    const translateX = offset * spacing;
    const zIndex = Math.abs(offset) < 0.001 ? 2 : 1;

    return {
      transform: `translateX(${translateX}px) translateY(-50%) scale(${scale}) rotateY(${rotateY}deg)`,
      transition: animate ? "transform 1s ease" : "none",
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: `-${slideWidth / 2}px`, // Centers the slide horizontally based on its width
      width: `${slideWidth}px`,
      height: slideHeight,
      zIndex,
      cursor: "pointer",
    };
  };

  // Set container width to 100% if screen width is below 480px, otherwise 85%
  const containerWidth = windowWidth <= 480 ? "100%" : "85%";

  return (
    <div
      style={{
        position: "relative",
        width: containerWidth,
        height: "480px",
        perspective: "1000px",
        overflow: "hidden",
      }}
    >
      {carouselItems.map((product, index) => (
        <div
          key={product.name + index}
          style={getSlideStyle(index)}
          onClick={() => onSlideClick(product)}
        >
          <img
            src={product.img}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "42px", // Keep same button radius / image style
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      ))}
    </div>
  );
};

// -------------------------------
// Products Component
// -------------------------------
const Products = ({ cart, setCart, wishlist, setWishlist }) => {
  const { products } = useContext(ProductContext);
  const [modalProduct, setModalProduct] = useState(null);
  // const { user } = useUser();
  const { setCartitem } = useContext(UserContext);
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

  const addtocart = async (product) => {
    try {
      const res1 = await db.insert(addToCartTable).values({
        productId: product.id,
        userId: userdetails?.id,
      });
      setCartitem((pre) => [...pre, product]);
      // const res = await db
      //   .update(usersTable)
      //   .set({ cartlength: cartitem?.length + 1 })
      //   .where(eq(usersTable.id, userdetails.id));
    } catch (error) {
      console.log(error);
    }
  };

  const toggleCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.name === product.name);
      if (existingItem) {
        return prevCart.filter((item) => item.name !== product.name);
      } else {
        const discountedPrice = Math.trunc(
          product.oprice - (product.oprice * product.discount) / 100
        );

        return [
          ...prevCart,
          { ...product, dprice: discountedPrice, quantity: 1 },
        ];
      }
    });
  };

  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) =>
      prevWishlist.some((item) => item.name === product.name)
        ? prevWishlist.filter((item) => item.name !== product.name)
        : [...prevWishlist, product]
    );
  };

  const handleSlideClick = (product) => {
    setModalProduct(product);
  };

  const closeModal = () => {
    setModalProduct(null);
  };

  return (
    <section className="py-20 mt-50 flex flex-col items-center">
      <h1 id="products-section" className="product-heading">
        Our Collection
      </h1>

      {/* Custom 3D Coverflow Carousel Section */}
      <div className="w-9/10 flex items-center justify-center py-10  ">
        <CoverflowCarousel
          products={products}
          pause={modalProduct !== null}
          onSlideClick={handleSlideClick}
        />
      </div>

      <h1 id="shop-section" className="product-heading">
        Shop The Luxury
      </h1>

      {/* Products Container */}
      <div className="w-full flex flex-wrap justify-center gap-8 px-6">
        {products.map((product, index) => {
          const discountedPrice = Math.trunc(
            product.oprice - (product.oprice * product.discount) / 100
          );
          const inCart = cart.some((item) => item.name === product.name);
          const inWishlist = wishlist.some(
            (item) => item.name === product.name
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
              <button
                onClick={() => {
                  addtocart(product);
                  toggleCart(product);
                }}
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
