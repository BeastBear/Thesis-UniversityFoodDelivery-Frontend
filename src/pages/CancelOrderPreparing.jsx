import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdEdit, MdPhone } from "react-icons/md";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

function CancelOrderPreparing() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select reason, 2: Enter custom reason (if custom), 3: Customer contact, 4: Action/Confirmation (varies by reason)
  const [selectedReason, setSelectedReason] = useState("");

  // Function to refresh shop data
  const refreshShopData = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
    } catch (error) {}
  };
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [closeShopOption, setCloseShopOption] = useState(""); // "today" or "multiple"
  const [closeUntilDate, setCloseUntilDate] = useState("");
  const [outOfStockItems, setOutOfStockItems] = useState([]); // Array of item IDs that are out of stock
  const [reopenTime, setReopenTime] = useState(""); // Time picker for shop busy (HH:MM format)
  const [cancellationCount, setCancellationCount] = useState(0);

  const predefinedReasons = [
    { id: "out_of_stock", label: "Out of stock" },
    { id: "shop_busy", label: "Restaurant is busy/not ready to send" },
    { id: "shop_about_to_close", label: "Restaurant about to close" },
    { id: "shop_closed", label: "Restaurant closed" },
  ];

  // Conversation tips for each reason
  const conversationTips = {
    out_of_stock:
      "Sorry, we're currently out of stock for some items. Would you like to change to other items?",
    shop_busy:
      "Sorry, the restaurant is currently busy and not ready to deliver. We recommend you reorder when the restaurant opens.",
    shop_about_to_close:
      "Sorry, the restaurant is about to close. We recommend you reorder when the restaurant opens.",
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

    const fetchCancellationCount = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/order/cancellation-count`,
          { withCredentials: true },
        );
        setCancellationCount(response.data.count || 0);
      } catch (error) {}
    };

    if (orderId) {
      fetchOrder();
      fetchCancellationCount();
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
    // If "custom" is selected, go to step 2 (enter custom reason)
    // Otherwise, go directly to step 3 (customer contact)
    if (selectedReason === "custom") {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleCustomReasonNext = () => {
    if (!customReason.trim()) {
      setError("Please specify a custom reason");
      return;
    }
    setError("");
    setStep(3); // Move to customer contact step
  };

  const handleOutOfStockConfirm = async () => {
    if (outOfStockItems.length === 0) {
      setError("Please select at least one item that is out of stock");
      return;
    }
    setError("");
    await handleCancelOrder();
  };

  const handleToggleOutOfStockItem = (itemId) => {
    setOutOfStockItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleEditOrder = () => {
    // Navigate to edit order items page
    navigate(`/edit-order-items/${orderId}`);
  };

  const handleShopBusyCancel = async () => {
    if (!reopenTime) {
      setError("Please specify when the restaurant will reopen");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const shopOrder = order.shopOrders[0];
      const shopId = shopOrder.shop?._id || shopOrder.shop;

      // Close shop temporarily with reopen time
      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId, reopenTime },
        { withCredentials: true },
      );

      // Refresh shop data to update Redux state
      await refreshShopData();

      // Now cancel the order
      await handleCancelOrderInternal();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to cancel order");
      setSubmitting(false);
    }
  };

  const handleShopAboutToCloseCancel = async () => {
    setSubmitting(true);
    setError("");

    try {
      const shopOrder = order.shopOrders[0];
      const shopId = shopOrder.shop?._id || shopOrder.shop;

      // Close shop for today
      await axios.post(
        `${serverUrl}/api/shop/close-today`,
        { shopId },
        { withCredentials: true },
      );

      // Refresh shop data to update Redux state
      await refreshShopData();

      // Now cancel the order
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

      // Refresh shop data to update Redux state
      await refreshShopData();

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

    // Refresh cancellation count after successful cancellation
    try {
      const response = await axios.get(
        `${serverUrl}/api/order/cancellation-count`,
        { withCredentials: true },
      );
      setCancellationCount(response.data.count || 0);
    } catch (error) {}

    setSuccess(true);
    setStep(4);
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

  // Only allow cancellation if order is preparing
  if (shopOrder.status !== "preparing") {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-extrabold text-gray-900">
              Cancel Order
            </h1>
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
            <h1 className="text-xl font-extrabold text-gray-900">
              Cancel Order
            </h1>
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
            <p>Number of times cancelled: {cancellationCount}/7 times</p>
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

  // Step 2: Enter Custom Reason (only for custom reason)
  if (step === 2 && selectedReason === "custom") {
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
              Cancel Order
            </h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Order slow"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  rows="3"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleCustomReasonNext}
            disabled={!customReason.trim()}
            className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-orange/20">
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Select Out of Stock Items (only for out_of_stock reason, after customer contact)
  if (step === 4 && selectedReason === "out_of_stock") {
    const shopOrder = order.shopOrders[0];
    const orderItems = shopOrder.shopOrderItems || [];

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => setStep(3)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Select out of stock items
            </h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="text-sm text-gray-700 mb-4">
            Please select which menu items are out of stock
          </p>

          {/* Order Items List */}
          <div className="space-y-3 mb-6">
            {orderItems.map((item, index) => {
              const itemId = item.item?._id || item.item || item._id;
              const isSelected = outOfStockItems.includes(itemId);

              return (
                <label
                  key={index}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-orange-50 border-orange-400 border-2"
                      : "bg-white border-gray-200 hover:bg-white"
                  }`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleOutOfStockItem(itemId)}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-base font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ฿{item.price?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleOutOfStockConfirm}
            disabled={outOfStockItems.length === 0 || submitting}
            className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20">
            {submitting ? (
              <>
                <ClipLoader size={20} color="white" />
                <span>Canceling...</span>
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Customer Contact
  if (step === 3) {
    const currentTip =
      selectedReason === "custom"
        ? `Sorry, customer. Because ${customReason}. The shop requests to cancel the order.`
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
            <h1 className="text-xl font-bold text-gray-900">
              {selectedReason === "out_of_stock"
                ? "Out of stock"
                : selectedReason === "shop_busy"
                  ? "Restaurant is busy/not ready to send"
                  : selectedReason === "shop_about_to_close"
                    ? "Restaurant about to close"
                    : selectedReason === "shop_closed"
                      ? "Restaurant closed"
                      : "Others"}
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
            <p className="text-sm text-gray-700 mb-2">{currentTip}</p>
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
                onClick={() => setStep(4)}
                className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors shadow-lg shadow-primary-orange/20">
                Cancel This Order
              </button>
            </div>
          )}

          {selectedReason === "shop_busy" && (
            <div className="mb-6">
              <button
                onClick={() => setStep(4)}
                disabled={submitting}
                className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-orange/20">
                Cancel This Order
              </button>
            </div>
          )}

          {selectedReason === "shop_about_to_close" && (
            <div className="mb-6">
              <button
                onClick={() => setStep(4)}
                disabled={submitting}
                className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-orange/20">
                Cancel This Order
              </button>
            </div>
          )}

          {selectedReason === "shop_closed" && (
            <div className="mb-6">
              <button
                onClick={() => setStep(4)}
                disabled={submitting}
                className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-orange/20">
                Cancel This Order
              </button>
            </div>
          )}

          {(selectedReason === "custom" ||
            (selectedReason !== "out_of_stock" &&
              selectedReason !== "shop_busy" &&
              selectedReason !== "shop_about_to_close" &&
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

  // Step 4: Action/Confirmation (varies by reason)
  if (step === 4 && !success) {
    // Step 4a: Shop Busy - Time Picker
    if (selectedReason === "shop_busy") {
      return (
        <div className="min-h-screen bg-white pb-24">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center p-4">
              <button
                onClick={() => setStep(3)}
                className="p-2 hover:bg-gray-100 rounded-full mr-2">
                <IoIosArrowRoundBack size={24} className="text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Restaurant temporarily not ready to send
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

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                The system will temporarily close the restaurant. Please specify
                the time the restaurant will reopen.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reopen Time
              </label>
              <input
                type="time"
                value={reopenTime}
                onChange={(e) => setReopenTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleShopBusyCancel}
              disabled={submitting || !reopenTime}
              className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20">
              {submitting ? (
                <>
                  <ClipLoader size={20} color="white" />
                  <span>Canceling...</span>
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
      );
    }

    // Step 4b: Shop About to Close - Success Message
    if (selectedReason === "shop_about_to_close") {
      return (
        <div className="min-h-screen bg-white pb-24">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center p-4">
              <button
                onClick={() => setStep(3)}
                className="p-2 hover:bg-gray-100 rounded-full mr-2">
                <IoIosArrowRoundBack size={24} className="text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Restaurant about to close
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

            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-lg font-bold text-gray-900 mb-2">
                Order cancellation successful
              </p>
              <p className="text-sm text-gray-700">
                The system will automatically close your restaurant for today.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleShopAboutToCloseCancel}
              disabled={submitting}
              className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20">
              {submitting ? (
                <>
                  <ClipLoader size={20} color="white" />
                  <span>Canceling...</span>
                </>
              ) : (
                "Close restaurant today"
              )}
            </button>
          </div>
        </div>
      );
    }

    // Step 4c: Shop Closed - Closure Options
    if (selectedReason === "shop_closed") {
      return (
        <div className="min-h-screen bg-white pb-24">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center p-4">
              <button
                onClick={() => setStep(3)}
                className="p-2 hover:bg-gray-100 rounded-full mr-2">
                <IoIosArrowRoundBack size={24} className="text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Restaurant closed
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

            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-lg font-bold text-gray-900 mb-2">
                Order cancellation successful
              </p>
              <p className="text-sm text-gray-700">
                The system will automatically close your restaurant.
              </p>
            </div>

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
                Close Restaurant for More than 1 Day
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
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleCloseShop}
              disabled={
                submitting ||
                !closeShopOption ||
                (closeShopOption === "multiple" && !closeUntilDate)
              }
              className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20">
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
        </div>
      );
    }

    // Step 4d: Custom reason - Just cancel
    if (selectedReason === "custom") {
      // This will be handled by the regular cancel button in step 3
      return null;
    }
  }

  // Step 5: Success
  if ((step === 4 && success) || (step === 5 && success)) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate("/my-orders")}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Order Cancelled</h1>
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

export default CancelOrderPreparing;
