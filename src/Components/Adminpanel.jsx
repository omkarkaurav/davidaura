// src/Components/AdminPanel.js

// ============================
// 1. Import Statements
// ============================
import React, { useState, useContext } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/adminPanel.css";

// Contexts for global state management
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { CartContext } from "../contexts/CartContext"; // (currently not used)
import { CouponContext } from "../contexts/CouponContext";

// ============================
// 2. Dummy Data for Development
// ============================

// Dummy user data for demonstration purposes.
const dummyUsers = [
  { id: 1, name: "John Doe", phone: "1234567890" },
  { id: 2, name: "Jane Smith", phone: "9876543210" },
];

// ============================
// 3. AdminPanel Component
// ============================
const AdminPanel = () => {
  // ----------------------------
  // State for Active Tab and Global Data
  // ----------------------------
  const [activeTab, setActiveTab] = useState("products");

  // Global product state via context
  const { products, setProducts } = useContext(ProductContext);
  // Global order state via context
  const { orders, setOrders } = useContext(OrderContext);
  // Global queries state via context (e.g., from a contact form)
  const { queries } = useContext(ContactContext);

  // Local state for managing coupons (using dummy data for now)
  const { coupons, setCoupons } = useContext(CouponContext);

  // ----------------------------
  // Local state for Editing and Search
  // ----------------------------
  // For product and coupon editing
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Search and filter states for orders, users, and queries
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");

  // ----------------------------
  // Helper Function: Generate New Unique IDs
  // ----------------------------
  const generateNewId = (list) =>
    list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1;

  // ============================
  // 4. Product Management Functions
  // ============================
  // Update an existing product or add a new product
  const handleProductUpdate = (updatedProduct) => {
    setProducts((prevProducts) => {
      const exists = prevProducts.find((p) => p.id === updatedProduct.id);
      return exists
        ? prevProducts.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        : [...prevProducts, updatedProduct];
    });
    setEditingProduct(null);
  };

  // Delete a product after confirmation
  const handleProductDelete = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );
    }
  };

  // ============================
  // 5. Coupon Management Functions
  // ============================

  // Helper to convert conditionText to a condition function
  const getConditionFunction = (conditionText) => {
    if (!conditionText) return null;
    const cond = conditionText.toLowerCase().trim();
  
    // First Order condition
    if (cond === "first order only" || cond === "firstorder") {
      return (selectedItems, user, coupon) => user && user.orderCount === 0;
    }
  
    // Minimum total condition (with optional "once" flag)
    if (cond.startsWith("mintotal:")) {
      // Check if condition includes a single-use flag
      const once = cond.includes("once") || cond.includes("singleuse");
      // Expect the condition to be formatted like "mintotal:1000, once"
      const parts = cond.split(",");
      const minTotalPart = parts[0].trim(); // e.g., "mintotal:1000"
      const minTotal = parseFloat(minTotalPart.split(":")[1]);
      return (selectedItems, user, coupon) => {
        // If single-use is enabled and coupon has already been used, return false
        if (once && coupon.used) return false;
        const total = selectedItems.reduce(
          (acc, item) => acc + item.dprice * item.quantity,
          0
        );
        return total >= minTotal;
      };
    }
  
    // nth order condition, e.g., "nthorder:10"
    if (cond.startsWith("nthorder:")) {
      const nth = parseInt(cond.split(":")[1], 10);
      return (selectedItems, user, coupon) => user && (user.orderCount + 1 === nth);
    }
  
    return null;
  };
  

const handleCouponUpdate = (updatedCoupon) => {
  const conditionFn = getConditionFunction(updatedCoupon.conditionText);
  const updatedCouponWithCondition = {
    ...updatedCoupon,
    condition: conditionFn,
  };
  setCoupons((prevCoupons) => {
    const exists = prevCoupons.find((c) => c.id === updatedCouponWithCondition.id);
    return exists
      ? prevCoupons.map((c) =>
          c.id === updatedCouponWithCondition.id ? updatedCouponWithCondition : c
        )
      : [...prevCoupons, updatedCouponWithCondition];
  });
  setEditingCoupon(null);
};


  // Delete a coupon after confirmation
  const handleCouponDelete = (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      setCoupons((prevCoupons) => prevCoupons.filter((c) => c.id !== couponId));
    }
  };

  // ============================
  // 6. Order Management Functions
  // ============================
  // Update the status and progress step of an order
  const handleOrderStatusUpdate = (orderId, newStatus, newProgressStep) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus, progressStep: newProgressStep }
        : order
    );
    setOrders(updatedOrders);
  };

  // Accept an order cancellation request and update its status
  const acceptCancelOrder = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: "Order Cancelled", progressStep: null }
          : order
      )
    );
  };

  // Reject an order cancellation request and revert status to Processing
  const rejectCancelOrder = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: "Processing" } : order
      )
    );
  };

  // ============================
  // 7. Users Data & Filtering
  // ============================
  // Attach orders to each dummy user (assumes orders have a userId property)
  const users = dummyUsers.map((user) => ({
    ...user,
    orders: orders.filter((order) => order.userId === user.id),
  }));

  // Filter users based on name or phone search input
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.phone.includes(userSearchQuery)
  );

  // ============================
  // 8. Orders and Queries Filtering (Local Calculations)
  // ============================
  // Filter orders based on the active status tab and search query
  const statusFilteredOrders =
    orderStatusTab === "All"
      ? orders
      : orderStatusTab === "Cancelled"
      ? orders.filter((order) => order.status === "Order Cancelled")
      : orders.filter((order) => order.status === orderStatusTab);

  const searchedOrders = statusFilteredOrders.filter(
    (order) =>
      order.id.toString().includes(orderSearchQuery) ||
      order.date.includes(orderSearchQuery)
  );

  // Filter queries based on email, phone, or date search input
  const filteredQueries = queries.filter(
    (q) =>
      q.email.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.phone.includes(querySearch) ||
      (q.date && q.date.includes(querySearch))
  );

  // ============================
  // 9. Render the Admin Panel Interface (JSX)
  // ============================
  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button onClick={() => setActiveTab("products")}>Products</button>
        <button onClick={() => setActiveTab("coupons")}>Coupon Codes</button>
        <button onClick={() => setActiveTab("orders")}>Orders</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("queries")}>Queries</button>
      </nav>

      <div className="admin-content">
        {/* --------------------------
            Products Management Tab
        --------------------------- */}
        {activeTab === "products" && (
          <div className="products-tab">
            <h2>Manage Products</h2>
            <button
              className="admin-btn add-btn"
              onClick={() => {
                // Create a new product with default values and a generated unique ID
                const newProduct = {
                  id: generateNewId(products),
                  name: "",
                  oprice: 0,
                  discount: 0,
                  size: 0,
                  img: ProductImage,
                  description: "",
                  composition: "",
                  fragranceNotes: "",
                  fragrance: "",
                };
                setEditingProduct(newProduct);
              }}
            >
              Add New Product
            </button>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Original Price</th>
                  <th>Discount (%)</th>
                  <th>Size (ml)</th>
                  <th>Description</th>
                  <th>Composition</th>
                  <th>Fragrance Notes</th>
                  <th>Fragrance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Display list of products or editing form if product is being edited */}
                {products.map((product) =>
                  editingProduct && editingProduct.id === product.id ? (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img
                          src={editingProduct.img}
                          alt={editingProduct.name}
                          width="50"
                          height="50"
                        />
                        <br />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const imageUrl = URL.createObjectURL(file);
                              setEditingProduct({
                                ...editingProduct,
                                img: imageUrl,
                              });
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.oprice}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              oprice: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.discount}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              discount: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.size}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              size: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.description || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.composition || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              composition: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.fragranceNotes || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              fragranceNotes: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.fragrance || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              fragrance: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => handleProductUpdate(editingProduct)}
                        >
                          Save
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingProduct(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img
                          src={product.img}
                          alt={product.name}
                          width="50"
                          height="50"
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>₹{product.oprice}</td>
                      <td>{product.discount}</td>
                      <td>{product.size}</td>
                      <td>{product.description}</td>
                      <td>{product.composition}</td>
                      <td>{product.fragranceNotes}</td>
                      <td>{product.fragrance}</td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn delete-btn"
                          onClick={() => handleProductDelete(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
                {/* Render a new product row if adding one */}
                {editingProduct &&
                  !products.find((p) => p.id === editingProduct.id) && (
                    <tr key={editingProduct.id}>
                      <td>{editingProduct.id}</td>
                      <td>
                        <img
                          src={editingProduct.img}
                          alt={editingProduct.name}
                          width="50"
                          height="50"
                        />
                        <br />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const imageUrl = URL.createObjectURL(file);
                              setEditingProduct({
                                ...editingProduct,
                                img: imageUrl,
                              });
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.oprice}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              oprice: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.discount}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              discount: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingProduct.size}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              size: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => handleProductUpdate(editingProduct)}
                        >
                          Save
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingProduct(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        )}
        {/* --------------------------
    Coupons Management Tab
-{/* --------------------------
    Coupons Management Tab
--------------------------- */}
        {activeTab === "coupons" && (
          <div className="coupons-tab">
            <h2>Manage Coupon Codes</h2>
            <button
              className="admin-btn add-btn"
              onClick={() => {
                // Create a new coupon with a generated unique ID and default values
                const newCoupon = {
                  id: generateNewId(coupons),
                  code: "",
                  discount: 0,
                  description: "", // New field for coupon description
                  conditionText: "", // New field for coupon condition (as text)
                };
                setEditingCoupon(newCoupon);
              }}
            >
              Add New Coupon
            </button>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Coupon Code</th>
                  <th>Discount (%)</th>
                  <th>Description</th>
                  <th>Condition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) =>
                  editingCoupon && editingCoupon.id === coupon.id ? (
                    <tr key={coupon.id}>
                      <td>{coupon.id}</td>
                      <td>
                        <input
                          type="text"
                          value={editingCoupon.code}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              code: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingCoupon.discount}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discount: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter description (e.g., 'Get 10% off on your first order')"
                          value={editingCoupon.description || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              description: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter condition (e.g., 'first order only', 'minTotal:1000' or 'nthOrder:10')"
                          value={editingCoupon.conditionText || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              conditionText: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => handleCouponUpdate(editingCoupon)}
                        >
                          Save
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingCoupon(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={coupon.id}>
                      <td>{coupon.id}</td>
                      <td>{coupon.code}</td>
                      <td>{coupon.discount}</td>
                      <td>{coupon.description}</td>
                      <td>{coupon.conditionText}</td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingCoupon(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn delete-btn"
                          onClick={() => handleCouponDelete(coupon.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
                {/* Render a new coupon row if adding one */}
                {editingCoupon &&
                  !coupons.find((c) => c.id === editingCoupon.id) && (
                    <tr key={editingCoupon.id}>
                      <td>{editingCoupon.id}</td>
                      <td>
                        <input
                          type="text"
                          value={editingCoupon.code}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              code: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingCoupon.discount}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discount: parseFloat(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter description"
                          value={editingCoupon.description || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              description: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter condition"
                          value={editingCoupon.conditionText || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              conditionText: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => handleCouponUpdate(editingCoupon)}
                        >
                          Save
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingCoupon(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        )}

        {/* --------------------------
            Orders Management Tab
        --------------------------- */}
        {activeTab === "orders" && (
          <div className="orders-tab">
            <h2>Manage Orders</h2>
            <div className="orders-header">
              <span>Total Orders: {orders.length}</span>
              {/* Order Status Tabs */}
              <div className="order-tabs">
                <button
                  onClick={() => setOrderStatusTab("All")}
                  className={orderStatusTab === "All" ? "active" : ""}
                >
                  All
                </button>
                <button
                  onClick={() => setOrderStatusTab("Order Placed")}
                  className={orderStatusTab === "Order Placed" ? "active" : ""}
                >
                  Placed
                </button>
                <button
                  onClick={() => setOrderStatusTab("Processing")}
                  className={orderStatusTab === "Processing" ? "active" : ""}
                >
                  Processing
                </button>
                <button
                  onClick={() => setOrderStatusTab("Shipped")}
                  className={orderStatusTab === "Shipped" ? "active" : ""}
                >
                  Shipped
                </button>
                <button
                  onClick={() => setOrderStatusTab("Delivered")}
                  className={orderStatusTab === "Delivered" ? "active" : ""}
                >
                  Delivered
                </button>
                <button
                  onClick={() => setOrderStatusTab("Cancelled")}
                  className={orderStatusTab === "Cancelled" ? "active" : ""}
                >
                  Cancelled
                </button>
              </div>
              {/* Order Search Input */}
              <div className="order-search">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {/* List orders after filtering by status and search query */}
            {(() => {
              const statusFiltered =
                orderStatusTab === "All"
                  ? orders
                  : orderStatusTab === "Cancelled"
                  ? orders.filter((order) => order.status === "Order Cancelled")
                  : orders.filter((order) => order.status === orderStatusTab);
              const searchedOrders = statusFiltered.filter(
                (order) =>
                  order.id.toString().includes(orderSearchQuery) ||
                  order.date.includes(orderSearchQuery)
              );
              return searchedOrders.length > 0 ? (
                searchedOrders.map((order) => (
                  <div key={order.id} className="order-card-admin">
                    <h3>Order #{order.id}</h3>
                    <p>
                      <strong>Date:</strong> {order.date}
                    </p>
                    <p>
                      <strong>Total:</strong> ₹{order.amount}
                    </p>
                    <p>
                      <strong>Current Status:</strong> {order.status || "N/A"}
                    </p>
                    {/* Display cancellation acceptance/rejection if in progress */}
                    {order.status === "Cancellation in Progress" && (
                      <div className="cancel-action-buttons">
                        <button
                          className="admin-btn accept-btn"
                          onClick={() => acceptCancelOrder(order.id)}
                        >
                          Accept Cancellation
                        </button>
                        <button
                          className="admin-btn reject-btn"
                          onClick={() => rejectCancelOrder(order.id)}
                        >
                          Reject Cancellation
                        </button>
                      </div>
                    )}
                    {/* Hide status update if order is cancelled */}
                    {order.status !== "Order Cancelled" && (
                      <>
                        <div>
                          <label>
                            Update Status:{" "}
                            <select
                              defaultValue={order.status}
                              onChange={(e) =>
                                handleOrderStatusUpdate(
                                  order.id,
                                  e.target.value,
                                  order.progressStep
                                )
                              }
                            >
                              <option value="">Select</option>
                              <option value="Order Placed">Order Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </label>
                        </div>
                        <div>
                          <label>
                            Progress Step:{" "}
                            <select
                              defaultValue={order.progressStep}
                              onChange={(e) =>
                                handleOrderStatusUpdate(
                                  order.id,
                                  order.status,
                                  parseInt(e.target.value)
                                )
                              }
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                            </select>
                          </label>
                        </div>
                      </>
                    )}
                    {/* Display visual order progress if available */}
                    {order.progressStep &&
                      order.status !== "Order Cancelled" && (
                        <div className="order-progress">
                          {(() => {
                            const steps = [
                              "Order Placed",
                              "Processing",
                              "Shipped",
                              "Delivered",
                            ];
                            return (
                              <div className="progress-steps">
                                {steps.map((step, index) => (
                                  <div key={index} className="step-wrapper">
                                    <div
                                      className={`myorder-step ${
                                        order.progressStep > index
                                          ? "completed"
                                          : ""
                                      } ${
                                        order.progressStep === index + 1
                                          ? "current"
                                          : ""
                                      }`}
                                    >
                                      <div className="step-number">
                                        {index + 1}
                                      </div>
                                      <div className="step-label">{step}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    {order.status && (
                      <div className="tracking-status">
                        <strong>Status:</strong> {order.status}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No orders found.</p>
              );
            })()}
          </div>
        )}

        {/* --------------------------
            Users Management Tab
        --------------------------- */}
        {activeTab === "users" && (
          <div className="users-tab">
            <h2>User Details</h2>
            <div className="user-search">
              <input
                type="text"
                placeholder="Search users by name or phone..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="user-card">
                  <h3>{user.name}</h3>
                  <p>Phone: {user.phone}</p>
                  <p>Total Orders: {user.orders.length}</p>
                  {user.orders.length > 0 && (
                    <div className="user-orders">
                      <h4>Orders:</h4>
                      {user.orders.map((order) => (
                        <div key={order.id} className="user-order">
                          <span>
                            Order #{order.id} - ₹{order.amount} - {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No users found.</p>
            )}
          </div>
        )}

        {/* --------------------------
            Queries Management Tab
        --------------------------- */}
        {activeTab === "queries" && (
          <div className="queries-tab">
            <h2>User Queries</h2>
            <div className="query-search">
              <input
                type="text"
                placeholder="Search queries by email, phone or date..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
              />
            </div>
            {filteredQueries.length > 0 ? (
              filteredQueries.map((query, index) => (
                <div key={index} className="query-card">
                   <p>
                    <strong>Name:</strong> {query.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {query.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {query.phone}
                  </p>
                  {query.date && (
                    <p>
                      <strong>Date:</strong> {query.date}
                    </p>
                  )}
                  <p>
                    <strong>Message:</strong> {query.message}
                  </p>
                </div>
              ))
            ) : (
              <p>No queries found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
