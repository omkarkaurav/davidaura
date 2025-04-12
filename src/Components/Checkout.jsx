// src/pages/Checkout.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/checkout.css";
import "../style/cart.css";
import { OrderContext } from "../contexts/OrderContext";
import { db } from "../../configs";
import {
  addressTable,
  addToCartTable,
  orderItemsTable,
  ordersTable,
  UserAddressTable,
} from "../../configs/schema";
import { UserContext } from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { CartContext } from "../contexts/CartContext";
import { eq } from "drizzle-orm";

// -------------------------------------------------------------------
// Helper Function: formatAddress
// Formats an address object into a display string.
// -------------------------------------------------------------------
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.name} - ${address.address}, ${address.city}, ${
    address.state
  }, ${address.country} (${address.postalCode})${
    address.phone ? " - Phone: " + address.phone : ""
  }`;
};

// -------------------------------------------------------------------
// Component: AddressSelection
// Renders a list of saved addresses and a form to add or edit an address.
// -------------------------------------------------------------------
function AddressSelection({
  addresses,
  selectedAddress,
  setSelectedAddress,
  selectedAddressIndex,
  setSelectedAddressIndex,
  newAddress,
  setNewAddress,
  handleSaveAddress,
  handlePincodeBlur,
  handleEditAddress,
  handleDeleteAddress,
  addressFieldsOrder,
  editingIndex,
}) {
  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>
      <div className="address-list">
        {addresses?.map((addr, index) => (
          <div
            key={index}
            className={`address-item ${
              selectedAddressIndex === index ? "active" : ""
            }`}
          >
            <span
              onClick={() => {
                setSelectedAddressIndex(index);
                setSelectedAddress(addr);
                // Reset newAddress when an address is selected
                setNewAddress({
                  name: "",
                  phone: "",
                  address: "",
                  city: "",
                  postalCode: "",
                  state: "",
                  country: "",
                });
              }}
            >
              {formatAddress(addr)}
            </span>

            <div className="address-actions">
              <button
                onClick={() => handleEditAddress(index)}
                className="btn btn-link edit-button"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteAddress(index)}
                className="btn btn-link delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <h3>{editingIndex !== null ? "Edit Address" : "Add New Address"}</h3>
      <div className="new-address-form">
        {addressFieldsOrder.map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newAddress[field]}
            onFocus={() => {
              setSelectedAddress(null);
              setSelectedAddressIndex(null);
            }}
            onChange={(e) =>
              setNewAddress({ ...newAddress, [field]: e.target.value })
            }
            {...(field === "postalCode"
              ? {
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePincodeBlur();
                    }
                  },
                }
              : {})}
            className="form-control"
          />
        ))}
        <div className="address-form-actions">
          {editingIndex !== null ? (
            <button
              onClick={handleSaveAddress}
              className="btn btn-outline-primary"
            >
              Update Address
            </button>
          ) : (
            <button
              onClick={handleSaveAddress}
              className="btn btn-outline-primary"
            >
              Save Address
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Component: OrderSummary
// Displays the selected delivery address, products, and pricing breakdown.
// -------------------------------------------------------------------
function OrderSummary({ selectedAddress, selectedItems, deliveryCharge }) {
  const originalTotal = selectedItems.reduce(
    (acc, item) =>
      acc + Math.floor(item.product.oprice) * (item?.quantity || 1),
    0
  );
  const productTotal = selectedItems.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        item.product.oprice -
          (item?.product.oprice * item?.product.discount) / 100
      ) *
        (item?.quantity || 1),
    0
  );
  const discountCalculated = originalTotal - productTotal;

  return (
    <div className="order-summary">
      <div className="summary-address">
        <strong>Delivery Address:</strong>
        {selectedAddress ? (
          <div className="order-summary-address-item">
            <span>{formatAddress(selectedAddress)}</span>
          </div>
        ) : (
          "Please select an address"
        )}
      </div>
      <div className="selected-products">
        {selectedItems.length > 0 ? (
          selectedItems.map((item, index) => (
            <div key={index} className="selected-product">
              <img src={item.product.imageurl} alt={item.product.name} />
              <div className="product-title-quantity">
                <h3>{item.product.name}</h3>
                <span>{item.product.size} ml</span>
              </div>
              <div className="item-price-quantity">
                <span style={{ color: "green" }}>
                  ₹
                  {Math.floor(
                    item.product.oprice -
                      (item.product.oprice * item.product.discount) / 100
                  )}
                </span>
                <p>Quantity: {item.quantity || 1}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No products selected.</p>
        )}
      </div>
      <div className="price-breakdown">
        <p>
          <span>
            Products (
            {selectedItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}{" "}
            items):
          </span>
          <span>₹{productTotal}</span>
        </p>
        <p>
          <span>Discount:</span>
          <span>₹{discountCalculated}</span>
        </p>
        <p>
          <span>Delivery Charge:</span>
          <span>₹{deliveryCharge}</span>
        </p>
        <div className="total-price">
          <p>
            <span>Total:</span>
            <span>₹{productTotal + deliveryCharge}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Component: PaymentDetails
// Handles payment method selection and displays relevant input fields.
// Includes Razorpay integration.
// -------------------------------------------------------------------
function PaymentDetails({
  paymentMethod,
  setPaymentMethod,
  onPaymentVerified,
  productTotal,
  paymentVerified,
  discountCalculated,
  deliveryCharge,
  totalPrice,
  setTransactionId,
  selectedAddress,
}) {
  const { userdetails } = useContext(UserContext);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Automatically verify payment for Cash on Delivery
  useEffect(() => {
    if (paymentMethod === "Cash on Delivery") {
      onPaymentVerified(true);
    }
  }, [paymentMethod, onPaymentVerified]);

  const isCODAllowed =
    selectedAddress &&
    selectedAddress.city &&
    selectedAddress.city.toLowerCase() === "gwalior";

  // Available payment methods include UPI, Razorpay, and conditionally COD.
  const availablePaymentMethods = ["Razorpay"].concat(
    isCODAllowed ? ["Cash on Delivery"] : []
  );

  // Razorpay payment handler
  const handleRazorpayPayment = () => {
    const options = {
      key: "rzp_test_ewlL5XgMo10QR4",
      amount: totalPrice * 100,
      currency: "INR",
      name: "DevidAura",
      description: "Order Payment",
      prefill: {
        name: userdetails?.name || "",
        email: userdetails?.email || "",
        contact: selectedAddress?.phone || "",
      },
      handler: function (response) {
        console.log("Payment successful:", response);
        setTransactionId(response.razorpay_payment_id);
        onPaymentVerified(true); // <- this sets paymentVerified = true
        toast.success("Payment successful!");
      },
      modal: {
        ondismiss: function () {
          toast.error("Payment cancelled");
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="payment-details">
      <div className="payment-summary">
        <div
          className="summary-header"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
        >
          <span>Payment Section</span>
          <span>
            <span className="payment-total-price">
              <strong>Total Price:</strong> ₹{Math.floor(totalPrice)}
            </span>
            <span className="toggle-icon">{summaryExpanded ? "▲" : "▼"}</span>
          </span>
        </div>
        {summaryExpanded && (
          <div className="summary-details">
            <p>Please review your price details below:</p>
            <p>
              <strong>Products Total:</strong> ₹{Math.floor(productTotal)}
            </p>
            <p>
              <strong>Discount:</strong> ₹{Math.floor(discountCalculated)}
            </p>
            <p>
              <strong>Delivery Charge:</strong> ₹{deliveryCharge}
            </p>
            <p className="total-price-display">
              <strong>Total Price:</strong> ₹{totalPrice}
            </p>
          </div>
        )}
      </div>
      <h2>Payment Options</h2>
      <div className="payment-method-selection">
        {availablePaymentMethods.map((method) => (
          <label key={method} className="payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            {method}
          </label>
        ))}
      </div>
      <div className="payment-method-content">
        {paymentMethod === "Razorpay" && (
          <div className="razorpay-payment-content">
            <h3>UPI</h3>
            <p>Total Amount: ₹{totalPrice}</p>
            <button
              onClick={handleRazorpayPayment}
              className="btn btn-outline-primary"
              disabled={paymentVerified}
            >
              {paymentVerified ? "Paid" : "Pay Now"}
            </button>
          </div>
        )}
        {paymentMethod === "Cash on Delivery" && (
          <div className="cod-payment-content">
            <p>
              You have selected Cash on Delivery. No online payment is required.
              Please prepare the exact amount for the delivery agent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Component: Confirmation
// Displays order confirmation and navigation options after order placement.
// -------------------------------------------------------------------
function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();
  return (
    <div className="confirmation">
      <h2>Order Confirmed!</h2>
      <p>Thank you for your purchase. Your order is being processed.</p>
      <button onClick={() => navigate("/")} className="btn btn-secondary">
        Back to Home
      </button>
      <button onClick={() => navigate("/myorder")} className="btn btn-primary">
        View My Orders
      </button>
    </div>
  );
}

// -------------------------------------------------------------------
// Main Component: Checkout
// Orchestrates the checkout process: address selection, order summary,
// payment, and confirmation.
// -------------------------------------------------------------------
export default function Checkout() {
  const navigate = useNavigate();
  const { orders, setOrders } = useContext(OrderContext);
  const { setCart } = useContext(CartContext);
  const { userdetails, address } = useContext(UserContext);
  // Steps: 1 = Address, 2 = Order Summary, 3 = Payment, 4 = Confirmation
  const [step, setStep] = useState(1);
  // Address-related state
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    country: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const addressFieldsOrder = [
    "name",
    "phone",
    "address",
    "postalCode",
    "city",
    "state",
    "country",
  ];
  // Retrieve selected items from localStorage
  const [selectedItems, setSelectedItems] = useState([]);
  useEffect(() => {
    const items = localStorage.getItem("selectedItems");
    if (items) {
      setSelectedItems(JSON.parse(items));
    }
  }, []);
  const deliveryCharge = 50;
  const originalTotal = selectedItems.reduce(
    (acc, item) => acc + item?.product?.oprice * item?.product?.quantity,
    0
  );
  const productTotal = selectedItems.reduce(
    (acc, item) =>
      acc +
      (item?.product?.oprice -
        (item?.product?.discount / 100) * item?.product?.oprice) *
        item.quantity,
    0
  );
  const discountCalculated = originalTotal - productTotal;
  const totalPrice = Math.floor(productTotal + deliveryCharge);
  // Payment-related state
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [verifiedUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState("PhonePe");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // -------------------------------------------------------------------
  // Handler: Validate postalCode and auto-fill address fields
  // -------------------------------------------------------------------
  const handlePincodeBlur = async () => {
    const { postalCode } = newAddress;
    if (postalCode.length !== 6) {
      alert("Pincode must be 6 digits.");
      return;
    }
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
      const data = await response.json();
      if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
        const location = data[0].PostOffice[0];
        setNewAddress((prev) => ({
          ...prev,
          city: location.District,
          state: location.State,
          country: location.Country,
        }));
      } else {
        alert("Invalid Pincode or no location data found.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      alert("Failed to fetch location from pincode.");
    }
  };

  // -------------------------------------------------------------------
  // Handler: Save new address or update existing address in database
  // -------------------------------------------------------------------
  const saveAddressInDb = async (address) => {
    try {
      await db
        .insert(UserAddressTable)
        .values({ ...address, userId: userdetails.id });
    } catch (error) {
      console.log(error);
    }
  };

  const updatedAddressesInDb = async (address) => {
    try {
      await db
        .update(UserAddressTable)
        .set({ ...address, userId: userdetails.id });
    } catch (error) {
      console.log(error);
    }
  };

  // -------------------------------------------------------------------
  // Handler: Save or update address locally and in the database
  // -------------------------------------------------------------------
  const handleSaveAddress = () => {
    const requiredFields = [
      "name",
      "phone",
      "address",
      "city",
      "postalCode",
      "state",
      "country",
    ];
    const isEmptyField = requiredFields.some(
      (field) => !newAddress[field] || newAddress[field].trim() === ""
    );

    if (isEmptyField) {
      alert(
        "Please fill in all the required fields before saving the address."
      );
      return;
    }

    if (editingIndex !== null) {
      const updatedAddresses = [...addresses];
      updatedAddresses[editingIndex] = newAddress;
      setAddresses(updatedAddresses);
      setSelectedAddress(newAddress);
      updatedAddressesInDb(newAddress);
      setEditingIndex(null);
    } else if (selectedAddress) {
      const index = addresses.findIndex(
        (addr) => addr.postalCode === selectedAddress.postalCode
      );
      if (index !== -1) {
        const updatedAddresses = [...addresses];
        updatedAddresses[index] = newAddress;
        setAddresses(updatedAddresses);
        updatedAddressesInDb(newAddress);
        setSelectedAddress(newAddress);
      } else {
        setAddresses([...addresses, newAddress]);
        saveAddressInDb(newAddress);
        setSelectedAddress(newAddress);
      }
    } else {
      setAddresses([...addresses, newAddress]);
      saveAddressInDb(newAddress);
      setSelectedAddress(newAddress);
    }
    setNewAddress({
      name: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    });
  };

  // -------------------------------------------------------------------
  // Handler: Edit an existing address
  // -------------------------------------------------------------------
  const handleEditAddress = (index) => {
    setNewAddress(addresses[index]);
    setEditingIndex(index);
  };

  // -------------------------------------------------------------------
  // Handler: Delete an address and clear selection if needed
  // -------------------------------------------------------------------
  const handleDeleteAddress = async (index) => {
    const addressToDelete = addresses[index];
    try {
      await db
        .delete(UserAddressTable)
        .where(eq(UserAddressTable.postalCode, addressToDelete.postalCode));

      const updatedAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(updatedAddresses);

      if (
        selectedAddress &&
        addressToDelete.postalCode === selectedAddress.postalCode
      ) {
        setSelectedAddress(null);
      }
      toast.success("Address deleted successfully.");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address. Please try again.");
    }
  };

  // -------------------------------------------------------------------
  // Handler: Create order, update DB, clear cart and navigate to confirmation
  // -------------------------------------------------------------------
  const createorder = async (newOrder, selectedAddress) => {
    if (paymentMethod === "UPI" && transactionId.length < 12) {
      toast.error("Please Fill the TransactionId");
      return;
    }
    try {
      setLoading(true);
      const now = new Date();
      const res = await db
        .insert(ordersTable)
        .values({
          totalAmount: newOrder?.amount,
          userId: userdetails?.id,
          createdAt: now.toString(),
          paymentMode: paymentMethod,
          transactionId: transactionId,
          paymentStatus: paymentVerified && "paid",
        })
        .returning({
          id: ordersTable.id,
          totalAmount: ordersTable.totalAmount,
          createdAt: ordersTable.createdAt,
        });
      await db
        .insert(addressTable)
        .values({
          userId: userdetails.id,
          city: selectedAddress.city,
          country: selectedAddress.country,
          postalCode: selectedAddress?.postalCode,
          state: selectedAddress.state,
          street: selectedAddress.address,
        })
        .returning(addressTable);

      const orderItemsData = selectedItems.map((item) => ({
        orderId: res[0].id,
        productId: item.product.id,
        quantity: item.product.quantity,
        price: Math.floor(
          item.product.oprice -
            (item.product.discount / 100) * item.product.oprice
        ),
        totalPrice:
          Math.floor(
            item.product.oprice -
              (item.product.discount / 100) * item.product.oprice
          ) * item.product?.quantity,
      }));

      await db.insert(orderItemsTable).values(orderItemsData);
      await db
        .delete(addToCartTable)
        .where(eq(addToCartTable.userId, userdetails.id));
      toast.success("Order Placed");
      setCart([]);
      setLoading(false);
      setStep(4);
    } catch (error) {
      console.log(error);
    }
  };

  // -------------------------------------------------------------------
  // Handler: Place Order - validate and create the order
  // -------------------------------------------------------------------
  const handlePlaceOrder = () => {
    if (selectedItems.length === 0) {
      alert("No items selected for the order.");
      return;
    }
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      amount: totalPrice,
      status: "Order Placed",
      progressStep: 1,
      items: selectedItems,
    };
    createorder(newOrder, selectedAddress);
    setOrders((prevOrders) => [...prevOrders, newOrder]);
    localStorage.removeItem("selectedItems");
  };

  // -------------------------------------------------------------------
  // Navigation handlers: Next and Previous steps in checkout
  // -------------------------------------------------------------------
  const handleNext = () => {
    if (step === 1 && !selectedAddress) {
      if (newAddress.name && newAddress.address && newAddress.postalCode) {
        setSelectedAddress(newAddress);
        setNewAddress({
          name: "",
          phone: "",
          address: "",
          city: "",
          postalCode: "",
          state: "",
          country: "",
        });
      } else {
        alert("Please select or enter a valid address.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    if (step === 1) {
      navigate("/cart");
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const resetCheckout = () => setStep(1);

  useEffect(() => {
    setAddresses(address);
  }, [address]);

  return (
    <div className="checkout-wrapper">
      <div className="checkout-header">
        <div className="absolute top-2">
          <ToastContainer />
        </div>
        <h1>Checkout</h1>
        <div className="progress-indicator">
          {["Address", "Order Summary", "Payment", "Confirmation"].map(
            (label, idx) => (
              <div
                key={idx}
                className={`progress-step ${step >= idx + 1 ? "active" : ""}`}
              >
                <span>{idx + 1}</span>
                <p>{label}</p>
              </div>
            )
          )}
        </div>
      </div>
      <div className="checkout-body">
        {step === 1 && (
          <AddressSelection
            addresses={addresses}
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
            selectedAddressIndex={selectedAddressIndex}
            setSelectedAddressIndex={setSelectedAddressIndex}
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            handleSaveAddress={handleSaveAddress}
            handlePincodeBlur={handlePincodeBlur}
            handleEditAddress={handleEditAddress}
            handleDeleteAddress={handleDeleteAddress}
            addressFieldsOrder={addressFieldsOrder}
            editingIndex={editingIndex}
          />
        )}
        {step === 2 && (
          <OrderSummary
            selectedAddress={selectedAddress}
            selectedItems={selectedItems}
            deliveryCharge={deliveryCharge}
          />
        )}
        {step === 3 && (
          <PaymentDetails
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            upiId={upiId}
            setUpiId={setUpiId}
            verifiedUpi={verifiedUpi}
            selectedUpiApp={selectedUpiApp}
            setSelectedUpiApp={setSelectedUpiApp}
            onPaymentVerified={setPaymentVerified}
            paymentVerified={paymentVerified}
            productTotal={productTotal}
            discountCalculated={discountCalculated}
            deliveryCharge={deliveryCharge}
            totalPrice={totalPrice}
            selectedAddress={selectedAddress}
          />
        )}
        {step === 4 && <Confirmation resetCheckout={resetCheckout} />}
      </div>
      <div className="checkout-footer">
        {step !== 4 && (
          <>
            <button onClick={handlePrev} className="btn btn-outline-secondary">
              Back
            </button>
            {step === 3 ? (
              <button
                onClick={handlePlaceOrder}
                className="btn btn-primary"
                disabled={!paymentVerified}
              >
                {loading ? "Placing order..." : "Place Order"}
              </button>
            ) : (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
