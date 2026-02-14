import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoIosArrowRoundBack, IoMdCall, IoMdHelpCircle } from "react-icons/io";
import { MdPhone, MdAccessTime, MdEdit, MdHeadsetMic } from "react-icons/md";
import {
  FaTruck,
  FaMapMarkerAlt,
  FaStar,
  FaArrowLeft,
  FaMoneyBillWave,
  FaCreditCard,
  FaMotorcycle,
  FaCheckCircle,
} from "react-icons/fa";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import ReviewDelivery from "./ReviewDelivery";

function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditCancelModal, setShowEditCancelModal] = useState(false);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, type: null });

  const queryParams = new URLSearchParams(location.search);
  const targetShopOrderId = queryParams.get("shopOrderId");

  const fetchOrder = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true },
      );
      setOrder(response.data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load order details";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async (status) => {
    if (!order || !order.shopOrders?.[0]) return;

    try {
      const shopOrder = order.shopOrders[0];
      await axios.post(
        `${serverUrl}/api/order/update-status/${order._id}/${shopOrder.shop._id}`,
        { status },
        { withCredentials: true },
      );
      dispatch(
        updateOrderStatus({
          orderId: order._id,
          shopId: shopOrder.shop._id,
          status,
        }),
      );
      setOrder((prev) => ({
        ...prev,
        shopOrders: prev.shopOrders.map((so) =>
          so._id === shopOrder._id ? { ...so, status } : so,
        ),
      }));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update order status";
      toast.error(msg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const formatSelectedOptions = (selectedOptions) => {
    if (!selectedOptions || typeof selectedOptions !== "object") return "";

    const parts = [];
    Object.values(selectedOptions).forEach((value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        const names = value
          .map((v) => (typeof v === "string" ? v : v?.name))
          .filter(Boolean);
        if (names.length) parts.push(names.join(", "));
        return;
      }

      if (typeof value === "object") {
        if (typeof value.name === "string") {
          parts.push(value.name);
          return;
        }

        const names = Object.keys(value).filter((k) => value[k]);
        if (names.length) parts.push(names.join(", "));
        return;
      }
    });

    return parts.filter(Boolean).join(" • ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (!order || !order.shopOrders || order.shopOrders.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  // For deliverers, find the shopOrder assigned to them
  // For owners, use the first shopOrder
  let shopOrder;
  if (userData?.role === "deliveryBoy") {
    shopOrder = order.shopOrders.find((so) => {
      const assigned = so.assignedDeliveryBoy;
      if (!assigned) return false;
      const assignedId =
        typeof assigned === "object" && assigned !== null
          ? assigned._id || assigned.id || assigned
          : assigned;
      return assignedId?.toString() === userData?._id?.toString();
    });
  } else if (userData?.role === "user") {
    if (targetShopOrderId) {
      shopOrder =
        order.shopOrders.find((so) => so._id === targetShopOrderId) ||
        order.shopOrders[0];
    } else {
      shopOrder = order.shopOrders[0];
    }
  } else {
    shopOrder = order.shopOrders[0];
  }

  if (!shopOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Order not found or not assigned to you</p>
      </div>
    );
  }

  const customerName = order.user?.fullName || order.user?.email || "Customer";
  const customerPhone = order.user?.mobile || "N/A";
  const orderDate = formatDate(order.createdAt);
  const shopName = shopOrder.shop?.name || "Restaurant";
  const orderCode = order._id ? order._id : "N/A";
  // Use persistent orderId if available, otherwise fallback to sliced _id
  const displayOrderId =
    typeof order.orderId === "string" && order.orderId.startsWith("LMF-")
      ? orderCode
      : order.orderId || orderCode;

  // Calculate totals
  const subtotal = shopOrder.subtotal || 0;
  const deliveryFee = order.deliveryFee || 0;
  const total = userData?.role === "deliveryBoy" ? deliveryFee : subtotal; // This logic for total seems specific to deliverer earning vs user cost.
  // For User view, total should be subtotal + deliveryFee (roughly)
  const userTotal = order.totalAmount || subtotal + deliveryFee;

  // For deliverers, show job details format
  if (userData?.role === "deliveryBoy") {
    const orderId = order?._id || "";
    const lastFourChars = orderId.length >= 4 ? orderId.slice(-4) : orderId;

    return (
      <div className="min-h-screen bg-white overflow-y-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-800 hover:text-gray-600">
            <FaArrowLeft size={18} />
            <span className="text-base font-medium">
              Order #{lastFourChars}
            </span>
          </button>
        </div>

        {/* Route Details */}
        <div className="px-4 py-4">
          {/* Step 1: Go to Restaurant */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 mb-1">
                Go to the restaurant
              </p>
              <p className="text-sm font-medium text-gray-800 mb-1">
                {shopOrder?.shop?.name || "Restaurant"}
              </p>
              {shopOrder?.shop?.address && (
                <p className="text-xs text-gray-600 mt-1">
                  {shopOrder.shop.address}
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Deliver to Customer */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 mb-1">
                Deliver to customer
              </p>
              <p className="text-sm font-medium text-gray-800 mb-1">
                {customerName}
              </p>
              {order?.deliveryAddress?.text && (
                <p className="text-xs text-gray-600 mt-1">
                  {order.deliveryAddress.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Income Details Section */}
        <div className="px-4 py-4 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Income Details
          </h2>

          <div className="space-y-3">
            {/* Delivery Fee */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Delivery Fee (Wallet)</p>
              <p className="text-sm font-semibold text-gray-800">
                ฿{(deliveryFee || 0).toFixed(2)}
              </p>
            </div>

            {/* Net Income */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-300">
              <p className="text-base font-bold text-gray-800">Net Income</p>
              <p className="text-base font-bold text-gray-800">
                ฿{(deliveryFee || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Coins Received */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">Coins Received</p>
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-500" size={16} />
              <p className="text-sm font-semibold text-gray-800">5</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New User Order Detail View
  if (userData?.role === "user") {
    // Derive review flags & completion status
    const isCompleted = shopOrder.status === "delivered";
    const isRestaurantReviewed = shopOrder.isRestaurantReviewed || false;
    const isDriverReviewed = shopOrder.isDriverReviewed || false;
    const hasDeliverer = !!shopOrder.assignedDeliveryBoy;

    const delivererName =
      shopOrder.assignedDeliveryBoy?.fullName || "Deliverer";
    const delivererInitial = delivererName.charAt(0).toUpperCase();

    const handleReviewClick = (type) => {
      setReviewModal({ isOpen: true, type });
    };

    const handleReviewModalClose = async () => {
      setReviewModal({ isOpen: false, type: null });
      // Refresh order data to get updated review status
      await fetchOrder();
    };

    // If review overlay is open, render it full-screen
    if (reviewModal.isOpen) {
      return (
        <ReviewDelivery
          order={order}
          shopOrder={shopOrder}
          reviewType={reviewModal.type}
          onClose={handleReviewModalClose}
        />
      );
    }

    return (
      <div className="min-h-screen bg-white pb-28">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {/* Restaurant + Order Info */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-gray-900 truncate">
                  {shopName}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{orderDate}</p>
              </div>
            </div>

            <div className="mt-4">
              {isCompleted ? (
                isRestaurantReviewed ? (
                  <div className="w-full px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold bg-green-50 text-green-600 border border-green-100">
                    <FaCheckCircle size={14} />
                    Reviewed
                  </div>
                ) : (
                  <button
                    onClick={() => handleReviewClick("restaurant")}
                    className="w-full px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors border"
                    style={{
                      backgroundColor: "var(--color-primary-bg-light)",
                      color: "var(--color-primary)",
                      borderColor: "var(--color-primary-border)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--color-primary-bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--color-primary-bg-light)")
                    }>
                    <FaStar size={14} />
                    Review Restaurant
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    if (shopOrder.shop?.shopNumber) {
                      window.location.href = `tel:${shopOrder.shop.shopNumber}`;
                    } else {
                      toast.error("Restaurant phone number not available");
                    }
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors border"
                  style={{
                    backgroundColor: "var(--color-primary-bg-light)",
                    color: "var(--color-primary)",
                    borderColor: "var(--color-primary-border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--color-primary-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--color-primary-bg-light)")
                  }>
                  <IoMdCall size={16} />
                  Call restaurant
                </button>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-extrabold text-gray-900 mb-4">
              Delivery
            </h3>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--color-primary-bg-light)",
                  color: "var(--color-primary)",
                }}>
                <FaMapMarkerAlt size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-gray-900 truncate">
                  {customerName}
                </p>
                <p className="text-xs text-gray-500">{customerPhone}</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {order.deliveryAddress?.text || "No address provided"}
                </p>
                {/* Note/Instruction */}
                {order.deliveryAddress?.note && (
                  <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-3">
                    <p className="text-xs font-bold text-gray-700">Note</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {order.deliveryAddress.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-extrabold text-gray-900 mb-4">
              Items
            </h3>
            <div className="space-y-4">
              {shopOrder.shopOrderItems?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-sm font-extrabold text-gray-800 shrink-0">
                    {item.quantity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-sm font-extrabold text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm font-extrabold text-gray-900 shrink-0">
                        ฿{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    {/* Selected Options */}
                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 &&
                      formatSelectedOptions(item.selectedOptions) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {formatSelectedOptions(item.selectedOptions)}
                        </div>
                      )}
                    {item.additionalRequest && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        "{item.additionalRequest}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="p-5">
            <h3 className="text-base font-extrabold text-gray-900 mb-4">
              Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Food</span>
                <span className="text-gray-900 font-bold">
                  ฿{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivery fee</span>
                <span className="text-gray-900 font-bold">
                  ฿{deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span
                    className="font-extrabold text-lg"
                    style={{ color: "var(--color-primary)" }}>
                    Total
                  </span>
                  <IoMdHelpCircle className="text-gray-400" size={16} />
                </div>
                <span
                  className="font-extrabold text-lg"
                  style={{ color: "var(--color-primary)" }}>
                  ฿{userTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800"
              aria-label="Back">
              <IoIosArrowRoundBack size={28} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-gray-900 truncate">
                Order #{(displayOrderId || "").toString().slice(-4)}
              </h1>
              <p className="text-xs text-gray-500 truncate">{customerName}</p>
            </div>
          </div>

          {userData?.role === "owner" && shopOrder.status === "preparing" && (
            <button
              type="button"
              onClick={() => navigate(`/edit-order-items/${order._id}`)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-white border border-gray-200 text-gray-700 font-bold text-xs">
              <MdEdit size={18} />
              Edit items
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Cancellation Banner */}
        {shopOrder.status === "cancelled" && shopOrder.cancelReason && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-extrabold shrink-0">
                ×
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-extrabold text-gray-900">
                  Order cancelled
                </div>
                <div className="text-xs text-red-700 font-bold mt-1">
                  Restaurant
                </div>
                <div className="text-sm text-gray-700 mt-2 leading-relaxed">
                  {shopOrder.cancelReason}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-gray-900 truncate">
                  {customerName}
                </h2>
                <MdPhone className="text-primary-orange" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Created: {orderDate}</p>
              <p className="text-xs text-gray-500 mt-1">{shopName}</p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                ID: {(displayOrderId || "").toString().slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                <FaMapMarkerAlt size={16} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Delivery
                </div>
                <div className="text-xs text-gray-500">
                  {order?.deliveryAddress?.text || "No address provided"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Food List */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h3 className="text-base font-extrabold text-gray-900">Items</h3>
            <div className="text-xs font-bold text-gray-500">
              {shopOrder.shopOrderItems?.length || 0} items
            </div>
          </div>
          <div className="space-y-4">
            {shopOrder.shopOrderItems?.map((item, index) => (
              <div
                key={index}
                className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 truncate">
                      {item.quantity}x {item.name}
                    </p>
                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 &&
                      formatSelectedOptions(item.selectedOptions) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {formatSelectedOptions(item.selectedOptions)}
                        </div>
                      )}
                    {item.additionalRequest && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Note: {item.additionalRequest}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 shrink-0">
                    ฿{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-5">
          <h3 className="text-base font-extrabold text-gray-900 mb-4">
            Summary
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Payment
              </p>
              <p className="text-sm font-extrabold text-gray-900 mt-1">
                {order.paymentMethod === "cod" ? "Cash" : "E-payment"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Total
              </p>
              <p className="text-lg font-extrabold mt-1 text-primary-orange">
                ฿{total.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-bold">
                ฿{subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show for owners */}
        {userData?.role === "owner" && (
          <>
            {shopOrder.status === "pending" && (
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/cancel-order-pending/${order._id}`)}
                  className="flex-1 py-3 bg-red-50 text-red-700 rounded-2xl font-bold hover:bg-red-100 transition-colors border border-red-100">
                  Cancel Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus("preparing");
                    navigate(-1);
                  }}
                  className="flex-1 py-3 bg-primary-orange text-white rounded-2xl font-extrabold transition-colors hover:bg-primary-orange/90">
                  Accept Order
                </button>
              </div>
            )}

            {shopOrder.status === "preparing" && (
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditCancelModal(true);
                  }}
                  className="flex-1 py-3 bg-white text-gray-700 rounded-2xl font-bold hover:bg-white transition-colors border border-gray-200">
                  Edit or Cancel Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus("out of delivery");
                    navigate(-1);
                  }}
                  className="flex-1 py-3 bg-primary-orange text-white rounded-2xl font-extrabold transition-colors shadow-lg shadow-primary-orange/20 hover:bg-primary-orange/90">
                  Ready for Delivery
                </button>
              </div>
            )}

            {shopOrder.status === "cancelled" && (
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Add customer service action (e.g., navigate to support page, open chat, etc.)
                  }}
                  className="flex-1 py-3 bg-primary-orange text-white rounded-2xl font-extrabold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20 hover:bg-primary-orange/90">
                  <MdHeadsetMic size={20} />
                  <span>Customer Service</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit or Cancel Order Modal */}
      {showEditCancelModal && (
        <>
          {/* Very light overlay - allows order detail to show through */}
          <div
            className="fixed inset-0 bg-black bg-opacity-5 z-40"
            onClick={() => setShowEditCancelModal(false)}
          />
          {/* Bottom sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex items-end pointer-events-none">
            <div
              className="bg-white w-full rounded-t-3xl p-6 pb-8 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {/* Edit Some Items Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCancelModal(false);
                    navigate(`/edit-order-items/${order._id}`);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <MdEdit className="text-primary-orange" size={24} />
                    <span className="text-base text-gray-900">
                      Edit some items
                    </span>
                  </div>
                  <span className="text-gray-400">{">"}</span>
                </button>

                {/* Cancel Order Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCancelModal(false);
                    navigate(`/cancel-order-preparing/${order._id}`);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">×</span>
                      </div>
                    </div>
                    <span className="text-base text-gray-900">
                      Cancel this order
                    </span>
                  </div>
                  <span className="text-gray-400">{">"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrderDetail;
