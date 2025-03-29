// src/Components/Adminpanel.js
import React, { useState, useContext, useEffect } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/adminPanel.css";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext"; // Import ContactContext
// import { CartContext } from "../contexts/CartContext"; // Import ContactContext
// import useCloudinaryUpload from "../utils/Usecloudinary";
import { db } from "../../configs/index";

import { useUser } from "@clerk/clerk-react";
import { eq } from "drizzle-orm";
import { useNavigate } from "react-router-dom";
import { ordersTable, productsTable, usersTable } from "../../configs/schema";
import ImageUploadModal from "./ImageUploadModal";

// Dummy data for coupons (if not using global state for coupons)
const dummyCoupons = [
  { id: 1, code: "DISCOUNT10", discount: 10 },
  { id: 2, code: "SAVE20", discount: 20 },
];

// Dummy users data for demonstration (if needed)
const dummyUsers = [
  { id: 1, name: "John Doe", phone: "1234567890" },
  { id: 2, name: "Jane Smith", phone: "9876543210" },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
  // const { uploadImage, imageUrl, loading } = useCloudinaryUpload();
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  // Use global product state from ProductContext
  const { products, setProducts } = useContext(ProductContext);
  const [coupons, setCoupons] = useState(dummyCoupons);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const navigate = useNavigate();
  // Get orders from OrderContext
  const { orders, setOrders } = useContext(OrderContext);

  // Get queries from ContactContext
  const { queries } = useContext(ContactContext);
  const { user } = useUser();
  // New state for orders filtering and search (Orders tab)
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New state for user search (Users tab)
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // New state for query search (Queries tab)
  const [querySearch, setQuerySearch] = useState("");

  // Generate new IDs for products or coupons
  const generateNewId = (list) =>
    list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1;

  const userdetails = async () => {
    try {
      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, user?.primaryPhoneNumber?.phoneNumber));
      res[0].role != "admin" && navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    user && userdetails();
  }, [user]);

  // --- Product Functions ---
  const handleProductUpdate = async (updatedProduct) => {
    // uploadImage(updatedProduct.img);
    try {
      const res = await db
        .insert(productsTable)
        .values({
          name: updatedProduct.name,
          size: updatedProduct.size,
          discount: updatedProduct.discount,
          price: updatedProduct.oprice,
          imageurl: imageUrl,
        })
        .returning(productsTable);
      // console.log(res);
    } catch (error) {
      console.log(error);
    }

    console.log(updatedProduct);
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

  const handleProductDelete = async (productId) => {
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );
      try {
        const res = await db
          .delete(productsTable)
          .where(eq(productsTable?.id, productId));

        setLoading(false);
      } catch (error) {}
    }
  };

  // --- Coupon Functions ---
  const handleCouponUpdate = (updatedCoupon) => {
    setCoupons((prevCoupons) => {
      const exists = prevCoupons.find((c) => c.id === updatedCoupon.id);
      return exists
        ? prevCoupons.map((c) =>
            c.id === updatedCoupon.id ? updatedCoupon : c
          )
        : [...prevCoupons, updatedCoupon];
    });
    setEditingCoupon(null);
  };

  const handleCouponDelete = (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      setCoupons((prevCoupons) => prevCoupons.filter((c) => c.id !== couponId));
    }
  };

  const updateorderstatus = async (orderId, newStatus, newProgressStep) => {
    try {
      const res = await db
        .update(ordersTable)
        .set({ status: newStatus, progressStep: newProgressStep })
        .where(eq(ordersTable.id, orderId));
      console.log("updated");
    } catch (error) {
      console.log(error);
    }
  };
  // --- Order Functions ---
  const handleOrderStatusUpdate = (orderId, newStatus, newProgressStep) => {
    updateorderstatus(orderId, newStatus, newProgressStep);
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus, progressStep: newProgressStep }
        : order
    );
    setOrders(updatedOrders);
  };

  // --- Users Section (Optional) ---
  // Enrich dummy users with their orders (if orders have a userId property)
  const users = dummyUsers.map((user) => ({
    ...user,
    orders: orders.filter((order) => order.userId === user.id),
  }));

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.phone.includes(userSearchQuery)
  );

  // --- Orders Tab Filtering ---
  const statusFilteredOrders =
    orderStatusTab === "All"
      ? orders
      : orders.filter((order) => order.status === orderStatusTab);
  const searchedOrders = statusFilteredOrders.filter(
    (order) =>
      order.orderId.toString().includes(orderSearchQuery) ||
      order.date.includes(orderSearchQuery)
  );

  // --- Queries Tab Filtering ---
  const filteredQueries = queries.filter(
    (q) =>
      q.email.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.phone.includes(querySearch)
  );
  const handleorderdetails = (order) => {
    setSelectedOrder(order);
  };
  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <nav className="admin-nav">
        <button onClick={() => setActiveTab("products")}>Products</button>
        <button onClick={() => setActiveTab("coupons")}>Coupon Codes</button>
        <button onClick={() => setActiveTab("orders")}>Orders</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("queries")}>Queries</button>
      </nav>

      <div className="admin-content">
        {/* Products Tab */}
        {openModal && <ImageUploadModal isopen={openModal} />}
        {activeTab === "products" && (
          <div className="products-tab">
            <h2>Manage Products</h2>
            <button
              className="admin-btn add-btn"
              onClick={() => setOpenModal(true)}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) =>
                  editingProduct && editingProduct.id === product.id ? (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img
                          src={product?.imageurl}
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
                              // Generate a preview URL
                              const imageUrl = URL.createObjectURL(file);

                              // Update local state with preview
                              setEditingProduct({
                                ...editingProduct,
                                img: imageUrl, // Local preview
                              });

                              // Call the upload function
                              uploadImage(file);
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
                  ) : (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img
                          src={product.imageurl}
                          alt={product.name}
                          width="50"
                          height="50"
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>₹{product.oprice}</td>
                      <td>{product.discount}</td>
                      <td>{product.size}</td>
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
                          {loading ? "deleting" : "delete"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
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
                              // Generate a preview URL
                              const imageUrl = URL.createObjectURL(file);

                              // Update local state with preview
                              setEditingProduct({
                                ...editingProduct,
                                img: imageUrl, // Local preview
                              });

                              // Call the upload function
                              uploadImage(file);
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

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="coupons-tab">
            <h2>Manage Coupon Codes</h2>
            <button
              className="admin-btn add-btn"
              onClick={() => {
                const newCoupon = {
                  id: generateNewId(coupons),
                  code: "",
                  discount: 0,
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

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="orders-tab">
            <h2>Manage Orders</h2>
            <div className="orders-header">
              <span>Total Orders: {orders.length}</span>
              <div className="order-tabs">
                {[
                  "All",
                  "Order Placed",
                  "Processing",
                  "Shipped",
                  "Delivered",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusTab(status)}
                    className={orderStatusTab === status ? "active" : ""}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="order-search">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {(() => {
              const filteredOrders =
                orderStatusTab === "All"
                  ? orders
                  : orders.filter((order) => order.status === orderStatusTab);
              const searchedOrders = filteredOrders.filter(
                (order) =>
                  order.orderId.toString().includes(orderSearchQuery) ||
                  order.createdAt.includes(orderSearchQuery)
              );

              return searchedOrders.length > 0 ? (
                searchedOrders.map((order) => (
                  <div key={order.orderId} className="order-card-admin">
                    <h3>Order #{order.orderId}</h3>
                    <p>
                      <strong>Date:</strong> {order.createdAt}
                    </p>
                    <p>
                      <strong>Total:</strong> ₹{order.totalAmount}
                    </p>
                    <p>
                      <strong>Current Status:</strong> {order.status || "N/A"}
                    </p>

                    {/* Status Selection */}
                    <div>
                      <label>
                        Update Status:
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusUpdate(
                              order.id,
                              e.target.value,
                              order.progressStep
                            )
                          }
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </label>
                    </div>

                    {/* Progress Step Selection */}
                    <div>
                      <label>
                        Progress Step:
                        <select
                          value={order.progressStep}
                          onChange={(e) =>
                            handleOrderStatusUpdate(
                              order.orderId,
                              order.status,
                              parseInt(e.target.value)
                            )
                          }
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </label>
                    </div>

                    {/* Progress Bar */}
                    {order.progressStep && (
                      <div className="order-progress">
                        {(() => {
                          const steps = [
                            "Order Placed",
                            "Processing",
                            "Shipped",
                            "Delivered",
                          ];
                          return (
                            <div className="progress-steps ">
                              {steps.map((step, index) => (
                                <div key={index} className="step-wrapper">
                                  <div
                                    className={`step ${
                                      order.progressStep > index
                                        ? "completed"
                                        : " "
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

                    {/* See More Details Button */}
                    <button
                      className="view-details-btn-dhamaal "
                      onClick={() => handleorderdetails(order)}
                    >
                      See More Details
                    </button>
                  </div>
                ))
              ) : (
                <p>No orders found.</p>
              );
            })()}
          </div>
        )}

        {/* Popup for Order Details */}
        {selectedOrder && (
          <OrderDetailsPopup
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}

        {/* Users Tab */}
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
                        <div key={order.orderIdid} className="user-order">
                          <span>
                            Order #{order.orderId} - ₹{order.amount} -{" "}
                            {order.status}
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
        {/* Queries Tab */}
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
            {(() => {
              // Update filtering to check for email, phone, and date (if query.date exists)
              const filteredQueries = queries.filter(
                (q) =>
                  q.email.toLowerCase().includes(querySearch.toLowerCase()) ||
                  q.phone.includes(querySearch) ||
                  (q.date && q.date.includes(querySearch))
              );
              return filteredQueries.length > 0 ? (
                filteredQueries.map((query, index) => (
                  <div key={index} className="query-card">
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
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

const OrderDetailsPopup = ({ order, onClose }) => {
  return (
    <div className="modal-overlay-chamkila">
      <div className="modal-content-badshah">
        <button className="close-btn-tata" onClick={onClose}>
          ×
        </button>
        <h2>Order Details (#{order.orderId})</h2>
        <p>
          <strong>User Name:</strong> {order.userName}
        </p>
        <p>
          <strong>Phone:</strong> {order.phone}
        </p>
        <p>
          <strong>Payment Mode:</strong> {order.paymentMode}
        </p>
        <p>
          <strong>Total Amount:</strong> ₹{order.totalAmount}
        </p>
        <p>
          <strong>Status:</strong> {order.status}
        </p>
        <p>
          <strong>Address:</strong> {order.address}, {order.city}, {order.state}
          , {order.zip}, {order.country}
        </p>

        <h3>Products:</h3>
        <ul>
          {order.products.map((product) => (
            <li key={product.productId}>
              {product.productName} (x{product.quantity}) - ₹{product.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
