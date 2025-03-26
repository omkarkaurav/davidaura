// src/pages/MyOrders.js

import React, { useContext, useEffect, useState } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/myorder.css";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext"; // Import UserContext

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
  // Retrieve orders and updater function from OrderContext.
  const { orders, setOrders } = useContext(OrderContext);
  // Retrieve user data (e.g., orderCount) from UserContext.
  const { user,setUser } = useContext(UserContext);

  // Local state to manage whether each order's tracking details are expanded.
  const [expandedOrders, setExpandedOrders] = useState({});
  // Local state for cancellation messages, keyed by order id.
  const [cancellationMessages, setCancellationMessages] = useState({});

  // Initialize tracking expansion for each order when orders update.
  useEffect(() => {
    if (orders && orders.length > 0) {
      const initialExpanded = {};
      orders.forEach((order) => {
        initialExpanded[order.id] = true; // All orders open by default.
      });
      setExpandedOrders(initialExpanded);
    }
    setUser(prevUser => ({ ...prevUser, orderCount: orders.length }));
  }, [orders, setUser]);
  

  /**
   * Renders progress steps for an order.
   * @param {number} progressStep - The current progress step of the order.
   * @param {string} status - The current status of the order.
   * @returns {JSX.Element} - The rendered progress steps.
   */
  const renderStepProgress = (progressStep, status) => {
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    // If order is delivered, treat final step as one beyond the last step.
    const finalProgressStep = status === "Delivered" ? steps.length + 1 : progressStep;

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
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  /**
   * Handles order cancellation. Checks if the order can be cancelled
   * (within 2 minutes of order placement). If not, sets an appropriate message.
   * @param {number|string} orderId - The unique id of the order.
   */
  const cancelOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Use order.date to determine if 2 minutes (120,000 ms) have passed.
    const orderTimestamp = new Date(order.date).getTime();
    if (Date.now() - orderTimestamp > 120000) {
      setCancellationMessages((prev) => ({
        ...prev,
        [orderId]:
          "Sorry, your order cannot be cancelled because it is already shipped.",
      }));
      return;
    }
    // Clear any previous cancellation message if cancellation is allowed.
    setCancellationMessages((prev) => ({
      ...prev,
      [orderId]: "",
    }));
    if (window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Cancellation in Progress" }
            : order
        )
      );
    }
  };

  /**
   * Placeholder function for reordering.
   * @param {number|string} orderId - The unique id of the order.
   */
  const reorder = (orderId) => {
    console.log("Reorder", orderId);
    // Implement reorder logic here (e.g., add order items to cart)
  };

  return (
    <div className="myorder-container">
      <h1 className="my-order-title">My Orders</h1>
      {/* Example of displaying user-related information */}
      <p>
        Welcome back! You have placed <strong>{user.orderCount}</strong>{" "}
        {user.orderCount === 1 ? "order" : "orders"}.
      </p>
      <div className="myorders">
        <div className="orders-section">
          <div id="orders-list">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <h3>Order #{order.id}</h3>
                  <p className="order-details">
                    <strong>Date:</strong> {formatDateTime(order.date)}
                  </p>
                  <p className="order-details">
                    <strong>Total Amount:</strong> ₹{order.amount}
                  </p>
                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <img src={item.img || ProductImage} alt={item.name} />
                        <span>
                          {item.name} - ₹{item.dprice} (x{item.quantity})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="buttons">
                    {/* Only show track button if order is not cancelled or in cancellation progress */}
                    {order.status !== "Cancellation in Progress" &&
                      order.status !== "Order Cancelled" && (
                        <button
                          className="track-btn"
                          onClick={() => trackOrder(order.id)}
                        >
                          {expandedOrders[order.id]
                            ? "Hide Track Order"
                            : "Track Order"}
                        </button>
                      )}
                    {/* Conditional rendering based on order status */}
                    {order.status === "Delivered" ? (
                      <button
                        className="reorder-btn"
                        onClick={() => reorder(order.id)}
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
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                  {/* Show cancellation message if exists */}
                  {cancellationMessages[order.id] && (
                    <div className="cancel-message">
                      {cancellationMessages[order.id]}
                    </div>
                  )}
                  {/* Display order progress only if expanded and order is active */}
                  {order.progressStep &&
                    order.status !== "Cancellation in Progress" &&
                    order.status !== "Order Cancelled" &&
                    expandedOrders[order.id] && (
                      <div className="order-progress">
                        {renderStepProgress(order.progressStep, order.status)}
                      </div>
                    )}
                  {/* Always display the current order status */}
                  {order.status && (
                    <div className="tracking-status">
                      <strong>Status:</strong> {order.status}
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
