import React from "react";
import "../style/footer.css";
import { useNavigate } from "react-router-dom";

import InstagramIcon from "../assets/instagram-2016-logo-svgrepo-com.svg";
import FacebookIcon from "../assets/icons8-facebook-logo (1).svg";
import TwitterIcon from "../assets/icons8-x (1).svg";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer class="footer">
      <div class="footer-top">
        <div class="footer-container">
          <div class="row">
            <div class="footer-col site-logo">
              <h1>DevidAura</h1>
            </div>
            <div class="footer-col">
              <ul class="footer-nav-links">
                <li>
                  <a
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        const targetElement =
                          document.getElementById("home-section");
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: "smooth" });
                        }
                      } else {
                        navigate("/", { state: { scrollTo: "home-section" } });
                      }
                    }}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        const targetElement =
                          document.getElementById("products-section");
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: "smooth" });
                        }
                      } else {
                        navigate("/", {
                          state: { scrollTo: "products-section" },
                        });
                      }
                    }}
                  >
                    Products
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        const targetElement =
                          document.getElementById("shop-section");
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: "smooth" });
                        }
                      } else {
                        navigate("/", { state: { scrollTo: "shop-section" } });
                      }
                    }}
                  >
                    Shop
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate("/contact")}>Contact Us</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-container">
          <div class="row">
            <div class="footer-col">
              <ul class="social-links">
                <li>
                  <a href="#">
                    <img src={FacebookIcon} alt="" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <img src={InstagramIcon} alt="" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <img src={TwitterIcon} alt="" />
                  </a>
                </li>
              </ul>
            </div>

            <div class="footer-col">
              <p>© 2025. All Rights Reserved.</p>
            </div>
          </div>
          <div className="credits">
            <div className="developer">
              <p className="frontend">
                <strong>Backend:</strong> Dev Bandil
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
