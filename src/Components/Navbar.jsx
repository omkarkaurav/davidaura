// src/Components/Navbar.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ------------------------------------------------------------------
// Asset Imports
// ------------------------------------------------------------------
import UserIcon from "../assets/images/blond-man-with-eyeglasses-icon-isolated.png";
import MyOrderIcon from "../assets/order-svgrepo-com.svg";
// import AddressIcon from "../assets/address-location-map-svgrepo-com.svg";
import MailUsIcon from "../assets/mail-svgrepo-com.svg";
import LogOutIcon from "../assets/logout-svgrepo-com.svg";
import CartIcon from "../assets/cart-svgrepo-com.svg";
import WishlistIcon from "../assets/wishlist-svgrepo-com.svg";

// ------------------------------------------------------------------
// CSS Import
// ------------------------------------------------------------------
import "../style/navbar.css";

/**
 * Navbar Component
 * Renders the main navigation bar with logo, links, and user icons.
 * Includes mobile sidebar toggle and dynamic hide/show based on scroll.
 * 
 * Props:
 * - cartCount (number): Count of items in cart.
 * - wishlistCount (number): Count of items in wishlist.
 */
const Navbar = ({ cartCount = 0, wishlistCount = 0 }) => {
  const navigate = useNavigate();
  
  // Temporary authentication flag; replace with real auth logic.
  const isLoggedIn = false;

  // State to control the sidebar open/close for mobile view.
  const [isOpen, setIsOpen] = useState(false);
  
  // State to control navbar visibility (hide on scroll down, show on scroll up).
  const [navbarVisible, setNavbarVisible] = useState(true);

  // ------------------------------------------------------------------
  // Event Handlers
  // ------------------------------------------------------------------

  // Toggle the mobile sidebar.
  const toggleSidebar = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  // Prevent background scrolling when sidebar is open.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [isOpen]);

  // Hide navbar on scroll down and show on scroll up.
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > lastScrollTop) {
        // Scrolling down: hide navbar.
        setNavbarVisible(false);
      } else {
        // Scrolling up: show navbar.
        setNavbarVisible(true);
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ------------------------------------------------------------------
  // Render JSX
  // ------------------------------------------------------------------
  return (
    <header>
      <nav
        id="navbar"
        style={{
          top: navbarVisible ? "0" : "-80px",
          transition: "top 0.3s ease-in-out",
        }}
      >
        {/* ------------------ Part 1: Logo ------------------ */}
        <div className="part-1">
          <a className="logo" onClick={() => navigate("/")}>
            <h1>DEVIDAURA</h1>
          </a>
        </div>

        {/* ------------------ Part 2: Navigation Links ------------------ */}
        <div className="part-2">
          <ul className="nav-links">
            <li> <a onClick={() => navigate("/")}>Home </a></li>
            <li> <a onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}>Collection</a> </li>
            <li> <a onClick={() => document.getElementById('shop-section').scrollIntoView({ behavior: 'smooth' })}>Shop</a> </li>
          </ul>
        </div>

        {/* ------------------ Part 3: User Icons & Sidebar ------------------ */}
        <div className="part-3">
          <div className="icons">
            {/* Wishlist Icon */}
            <div className="wishlist-icon">
              <a onClick={() => navigate("/wishlist")}>
                <button id="wishlist-icon">
                  <img className="wishlist-img" src={WishlistIcon} alt="wishlist" />
                  <span id="wishlist-count">{wishlistCount >= 0 ? wishlistCount : 0}</span>
                </button>
              </a>
            </div>
            {/* Cart Icon */}
            <div className="cart-icon">
              <a onClick={() => navigate("/cart")}>
                <button id="cart-icon">
                  <img src={CartIcon} alt="Cart" />
                  <span id="cart-count">{cartCount >= 0 ? cartCount : 0}</span>
                </button>
              </a>
            </div>
            {/* Login/SignUp or Profile (Placeholder) */}
            {isLoggedIn ? (
              <div className="profile-icon" id="profile-btn" style={{ display: "none" }}>
                <button id="profileButton">
                  <img src="/assets/user-avatar-svgrepo-com.svg" alt="Profile" />
                </button>
              </div>
            ) : (
              <div id="loginSignupButtons">
              <button id="loginButton" onClick={() => navigate("/login")}>
                <span className="btn-text">Login / SignUp</span>
              </button>
            </div>
            
            )}

            {/* Profile Dropdown Content (Hidden by default) */}
            <div className="profile-container">
              <div className="profile-content hidden" id="profileContent">
                <div className="profile-info">
                  <img
                    src="blond-man-with-eyeglasses-icon-isolated.png"
                    alt="User Image"
                    className="profile-img"
                    id="profile-img"
                  />
                  <div className="user-data">
                    <h3 id="profile-name">John Doe</h3>
                    <p id="profile-email">john.doe@example.com</p>
                  </div>
                </div>
                <ul>
                  <li>
                    <a onClick={() => navigate("/myorder")}>My Orders</a>
                  </li>
                  <li id="logout">
                    <a onClick={() => navigate("/")} id="logout-btn">
                      Log Out
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* ------------------ Mobile View Sidebar ------------------ */}
            <div className="part-1">
              <div className="mobile-view">
                <div className="menu-icon" onClick={toggleSidebar}>
                  <div className="menu-container">
                    <div className={`hamburger ${isOpen ? "active" : ""}`} id="hamburger">
                      <div className="line"></div>
                      <div className="line"></div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar">
                    <div className="profile-info">
                      <img src={UserIcon} alt="User Image" className="mob-profile-img" id="mob-profile-img" />
                      <div className="user-data">
                        <h3 id="mob-profile-name">Omkar Kaurav</h3>
                        <p id="mob-profile-email">john.doe@example.com</p>
                      </div>
                      {!isLoggedIn && (
                        <div id="loginSignupButtons-2">
                          <button id="loginButton">
                            <a id="login-signup" onClick={() => navigate("/login")}>
                              Login / Sign Up
                            </a>
                          </button>
                        </div>
                      )}
                      <ul>
                        <li onClick={() => navigate("/myorder")}>
                          <img src={MyOrderIcon} alt="" />
                          <a>My Orders</a>
                        </li>
                        <li onClick={() => navigate("/wishlist")}>
                          <img src={WishlistIcon} alt="" />
                          <a>Wishlist</a>
                        </li>
                        <li onClick={() => navigate("/cart")}>
                          <img src={CartIcon} alt="" />
                          <a>Cart</a>
                        </li>
                        <li onClick={() => navigate("/admin")}>
                          <img src={CartIcon} alt="" />
                          <a>Admin</a>
                        </li>
                        <li onClick={() => navigate("/contact")}>
                          <img src={MailUsIcon} alt="" />
                          <a>Contact Us</a>
                        </li>
                        {isLoggedIn && (
                          <li className="logout" id="logout-2" onClick={() => navigate("/")}>
                            <a id="logout-btn-2">Log Out</a> <img src={LogOutIcon} alt="" />
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* End Mobile Sidebar */}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
