// src/components/LoginRegisterForm.js

import React, { useState } from "react";
import "../style/login.css";

/**
 * LoginRegisterForm Component
 * This component provides a form for user registration and login.
 * Users can toggle between the registration and login forms.
 */
const LoginRegisterForm = () => {
  // ------------------------------------------------------------------
  // Form Toggle State
  // ------------------------------------------------------------------
  const [form, setForm] = useState("register-form");

  // ------------------------------------------------------------------
  // Registration State, Errors, and Touched Fields
  // ------------------------------------------------------------------
  const initialRegisterState = { name: "", email: "", phone: "", otp: "" };
  const initialRegisterErrors = { name: "", email: "", phone: "", otp: "" };
  const initialRegisterTouched = { name: false, email: false, phone: false, otp: false };

  const [registerValues, setRegisterValues] = useState(initialRegisterState);
  const [registerErrors, setRegisterErrors] = useState(initialRegisterErrors);
  const [registerTouched, setRegisterTouched] = useState(initialRegisterTouched);

  // ------------------------------------------------------------------
  // Login State, Errors, and Touched Fields
  // ------------------------------------------------------------------
  const initialLoginState = { phone: "", otp: "" };
  const initialLoginErrors = { phone: "", otp: "" };
  const initialLoginTouched = { phone: false, otp: false };

  const [loginValues, setLoginValues] = useState(initialLoginState);
  const [loginErrors, setLoginErrors] = useState(initialLoginErrors);
  const [loginTouched, setLoginTouched] = useState(initialLoginTouched);

  // State to store the generated OTP after clicking "Send OTP"
  const [loginGeneratedOtp, setLoginGeneratedOtp] = useState("");
  const [registerGeneratedOtp, setRegisterGeneratedOtp] = useState("");

  // ------------------------------------------------------------------
  // Function to Switch Between Forms and Reset State
  // ------------------------------------------------------------------
  const showForm = (formId) => {
    // Reset all input fields and error messages for both forms
    setRegisterValues(initialRegisterState);
    setRegisterErrors(initialRegisterErrors);
    setRegisterTouched(initialRegisterTouched);
    setLoginValues(initialLoginState);
    setLoginErrors(initialLoginErrors);
    setLoginTouched(initialLoginTouched);
    setForm(formId);
  };

  // ------------------------------------------------------------------
  // Validation Functions
  // ------------------------------------------------------------------
  const validateRegisterField = (field, value) => {
    let error = "";
    if (field === "name") {
      if (!value.trim()) {
        error = "Full name is required.";
      } else if (value.trim().length < 3) {
        error = "Full name must be at least 3 characters.";
      }
      return error;
    }
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Email is required.";
      } else if (!emailRegex.test(value)) {
        error = "Invalid email address.";
      }
      return error;
    }
    if (field === "phone") {
      if (!value.trim()) {
        error = "Phone number is required.";
      } else if (!/^\d{10}$/.test(value)) {
        error = "Phone number must be 10 digits.";
      }
      return error;
    }
    if (field === "otp") {
      if (!value.trim()) {
        error = "OTP is required.";
      } else if (!/^\d{6}$/.test(value)) {
        error = "OTP must be 6 digits.";
      }
      return error;
    }
  };

  const validateLoginField = (field, value) => {
    let error = "";
    if (field === "phone") {
      if (!value.trim()) {
        error = "Phone number is required.";
      } else if (!/^\d{10}$/.test(value)) {
        error = "Phone number must be 10 digits.";
      }
      return error;
    }
    if (field === "otp") {
      if (!value.trim()) {
        error = "OTP is required.";
      } else if (!/^\d{6}$/.test(value)) {
        error = "OTP must be 6 digits.";
      }
      return error;
    }
  };

  // ------------------------------------------------------------------
  // Registration Form Handlers
  // ------------------------------------------------------------------
  const handleRegisterChange = (e) => {
    let { id, value } = e.target;
    // For phone and otp fields, filter out non-numeric characters
    if (id === "phone" || id === "otp") {
      value = value.replace(/\D/g, "");
      if (id === "phone" && value.length > 10) {
        value = value.slice(0, 10);
      } else if (id === "otp" && value.length > 6) {
        value = value.slice(0, 6);
      }
    }
    setRegisterValues((prev) => ({ ...prev, [id]: value }));
    if (registerTouched[id]) {
      const error = validateRegisterField(id, value);
      setRegisterErrors((prev) => ({ ...prev, [id]: error }));
    }
  };

  const handleRegisterBlur = (e) => {
    const { id, value } = e.target;
    setRegisterTouched((prev) => ({ ...prev, [id]: true }));
    const error = validateRegisterField(id, value);
    setRegisterErrors((prev) => ({ ...prev, [id]: error }));
  };

  // ------------------------------------------------------------------
  // Login Form Handlers
  // ------------------------------------------------------------------
  const handleLoginChange = (e) => {
    let { id, value } = e.target;
    // For phone and otp fields, filter out non-numeric characters
    if (id === "phone" || id === "otp") {
      value = value.replace(/\D/g, "");
      if (id === "phone" && value.length > 10) {
        value = value.slice(0, 10);
      } else if (id === "otp" && value.length > 6) {
        value = value.slice(0, 6);
      }
    }
    setLoginValues((prev) => ({ ...prev, [id]: value }));
    if (loginTouched[id]) {
      const error = validateLoginField(id, value);
      setLoginErrors((prev) => ({ ...prev, [id]: error }));
    }
  };

  const handleLoginBlur = (e) => {
    const { id, value } = e.target;
    setLoginTouched((prev) => ({ ...prev, [id]: true }));
    const error = validateLoginField(id, value);
    setLoginErrors((prev) => ({ ...prev, [id]: error }));
  };

  // ------------------------------------------------------------------
  // Form Validation Functions
  // ------------------------------------------------------------------
  const validateRegister = () => {
    const errors = {};
    Object.keys(registerValues).forEach((field) => {
      errors[field] = validateRegisterField(field, registerValues[field]);
    });
    setRegisterErrors(errors);
    return Object.values(errors).every((error) => error === "");
  };

  const validateLogin = () => {
    const errors = {};
    Object.keys(loginValues).forEach((field) => {
      errors[field] = validateLoginField(field, loginValues[field]);
    });
    setLoginErrors(errors);
    return Object.values(errors).every((error) => error === "");
  };

  // ------------------------------------------------------------------
  // Form Submit Handlers
  // ------------------------------------------------------------------
  const handleRegisterSubmit = () => {
    if (validateRegister()) {
      console.log("Registration successful", registerValues);
      alert("Registration successful!");
    } 
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (validateLogin()) {
      if (!loginGeneratedOtp) {
        alert("Please send OTP first.");
        return;
      }
      if (loginValues.otp !== loginGeneratedOtp) {
        setLoginErrors((prev) => ({ ...prev, otp: "OTP doesn't match." }));
        alert("OTP doesn't match.");
        return;
      }
      console.log("Login successful", loginValues);
      alert("Login successful!");
    }
  };

  // ------------------------------------------------------------------
  // OTP Button Handlers
  // ------------------------------------------------------------------
  const handleSendLoginOtp = () => {
    const phoneError = validateLoginField("phone", loginValues.phone);
    if (phoneError) {
      setLoginErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setLoginGeneratedOtp(generatedOtp);
    setLoginValues((prev) => ({ ...prev, otp: generatedOtp }));
    console.log("Login OTP sent:", generatedOtp);
    alert(`OTP sent to your phone! (For testing, OTP is: ${generatedOtp})`);
  };

  const handleSendRegisterOtp = () => {
    const phoneError = validateRegisterField("phone", registerValues.phone);
    if (phoneError) {
      setRegisterErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setRegisterGeneratedOtp(generatedOtp);
    setRegisterValues((prev) => ({ ...prev, otp: generatedOtp }));
    console.log("Registration OTP sent:", generatedOtp);
    alert(`OTP sent to your phone! (For testing, OTP is: ${generatedOtp})`);
  };

  // ------------------------------------------------------------------
  // Render Component
  // ------------------------------------------------------------------
  return (
    <div className="login-register-container">
      {/* Registration Form */}
      {form === "register-form" && (
        <div className="register_form" id="register-form">
          <form action="#">
            <h3>Register</h3>
            {/* Full Name Input */}
            <div className="input_box">
              <label htmlFor="name">Enter Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter full name"
                value={registerValues.name}
                onChange={handleRegisterChange}
                onBlur={handleRegisterBlur}
                required
              />
              {registerTouched.name && registerErrors.name && (
                <span className="error">{registerErrors.name}</span>
              )}
            </div>
            {/* Email Input */}
            <div className="input_box">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter email address"
                value={registerValues.email}
                onChange={handleRegisterChange}
                onBlur={handleRegisterBlur}
                required
              />
              {registerTouched.email && registerErrors.email && (
                <span className="error">{registerErrors.email}</span>
              )}
            </div>
            {/* Phone Input */}
            <div className="input_box">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                placeholder="Enter phone number"
                value={registerValues.phone}
                onChange={handleRegisterChange}
                onBlur={handleRegisterBlur}
                inputMode="numeric"
                maxLength="10"
                required
              />
              {registerTouched.phone && registerErrors.phone && (
                <span className="error">{registerErrors.phone}</span>
              )}
            </div>
            {/* OTP Input with "Send OTP" Button */}
            <div className="input_box">
              <label htmlFor="otp">OTP</label>
              <div className="phone-number">
                <input
                  type="text"
                  id="otp"
                  placeholder="Enter OTP"
                  value={registerValues.otp}
                  onChange={handleRegisterChange}
                  onBlur={handleRegisterBlur}
                  inputMode="numeric"
                  maxLength="6"
                  required
                />
                <button
                  type="button"
                  id="otpBtn"
                  onClick={handleSendRegisterOtp}
                >
                  Send OTP
                </button>
              </div>
              {registerTouched.otp && registerErrors.otp && (
                <span className="error">{registerErrors.otp}</span>
              )}
            </div>
            {/* Register Submit Button */}
            <button
              type="button"
              id="registerBtn"
              onClick={handleRegisterSubmit}
            >
              Register
            </button>
            {/* Link to Switch to Login Form */}
            <p className="sign_up">
              Already have an account?{" "}
              <a
                href="#"
                onClick={() => showForm("login-form")}
                className="show-login"
              >
                Log in
              </a>
            </p>
          </form>
        </div>
      )}

      {/* Login Form */}
      {form === "login-form" && (
        <div className="login_form" id="login-form">
          <form onSubmit={handleLoginSubmit}>
            <h3>Log in</h3>
            {/* Phone Input */}
            <div className="input_box">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                placeholder="Enter phone number"
                value={loginValues.phone}
                onChange={handleLoginChange}
                onBlur={handleLoginBlur}
                inputMode="numeric"
                maxLength="10"
                required
              />
              {loginTouched.phone && loginErrors.phone && (
                <span className="error">{loginErrors.phone}</span>
              )}
            </div>
            {/* OTP Input with "Send OTP" Button */}
            <div className="input_box">
              <label htmlFor="otp">OTP</label>
              <div className="phone-number">
                <input
                  type="text"
                  id="otp"
                  placeholder="Enter OTP"
                  value={loginValues.otp}
                  onChange={handleLoginChange}
                  onBlur={handleLoginBlur}
                  inputMode="numeric"
                  maxLength="6"
                  required
                />
                <button type="button" id="otpBtn" onClick={handleSendLoginOtp}>
                  Send OTP
                </button>
              </div>
              {loginTouched.otp && loginErrors.otp && (
                <span className="error">{loginErrors.otp}</span>
              )}
            </div>
            {/* Login Submit Button */}
            <button type="submit" id="loginBtn">
              Log In
            </button>
            {/* Link to Switch to Registration Form */}
            <p className="sign_up">
              Don't have an account?{" "}
              <a
                href="#"
                onClick={() => showForm("register-form")}
                className="show-register"
              >
                Sign up
              </a>
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginRegisterForm;
