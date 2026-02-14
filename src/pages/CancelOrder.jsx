import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdEdit, MdPhone } from "react-icons/md";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";

function CancelOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select reason, 2: Customer contact, 3: Action/Confirmation
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [closeShopOption, setCloseShopOption] = useState(""); // "today" or "multiple"
  const [closeUntilDate, setCloseUntilDate] = useState("");

  const predefinedReasons = [
    { id: "out_of_stock", label: "Out of stock" },
    { id: "shop_busy", label: "Restaurant is busy (closed for 1 hr.)" },
    { id: "shop_closed", label: "Restaurant closed" },
  ];

  // Conversation tips for each reason
  const conversationTips = {
    out_of_stock:
      "Sorry, we're currently out of stock for some items. Would you like to change to other items?",
    shop_busy:
      "Sorry, the restaurant is currently busy and not ready to deliver. We recommend you reorder when the restaurant opens.",
    shop_closed:
      "Sorry, the restaurant is currently closed. We recommend you reorder when the restaurant opens.",
    custom: "Sorry, we request to cancel the order.",
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/order/get-order-by-id/${orderId}`,
          { withCredentials: true },
        );
        setOrder(response.data);
      } catch (error) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    setCustomReason("");
  };

  const handleNext = () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    if (selectedReason === "custom" && !customReason.trim()) {
      setError("Please specify a custom reason");
      return;
    }

    setError("");
    setStep(2); // Move to customer contact step
  };

  const handleEditOrder = () => {
    // Navigate to edit order items page
    navigate(`/edit-order-items/${orderId}`);
  };

  const handleShopBusyCancel = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Just cancel the order directly without temporary closure
      await handleCancelOrderInternal();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to cancel order");
      setSubmitting(false);
    }
  };

  const handleCloseShop = async () => {
    if (!closeShopOption) {
      setError("Please select a restaurant closure option");
      return;
    }

    if (closeShopOption === "multiple" && !closeUntilDate) {
      setError("Please select a closing date");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const shopOrder = order.shopOrders[0];
      const shopId = shopOrder.shop?._id || shopOrder.shop;

      if (closeShopOption === "today") {
        await axios.post(
          `${serverUrl}/api/shop/close-today`,
          { shopId },
          { withCredentials: true },
        );
      } else if (closeShopOption === "multiple") {
        // Calculate days from today to selected date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(closeUntilDate);
        selectedDate.setHours(23, 59, 59, 999);
        const days = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

        await axios.post(
          `${serverUrl}/api/shop/close-multiple-days`,
          { shopId, days: days > 0 ? days : 1 },
          { withCredentials: true },
        );
      }

      // Now cancel the order
      await handleCancelOrderInternal();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to close restaurant");
      setSubmitting(false);
    }
  };

  const handleCancelOrderInternal = async () => {
    const cancelReason =
      selectedReason === "custom"
        ? customReason.trim()
        : predefinedReasons.find((r) => r.id === selectedReason)?.label || "";

    const shopOrder = order.shopOrders[0];
    const shopId = shopOrder.shop?._id || shopOrder.shop;

    if (!shopId) {
      setError("Restaurant information not found");
      setSubmitting(false);
      return;
    }

    await axios.post(
      `${serverUrl}/api/order/cancel-order/${order._id}/${shopId}`,
      { reason: cancelReason },
      { withCredentials: true },
    );

    setSuccess(true);
    setStep(3);
    setSubmitting(false);
  };

  const handleCancelOrder = async () => {
    setSubmitting(true);
    setError("");

    try {
      await handleCancelOrderInternal();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to cancel order. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleFinalAction = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={40} color="#FF6B00" />
      </div>
    );
  }

  if (!order || !order.shopOrders?.[0]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const shopOrder = order.shopOrders[0];
  const customer = order.user;

  // Allow cancellation if order is pending or preparing
  if (shopOrder.status !== "pending" && shopOrder.status !== "preparing") {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Cancel Order</h1>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <p className="text-gray-500 text-center">
            This order cannot be cancelled. Order status: {shopOrder.status}
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Select Reason
  if (step === 1) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Cancel Order</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="text-sm text-gray-700 mb-4">
            Please select the reason for cancellation
          </p>

          {/* Reason Options */}
          <div className="rounded-lg p-4 mb-6 border border-gray-200">
            <div className="space-y-3">
              {predefinedReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleReasonSelect(reason.id)}
                  className={`w-full py-3 px-4 rounded-lg text-left transition-colors ${
                    selectedReason === reason.id
                      ? "bg-orange-200 text-orange-800 border-2 border-orange-400"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-gray-200"
                  }`}>
                  {reason.label}
                </button>
              ))}

              {/* Custom Reason Option */}
              <button
                onClick={() => handleReasonSelect("custom")}
                className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-2 transition-colors ${
                  selectedReason === "custom"
                    ? "bg-orange-200 text-orange-800 border-2 border-orange-400"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-gray-200"
                }`}>
                <MdEdit size={20} />
                <span>Specify reason yourself</span>
              </button>
            </div>

            {/* Custom Reason Input */}
            {selectedReason === "custom" && (
              <div className="mt-4">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify reason..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  rows="3"
                />
              </div>
            )}
          </div>

          {/* Cancellation Info */}
          <div className="mb-6 p-3 bg-white rounded-lg text-xs text-gray-600">
            <p className="mb-1">Cancel order within time: 05:00 minutes</p>
            <p>Number of times cancelled: 0/7 times</p>
            <p className="mt-2 text-xs">
              You can cancel orders within 5 minutes. Maximum 7 cancellations
              per week. Contact customer service if you exceed the limit.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={
              !selectedReason ||
              (selectedReason === "custom" && !customReason.trim())
            }
            className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-orange/20">
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Customer Contact
  if (step === 2) {
    const conversationTip =
      selectedReason === "custom"
        ? customReason
          ? conversationTips.custom
          : conversationTips.custom
        : conversationTips[selectedReason] || conversationTips.custom;

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => setStep(1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-extrabold text-gray-900">
              Contact Customer
            </h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="text-sm text-primary-orange font-extrabold mb-4">
            Please call the customer before confirming cancellation
          </p>

          {/* Customer Details */}
          <div className="mb-4 p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">
                {customer?.fullName || customer?.email || "Customer"}
              </span>
            </div>
            {customer?.mobile && (
              <div className="flex items-center gap-2">
                <MdPhone className="text-primary-orange" size={20} />
                <a
                  href={`tel:${customer.mobile}`}
                  className="text-primary-orange font-extrabold">
                  {customer.mobile}
                </a>
              </div>
            )}
          </div>

          {/* Conversation Tips */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-extrabold text-gray-900 mb-2">
              Conversation Tips
            </p>
            <p className="text-sm text-gray-700 mb-2">{conversationTip}</p>
            <p className="text-xs text-gray-600">
              For orders paid via E-payment, the money will not be deducted.
            </p>
          </div>

          {/* Special Actions Based on Reason */}
          {selectedReason === "out_of_stock" && (
            <div className="mb-6 space-y-3">
              <button
                onClick={handleEditOrder}
                className="w-full py-3 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100 transition-colors border border-orange-200">
                Edit Order Items
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                Cancel This Order
              </button>
            </div>
          )}

          {selectedReason === "shop_busy" && (
            <div className="mb-6">
              <button
                onClick={handleShopBusyCancel}
                disabled={submitting}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <ClipLoader size={20} color="white" />
                    <span>Canceling...</span>
                  </>
                ) : (
                  "Cancel This Order"
                )}
              </button>
            </div>
          )}

          {selectedReason === "shop_closed" && (
            <div className="mb-6 space-y-3">
              <button
                onClick={() => setCloseShopOption("today")}
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  closeShopOption === "today"
                    ? "bg-orange-200 text-orange-800 border-2 border-orange-400"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-gray-200"
                }`}>
                Close Restaurant Today
              </button>
              <button
                onClick={() => setCloseShopOption("multiple")}
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  closeShopOption === "multiple"
                    ? "bg-orange-200 text-orange-800 border-2 border-orange-400"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-gray-200"
                }`}>
                Close Restaurant for Multiple Days
              </button>
              {closeShopOption === "multiple" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closed Until Date
                  </label>
                  <input
                    type="date"
                    value={closeUntilDate}
                    onChange={(e) => setCloseUntilDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <button
                onClick={handleCloseShop}
                disabled={
                  submitting ||
                  !closeShopOption ||
                  (closeShopOption === "multiple" && !closeUntilDate)
                }
                className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <ClipLoader size={20} color="white" />
                    <span>Canceling...</span>
                  </>
                ) : (
                  "Cancel This Order"
                )}
              </button>
            </div>
          )}

          {(selectedReason === "custom" ||
            (selectedReason !== "out_of_stock" &&
              selectedReason !== "shop_busy" &&
              selectedReason !== "shop_closed")) && (
            <button
              onClick={handleCancelOrder}
              disabled={submitting}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <ClipLoader size={20} color="white" />
                  <span>Canceling...</span>
                </>
              ) : (
                "Cancel This Order"
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3 && success) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate("/my-orders")}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-extrabold text-gray-900">
              Order Cancelled
            </h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Order Cancelled Successfully
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              When the order is successfully cancelled, the system will notify
              the customer and the shop.
            </p>
          </div>

          <button
            onClick={handleFinalAction}
            className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors shadow-lg shadow-primary-orange/20">
            Back to Main Page
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default CancelOrder;
