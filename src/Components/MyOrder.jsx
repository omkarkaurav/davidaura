// src/pages/MyOrders.js
import React, { useContext, useEffect, useState } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/myorder.css";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";

/**
 * Helper function to format a date string into a readable format with AM/PM.
 * @param {string} dateString - The ISO date string.
 * @returns {string} - Formatted date and time.
 */
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

/**
 * MyOrders Component displays a list of orders, allows order tracking,
 * cancellation, and reorder functionality.
 */
const MyOrders = () => {
  const { userdetails, setUserdetails, orders } = useContext(UserContext);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellationMessages, setCancellationMessages] = useState({});

  // Sort orders by createdAt descending (latest order on top)
  const sortedOrders = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Debug: Log orders data on mount/update.
  useEffect(() => {
    sortedOrders.forEach((order) => {
      console.log(
        `Order ${order.orderId}: progressStep = ${order.progressStep}, status = ${order.status}`
      );
    });
  }, [sortedOrders]);

  /**
   * Renders progress steps for an order.
   * @param {number} progressStep - The current progress step of the order.
   * @param {string} status - The current status of the order.
   * @returns {JSX.Element} - The rendered progress steps.
   */
  const renderStepProgress = (progressStep, status) => {
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    // If the order is delivered, mark the final step accordingly.
    const finalProgressStep =
      status === "Delivered" ? steps.length + 1 : progressStep;

    return (
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div key={index} className="step-wrapper">
            <div
              className={`myorder-step ${
                finalProgressStep > index + 1 ? "completed" : ""
              } ${finalProgressStep === index + 1 ? "current" : ""}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{step}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Toggles the visibility of the tracking details for a given order.
   * @param {number|string} orderId - The unique id of the order.
   */
  const trackOrder = (orderId) => {
    setExpandedOrders((prev) => {
      const newState = { ...prev, [orderId]: !prev[orderId] };
      console.log(`Toggled expanded state for Order ${orderId}:`, newState[orderId]);
      return newState;
    });
  };

  /**
   * Handles order cancellation.
   * @param {number|string} orderId - The unique id of the order.
   */
  const cancelOrder = (orderId) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return;

    const orderTimestamp = new Date(order.date).getTime();
    if (Date.now() - orderTimestamp > 120000) {
      setCancellationMessages((prev) => ({
        ...prev,
        [orderId]:
          "Sorry, your order cannot be cancelled because it is already shipped.",
      }));
      return;
    }
    setCancellationMessages((prev) => ({ ...prev, [orderId]: "" }));
    if (window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
      // Update order status in your state or context here.
      // For example:
      // setOrders(prevOrders => prevOrders.map(order => order.orderId === orderId ? { ...order, status: "Cancellation in Progress" } : order));
    }
  };

  /**
   * Placeholder function for reordering.
   * @param {number|string} orderId - The unique id of the order.
   */
  const reorder = (orderId) => {
    console.log("Reorder", orderId);
    // Implement reorder logic here
  };

  return (
    <div className="myorder-container">
      <h1 className="my-order-title">My Orders</h1>
      <div className="myorders">
        <div className="orders-section">
          <div id="orders-list">
            {sortedOrders && sortedOrders.length > 0 ? (
              sortedOrders.map((order, index) => (
                <div key={order.orderId + index} className="order-card">
                  <div className="flex justify-between p-5 font-semibold">
                    <h3>Order #{order.orderId}</h3>
                    <label
                      className={`jhaatu_item text-black border-2 border-white rounded-xl p-5 ${
                        order.paymentStatus === "paid"
                          ? "bg-green-500"
                          : "bg-yellow-400"
                      }`}
                    >
                      {order.paymentStatus}
                    </label>
                  </div>
                  <p className="order-details">
                    <strong>Date:</strong> {formatDateTime(order.createdAt)}
                  </p>
                  <p className="order-details">
                    <strong>Total Amount:</strong> ₹{order.totalAmount}
                  </p>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <img src={item.img || ProductImage} alt={item.name} />
                        <span>
                          {item.productName} - ₹{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="buttons">
                    {order.status !== "Cancellation in Progress" &&
                      order.status !== "Order Cancelled" && (
                        <button
                          className="track-btn"
                          onClick={() => trackOrder(order.orderId)}
                        >
                          {expandedOrders[order.orderId]
                            ? "Hide Track Order"
                            : "Track Order"}
                        </button>
                      )}
                    {order.status === "Delivered" ? (
                      <button
                        className="reorder-btn"
                        onClick={() => reorder(order.orderId)}
                      >
                        Reorder
                      </button>
                    ) : order.status === "Cancellation in Progress" ? (
                      <button className="cancellation-btn" disabled>
                        Cancellation in Progress
                      </button>
                    ) : order.status === "Order Cancelled" ? (
                      <button className="cancelled-btn" disabled>
                        Order Cancelled
                      </button>
                    ) : (
                      <button
                        className="cancel-btn"
                        onClick={() => cancelOrder(order.orderId)}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                  {cancellationMessages[order.orderId] && (
                    <div className="cancel-message">
                      {cancellationMessages[order.orderId]}
                    </div>
                  )}
                  {expandedOrders[order.orderId] && (
                    <div className="order-progress">
                      {renderStepProgress(
                        order.progressStep !== undefined && order.progressStep !== null
                          ? order.progressStep
                          : 0,
                        order.status
                      )}
                    </div>
                  )}
                  {order.status && (
                    <div className="tracking-status flex justify-between items-center ">
                      <span>
                        <strong>Status:</strong> {order.status}
                      </span>
                      <span>
                        <strong>PaymentMode: </strong>
                        {order.paymentMode}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
