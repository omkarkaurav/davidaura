import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      return res.json({ success: true, message: "Payment verified successfully." });
    } else {
      return res.status(400).json({ success: false, error: "Payment verification failed." });
    }
  } catch (error) {
    console.error("❌ Error in verify-payment:", error.message);
    return res.status(500).json({ success: false, error: "Verification error." });
  }
}
