// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import bodyParser from "body-parser";

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_KEY_ID,
    key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
});

/**
 * Endpoint: Create Razorpay Order
 */
app.post("/api/create-order", async (req, res) => {
  const { amount, currency, receipt } = req.body;

  // Convert amount to the smallest currency unit (paise)
  const options = {
    amount: amount * 100, // amount in paise
    currency: currency || "INR",
    receipt: receipt || `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Verify Payment Signature
 */
app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified successfully." });
  } else {
    res.status(400).json({ error: "Payment verification failed." });
  }
});

app.get("/", (req, res) => {
  res.send("Razorpay backend server is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
