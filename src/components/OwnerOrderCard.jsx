import axios from "axios";
import React, { useState, useEffect } from "react";
import { MdPhone, MdAccessTime, MdRestaurant, MdPerson } from "react-icons/md";
import { FaCheck, FaExclamationCircle } from "react-icons/fa";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";

function OwnerOrderCard({ data, activeTab = "preparing" }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const [countdown, setCountdown] = useState("");
  const [pendingCountdown, setPendingCountdown] = useState("");
  const [isViewed, setIsViewed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Safety check: ensure data, user, and shopOrders exist
  if (
    !data ||
    !data.user ||
    !data.shopOrders ||
    !Array.isArray(data.shopOrders) ||
    data.shopOrders.length === 0
  ) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-100 rounded mb-2"></div>
      </div>
    );
  }

  // Get the first shop order (since owner's orders are filtered by their shop)
  const shopOrder = data.shopOrders[0];

  const handleUpdateStatus = async (orderId, shopId, status) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true },
      );
      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setAvailableBoys(result.data.availableBoys);
    } catch (error) {}
  };

  const handleAcceptOrder = () => {
    if (shopOrder?.status === "pending") {
      handleUpdateStatus(data._id, shopOrder?.shop?._id, "preparing");
    }
  };

  const handleReadyForDelivery = () => {
    if (shopOrder?.status === "preparing") {
      handleUpdateStatus(data._id, shopOrder?.shop?._id, "out of delivery");
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatItemOptions = (item) => {
    const source =
      item?.selectedOptions ||
      item?.variants ||
      item?.modifiers ||
      item?.options;

    if (!source || typeof source !== "object") return "";

    const parts = [];
    const values = Array.isArray(source) ? source : Object.values(source);

    values.forEach((value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        const names = value
          .map((v) => (typeof v === "string" ? v : v?.name))
          .filter(Boolean);
        if (names.length) parts.push(names.join(", "));
        return;
      }

      if (typeof value === "object") {
        if (typeof value.name === "string" && value.name) {
          parts.push(value.name);
          return;
        }

        const names = Object.keys(value).filter((k) => value[k]);
        if (names.length) parts.push(names.join(", "));
        return;
      }

      if (typeof value === "string") {
        parts.push(value);
      }
    });

    return parts.filter(Boolean).join(", ");
  };

  // Countdown timer for pending orders (5 minutes)
  useEffect(() => {
    if (shopOrder?.status === "pending" && data?.createdAt) {
      const updatePendingCountdown = async () => {
        const orderCreatedAt = new Date(data.createdAt);
        const now = new Date();
        const elapsedMs = now - orderCreatedAt;
        const totalMs = 5 * 60 * 1000; // 5 minutes in milliseconds
        const remainingMs = totalMs - elapsedMs;

        if (remainingMs > 0) {
          const minutes = Math.floor(remainingMs / 60000);
          const seconds = Math.floor((remainingMs % 60000) / 1000);
          setPendingCountdown(
            `${minutes}:${seconds.toString().padStart(2, "0")}`,
          );
        } else {
          setPendingCountdown("0:00");
          if (shopOrder?.status === "pending") {
            try {
              const shopId = shopOrder.shop?._id || shopOrder.shop;
              await axios.post(
                `${serverUrl}/api/order/cancel-order/${data._id}/${shopId}`,
                { reason: "Not accepted - Auto cancelled after 5 minutes" },
                { withCredentials: true },
              );
              dispatch(
                updateOrderStatus({
                  orderId: data._id,
                  shopId,
                  status: "cancelled",
                }),
              );
            } catch (error) {}
          }
        }
      };

      updatePendingCountdown();
      const interval = setInterval(updatePendingCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setPendingCountdown("");
    }
  }, [shopOrder?.status, data?.createdAt, data._id, shopOrder?.shop, dispatch]);

  // Countdown timer for preparing (10 mins)
  useEffect(() => {
    if (shopOrder?.status === "preparing") {
      const updateCountdown = () => {
        let startTime;
        if (shopOrder?.preparingStartedAt) {
          startTime = new Date(shopOrder.preparingStartedAt);
        } else if (data?.createdAt || shopOrder?.createdAt) {
          startTime = new Date(data?.createdAt || shopOrder?.createdAt);
        } else {
          setCountdown("");
          return;
        }

        const now = new Date();
        const elapsedMs = now - startTime;
        const totalMs = 10 * 60 * 1000;
        const remainingMs = totalMs - elapsedMs;

        if (remainingMs > 0) {
          const minutes = Math.floor(remainingMs / 60000);
          const seconds = Math.floor((remainingMs % 60000) / 1000);
          setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        } else {
          const extraMs = Math.abs(remainingMs);
          const minutes = Math.floor(extraMs / 60000);
          const seconds = Math.floor((extraMs % 60000) / 1000);
          setCountdown(`+${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown("");
    }
  }, [
    shopOrder?.status,
    shopOrder?.preparingStartedAt,
    data?.createdAt,
    shopOrder?.createdAt,
  ]);

  const getOrderTime = () => {
    if (shopOrder?.status === "preparing" && countdown) return countdown;
    return formatTime(data.createdAt || shopOrder?.createdAt);
  };

  const isReadyForDeliveryEnabled =
    shopOrder?.status === "preparing" && activeTab !== "new";
  const isReadyForDeliveryCompleted =
    shopOrder?.status === "out of delivery" ||
    shopOrder?.status === "delivered";
  const shopName = shopOrder?.shop?.name || "Shop";
  const locationText =
    shopName.length > 20 ? `${shopName.substring(0, 20)}...` : shopName;
  const orderIdDisplay =
    typeof data?.orderId === "string" && data.orderId.startsWith("LMF-")
      ? data?._id || "N/A"
      : data?.orderId || data?._id || "N/A";

  const statusLabel =
    shopOrder?.status === "pending"
      ? "New"
      : shopOrder?.status === "preparing"
        ? "Preparing"
        : shopOrder?.status === "out of delivery"
          ? "Delivery"
          : shopOrder?.status === "delivered"
            ? "Done"
            : shopOrder?.status === "cancelled"
              ? "Cancelled"
              : "Order";

  const statusTone =
    shopOrder?.status === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : shopOrder?.status === "preparing"
        ? "bg-orange-50 text-orange-700 border-orange-100"
        : shopOrder?.status === "out of delivery"
          ? "bg-purple-50 text-purple-700 border-purple-100"
          : shopOrder?.status === "delivered"
            ? "bg-green-50 text-green-700 border-green-100"
            : shopOrder?.status === "cancelled"
              ? "bg-red-50 text-red-700 border-red-100"
              : "bg-white text-gray-700 border-gray-100";

  useEffect(() => {
    if (data?._id) {
      const viewedOrders = JSON.parse(
        localStorage.getItem("viewedOrders") || "[]",
      );
      setIsViewed(viewedOrders.includes(data._id));
    }
  }, [data?._id]);

  const handleOrderClick = () => {
    if (data?._id) {
      const viewedOrders = JSON.parse(
        localStorage.getItem("viewedOrders") || "[]",
      );
      if (!viewedOrders.includes(data._id)) {
        viewedOrders.push(data._id);
        localStorage.setItem("viewedOrders", JSON.stringify(viewedOrders));
        setIsViewed(true);
      }
    }
    navigate(`/order-detail/${data._id}`);
  };

  return (
    <div
      className={`bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all group p-5 sm:p-6 ${
        !isViewed ? "ring-2 ring-primary-green shadow-primary-green/10" : ""
      }`}
      onClick={handleOrderClick}>
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Order ID & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
              !isViewed
                ? "bg-primary-green text-white shadow-lg shadow-primary-green/30"
                : "bg-gray-100 text-gray-700"
            }`}>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase opacity-90">
              Order
            </span>
            <span className="text-xl sm:text-2xl font-black">
              {typeof orderIdDisplay === "string"
                ? orderIdDisplay.slice(-4)
                : orderIdDisplay}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl">
              {data.user?.fullName || "Guest User"}
            </h3>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-extrabold ${statusTone}`}>
              {!isViewed && (
                <span
                  className="w-2 h-2 rounded-full bg-current opacity-80 animate-pulse"
                  title="New order"></span>
              )}
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className="text-right shrink-0">
          {activeTab === "preparing" && countdown ? (
            <div
              className={`text-2xl sm:text-3xl font-black font-mono ${
                countdown.startsWith("+") ? "text-red-600" : "text-gray-900"
              }`}>
              {countdown || "00:00"}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
              <MdAccessTime className="text-base" /> {getOrderTime()}
            </div>
          )}
          {activeTab === "new" && pendingCountdown && (
            <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 animate-pulse">
              <FaExclamationCircle /> {pendingCountdown} left
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="mb-5 space-y-2">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Items
        </div>
        <div className="space-y-2">
          {shopOrder.shopOrderItems?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 py-2 px-3 bg-white rounded-xl border border-gray-100">
              <div className="flex-1 min-w-0">
                <span className="block text-sm sm:text-base font-bold text-gray-900 truncate">
                  {item.name}
                </span>
                {formatItemOptions(item) && (
                  <div className="mt-1 text-xs text-gray-500 leading-snug">
                    {formatItemOptions(item)}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-sm sm:text-base font-extrabold text-primary-green bg-white px-3 py-1 rounded-lg border border-primary-green/20">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Price & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t-2 border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-lg sm:text-2xl font-black text-gray-900">
            Total:
          </span>
          <span className="text-xl sm:text-3xl font-black text-primary-green">
            ฿{shopOrder?.subtotal?.toFixed(2) || "0.00"}
          </span>
        </div>

        {/* Action Buttons - Full Width & Tall */}
        <div className="flex gap-3 w-full sm:w-auto">
          {activeTab === "new" && shopOrder?.status === "pending" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptOrder();
              }}
              className="flex-1 sm:flex-none sm:min-w-[160px] h-14 sm:h-16 bg-primary-green text-white rounded-2xl font-extrabold text-base sm:text-lg shadow-lg shadow-primary-green/30 hover:bg-primary-green/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <FaCheck className="text-xl" />
              Accept Order
            </button>
          ) : activeTab !== "new" && shopOrder?.status === "preparing" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReadyForDelivery();
              }}
              disabled={
                !isReadyForDeliveryEnabled || isReadyForDeliveryCompleted
              }
              className={`flex-1 sm:flex-none sm:min-w-[160px] h-14 sm:h-16 rounded-2xl font-extrabold text-base sm:text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                isReadyForDeliveryCompleted
                  ? "bg-gray-200 text-gray-500 cursor-default shadow-none"
                  : isReadyForDeliveryEnabled
                    ? "bg-primary-green text-white shadow-primary-green/30 hover:bg-primary-green/90"
                    : "bg-gray-200 text-gray-500 cursor-default shadow-none"
              }`}>
              {isReadyForDeliveryCompleted ? (
                <>
                  <FaCheck className="text-xl" />
                  Ready
                </>
              ) : (
                <>
                  <FaCheck className="text-xl" />
                  Mark Ready
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default OwnerOrderCard;
