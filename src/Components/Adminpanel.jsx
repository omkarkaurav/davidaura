// src/Components/Adminpanel.js
import React, { useState, useContext, useEffect } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/adminPanel.css";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { db } from "../../configs/index";
import { useUser } from "@clerk/clerk-react";
import { eq } from "drizzle-orm";
import { useNavigate } from "react-router-dom";
import {
  addToCartTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  usersTable,
} from "../../configs/schema";
import ImageUploadModal from "./ImageUploadModal";
import { UserContext } from "../contexts/UserContext";
import { toast, ToastContainer } from "react-toastify";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [openModal, setOpenModal] = useState(false);
  const [detailsmodal, setDetailsmodal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { products, setProducts } = useContext(ProductContext);
  const [coupons, setCoupons] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const navigate = useNavigate();
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { queries } = useContext(ContactContext);
  const { user } = useUser();
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userkiDetails, setUserkiDetails] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");

  const { getquery } = useContext(ContactContext);

  // Instead of dummy users, fetch users from the database
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await db.select().from(usersTable);
        setUsersList(res);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
    getquery();
  }, []);

  // Enrich users with orders from context
  const usersWithOrders = usersList.map((user) => ({
    ...user,
    orders: orders.filter((order) => order.userId === user.id),
  }));

  const filteredUsers = usersWithOrders.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.phone.includes(userSearchQuery)
  );

  const generateNewId = (list) =>
    list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1;

  const userdetails = async () => {
    try {
      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, user?.primaryPhoneNumber?.phoneNumber));
      setUserkiDetails(res[0]);
      if (res[0].role !== "admin") {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      userdetails();
    }
  }, [user]);

  useEffect(() => {
    getorders();
  }, []);

  // --- Product Functions ---
  const handleProductUpdate = async (updatedProduct) => {
    try {
      const res = await db
        .insert(productsTable)
        .values({
          name: updatedProduct.name,
          size: updatedProduct.size,
          discount: updatedProduct.discount,
          price: updatedProduct.oprice,
          imageurl: updatedProduct.imageurl,
        })
        .returning(productsTable);
      toast.success("Product added Successfully");
    } catch (error) {
      const { message } = error;
      toast.error(message);
    }

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
    if (userkiDetails?.role !== "admin") return;
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );
      try {
        await db
          .delete(orderItemsTable)
          .where(eq(orderItemsTable.productId, productId));
        await db
          .delete(addToCartTable)
          .where(eq(addToCartTable.productId, productId));
        await db.delete(productsTable).where(eq(productsTable.id, productId));
        console.log("Product and related cart entries deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
      setLoading(false);
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
      await db
        .update(ordersTable)
        .set({ status: newStatus, progressStep: newProgressStep })
        .where(eq(ordersTable.id, orderId));
      console.log("updated");
    } catch (error) {
      console.log(error);
    }
  };

  // --- Order Functions ---
  const sortedOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusFilteredOrders =
    orderStatusTab === "All"
      ? sortedOrders
      : sortedOrders.filter(
          (order) =>
            order.status.trim().toLowerCase() ===
            orderStatusTab.trim().toLowerCase()
        );
  const searchedOrders = statusFilteredOrders.filter(
    (order) =>
      order.orderId.toString().includes(orderSearchQuery) ||
      order.createdAt.includes(orderSearchQuery)
  );

  const handleOrderStatusUpdate = (orderId, newStatus, newProgressStep) => {
    updateorderstatus(orderId, newStatus, newProgressStep);
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus, progressStep: newProgressStep }
        : order
    );
    setOrders(updatedOrders);
  };

  const handleorderdetails = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="admin-panel">
      <div className="absolute">
        <ToastContainer />
      </div>
      <h1>Admin Panel</h1>
      <nav className="admin-nav">
        <button onClick={() => setActiveTab("products")}>Products</button>
        <button onClick={() => setActiveTab("coupons")}>Coupon Codes</button>
        <button onClick={() => setActiveTab("orders")}>Orders</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("queries")}>Queries</button>
      </nav>

      <div className="admin-content">
        {openModal && <ImageUploadModal isopen={openModal} />}

        {/* Products Tab */}
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
                              const imageUrl = URL.createObjectURL(file);
                              setEditingProduct({
                                ...editingProduct,
                                imageurl: imageUrl,
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
                          src={editingProduct.imageurl}
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
                                imageurl: imageUrl,
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

            {searchedOrders.length > 0 ? (
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
                          <div className="progress-steps">
                            {steps.map((step, index) => {
                              const isCompleted =
                                order.progressStep > index - 1;
                              const isCurrent =
                                order.progressStep === index + 1;
                              return (
                                <div key={index} className="step-wrapper">
                                  <div
                                    className={`step-samosa ${
                                      isCompleted ? "completed-pizza" : ""
                                    } ${isCurrent ? "current-burger" : ""}`}
                                  >
                                    <div
                                      className={`step-number-lassi ${
                                        order.progressStep > index
                                          ? " bg-green-300 text-white"
                                          : ""
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <div className="step-label">{step}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <button
                    className="view-details-btn-dhamaal"
                    onClick={() => handleorderdetails(order)}
                  >
                    See More Details
                  </button>
                  {selectedOrder && (
                    <OrderDetailsPopup
                      order={selectedOrder}
                      onClose={() => setSelectedOrder(null)}
                    />
                  )}
                </div>
              ))
            ) : (
              <p>No orders found.</p>
            )}
          </div>
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
                        <div key={order.orderId} className="user-order">
                          <span>
                            Order #{order.orderId} - ₹{order.totalAmount} -{" "}
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
  const [paymentStatus, setPaymentStatus] = useState(
    order.paymentMode?.trim() === "Cash on Delivery"
      ? order.paymentStatus || "pending"
      : order.paymentStatus
  );
    const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const value = e.target.value;
    setPaymentStatus(value);
    setLoading(true);

    try {
      await db
        .update(ordersTable)
        .set({ paymentStatus: value })
        .where(eq(ordersTable.id, order.orderId));
      console.log("Updated payment status");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-chamkila">
      <div className="modal-content-badshah">
        <button disabled={loading} className="close-btn-tata" onClick={onClose}>
          ×
        </button>
        <br />
        <br />
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
          <strong>Payment Status:</strong>{" "}
          {order.paymentMode === "Cash on Delivery" ? (
            <select value={paymentStatus} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="paid">Paid</option>
            </select>
          ) : (
            <span>{order.paymentStatus}</span>
          )}
        </p>
        {paymentStatus === "paid" && (
          <p className="paid-status">✅ Payment Successful</p>
        )}
        {order.paymentMode !== " Cash on Delivery" && (
          <p>
            <strong>Transaction Id:</strong> {order.trasactionId}
          </p>
        )}
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
        <p>
          <strong>Products:</strong>

          {order.products.map((product) => (
            <li key={product.productId}>
              {product.productName} (x{product.quantity}) - ₹{product.price}
            </li>
          ))}
        </p>
      </div>
    </div>
  );
};
