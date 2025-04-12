// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// ✅ Enable CORS for frontend on localhost:5173
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

// ✅ Middleware for parsing JSON
app.use(bodyParser.json());

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_TEST_KEY_ID,
  key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
});

// ✅ Create Razorpay Order
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid or missing amount." });
    }

    const options = {
      amount: amount * 100, // convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);
    res.json(order);
  } catch (error) {
    console.error("❌ Error in /api/create-order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Verify Razorpay Payment
app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_TEST_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("🔍 Signature Check:");
    console.log("Generated:", generatedSignature);
    console.log("Received :", razorpay_signature);

    if (generatedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully." });
    } else {
      res.status(400).json({ success: false, error: "Payment verification failed." });
    }
  } catch (error) {
    console.error("❌ Error in /api/verify-payment:", error.message);
    res.status(500).json({ success: false, error: "Verification error." });
  }
});

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.send("✅ Razorpay backend server is running.");
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}...`);
});
