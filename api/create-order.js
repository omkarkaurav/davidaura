import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_TEST_KEY_ID,
  key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      });
      return res.json(order);
    } catch (err) {
      return res.status(500).json({ error: "Failed to create order" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
