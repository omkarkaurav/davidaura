import React, { createContext, useState } from "react";

export const CouponContext = createContext();

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: "DISCOUNT10",
      discount: 10,
      description: "Get 10% off on your first order",
      // This condition can be used by your shopping cart logic.
      // For a first order coupon, you might enter either:
      // conditionText: "first order only" (free-form text) or
      // use a function to enforce it:
      conditionText: "first order only",
      condition: (selectedItems, user) => user && user.orderCount === 0,
    },
    {
      id: 2,
      code: "SAVE20",
      discount: 20,
      description: "Get 20% off on orders above ₹1000",
      conditionText: "minTotal:1000",
      condition: (selectedItems, user) =>
        selectedItems.reduce((acc, item) => acc + item.dprice * item.quantity, 0) >= 1000,
    },
    {
      id: 3,
      code: "TENTHORDER",
      discount: 30,
      description: "Get 30% off on your 10th order",
      conditionText: "nthOrder:10",
      condition: (selectedItems, user) =>
        user && (user.orderCount + 1 === 10),
    },
  ]);

  return (
    <CouponContext.Provider value={{ coupons, setCoupons }}>
      {children}
    </CouponContext.Provider>
  );
};
