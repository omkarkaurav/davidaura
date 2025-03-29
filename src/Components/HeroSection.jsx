import React, { useState } from "react";
import InstagramIcon from "../assets/instagram-2016-logo-svgrepo-com.svg";
import FacebookIcon from "../assets/icons8-facebook-logo (1).svg";
import TwitterIcon from "../assets/icons8-x (1).svg";
import RIghtArrowIcon from "../assets/right-arrow-svgrepo-com.svg";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892-removebg-preview (1).png";

import "../style/style.css";
import ImageUploadModal from "./ImageUploadModal";

const HeroSection = () => {
  const [open, setOpen] = useState();
  return (
    <section id="home-section" className="section-1">
      <div className="hero-container ">
        <div className="title">
          <div className="head-title">
            <h1>DEVID AURA</h1>
          </div>
          <p>Presence in every step</p>
        </div>
        <div className="bottle-image">
          <img className="bottle-img" src={BottleImage} alt="" />
        </div>

        <div className="hero-bottom">
          <div className="shop-btn">
            <button
              onClick={() =>
                document
                  .getElementById("shop-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="btn-text">Shop Now</span>
              <span>
                <img src={RIghtArrowIcon} alt="Arrow Icon" />
              </span>
            </button>
          </div>
          <div className="social-link">
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={InstagramIcon} alt="" />
            </a>
            <a
              href="https://www.x.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={TwitterIcon} alt="" />
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={FacebookIcon} alt="" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
