// src/App.js

import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import HeroSection from "./Components/HeroSection";
import Footer from "./Components/Footer";
import Login from "./Components/Register";
import Products from "./Components/Products";
import MyOrder from "./Components/MyOrder";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Checkout from "./Components/Checkout";
import Adminpannel from "./Components/Adminpanel";
import ContactUs from "./Components/ContactUs";
import "./style/adminPanel.css";

// Import providers for managing global state
import ScrollToTop from "./ScrollToTop";
import { ProductProvider } from "./contexts/productContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CartProvider } from "./contexts/CartContext";
import { ContactProvider } from "./contexts/ContactContext";
import { UserProvider } from "./contexts/UserContext";
import { useUser } from "@clerk/clerk-react";
import { db } from "../configs";
import { usersTable } from "../configs/schema";
import { eq } from "drizzle-orm";

const App = () => {
  // Local states for cart and wishlist management
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { user } = useUser();

  // Debug logging for cart updates
  useEffect(() => {
    // console.log("Cart updated in App.js:", cart);
    isNewUser();
  }, [user]);
  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  const isNewUser = useCallback(async () => {
    if (!user) return; // ✅ Avoid API call if user is null

    try {
      const userdata = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, user?.primaryPhoneNumber?.phoneNumber));
      if (userdata.length === 0) {
        const res = await db
          .insert(usersTable)
          .values({
            name: user?.fullName,
            phone: user?.primaryPhoneNumber.phoneNumber,
            // email: user?.primaryEmailAddress?.emailAddress,
          })
          .returning(usersTable);
        console.log(res);
      }
    } catch (error) {
      console.error("Error checking new user:", error);
    }
  }, [user]);

  return (
    // Wrap the entire app with all the necessary providers
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <ContactProvider>
              <Router>
                <ScrollToTop />
                <>
                  <Navbar
                    cartCount={cart.length || 0}
                    wishlistCount={wishlist.length || 0}
                  />
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <>
                          <HeroSection />
                          <Products
                            cart={cart}
                            setCart={setCart}
                            wishlist={wishlist}
                            setWishlist={setWishlist}
                          />
                        </>
                      }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/myorder" element={<MyOrder />} />
                    <Route
                      path="/wishlist"
                      element={
                        <Wishlist
                          wishlist={wishlist}
                          setWishlist={setWishlist}
                          cart={cart}
                          setCart={setCart}
                        />
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <Cart
                          cart={cart}
                          setCart={setCart}
                          wishlist={wishlist}
                          setWishlist={setWishlist}
                        />
                      }
                    />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/Admin" element={<Adminpannel />} />
                    <Route path="/contact" element={<ContactUs />} />
                  </Routes>
                  <Footer />
                </>
              </Router>
            </ContactProvider>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </UserProvider>
  );
};

export default App;
