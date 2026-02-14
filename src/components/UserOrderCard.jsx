import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdPending,
  MdRefresh,
  MdRestaurant,
  MdClose,
} from "react-icons/md";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";

function UserOrderCard({ data }) {
  const navigate = useNavigate();
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);

  // Safety check to prevent errors if data is undefined
  if (!data || !data._id) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded mb-4"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderStatusBadge = () => {
    const statuses = (data.shopOrders || [])
      .map((so) => (so?.status || "").toLowerCase())
      .filter(Boolean);

    const isCancelled = statuses.some((s) =>
      ["cancelled", "canceled", "rejected", "cancel"].includes(s),
    );
    const isCompleted = statuses.every((s) => s === "delivered");

    if (isCancelled) {
      return {
        label: "Cancelled",
        color: "text-red-600",
        bg: "bg-red-50",
        icon: <MdClose />,
      };
    }

    if (isCompleted) {
      return {
        label: "Completed",
        color: "text-green-600",
        bg: "bg-green-50",
        icon: <MdCheckCircle />,
      };
    }

    return {
      label: "Ongoing",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <MdPending />,
    };
  };

  const getPaymentDisplay = () => {
    if (data.paymentMethod === "cod") return "Cash on Delivery";
    if (data.paymentMethod === "promptpay") return "PromptPay";
    if (data.paymentMethod === "card") return "Card";
    if (data.paymentMethod === "online")
      return data.payment ? "Paid" : "Online";
    return "Payment";
  };

  const statusBadge = getOrderStatusBadge();
  const paymentDisplay = getPaymentDisplay();

  const handleRetryPayment = async () => {
    if (
      (data.paymentMethod !== "online" &&
        data.paymentMethod !== "card" &&
        data.paymentMethod !== "promptpay") ||
      data.payment
    ) {
      return;
    }

    setIsRetryingPayment(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/order/create-payment-intent`,
        {
          orderId: data._id,
        },
        { withCredentials: true },
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      toast.error("Failed to initialize payment retry. Please try again.");
    } catch (error) {
      toast.error("Failed to initialize payment retry. Please try again.");
    } finally {
      setIsRetryingPayment(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all group p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange">
            <MdRestaurant size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base line-clamp-1">
              {data.shopOrders?.[0]?.shop?.name || "Restaurant"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${statusBadge.bg} ${statusBadge.color}`}>
          {statusBadge.icon}
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="space-y-3 mb-4">
        {data.shopOrders.map((shopOrder, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {shopOrder.shopOrderItems?.map((item, itemIdx) => (
                <div key={itemIdx} className="shrink-0 w-[80px]">
                  <div className="w-[80px] h-[80px] rounded-2xl overflow-hidden mb-1">
                    <img
                      src={item.item?.image}
                      className="w-full h-full object-cover"
                      alt={item.name}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 line-clamp-1 truncate font-medium">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Actions */}
      <div className="pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Total Amount</p>
          <p className="text-lg font-extrabold text-primary-orange">
            ฿{data.totalAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-gray-500 font-semibold">
            {paymentDisplay}
          </p>
        </div>

        {/* Action Button */}
        {!data.payment &&
        (data.paymentMethod === "online" ||
          data.paymentMethod === "card" ||
          data.paymentMethod === "promptpay") ? (
          <button
            onClick={handleRetryPayment}
            disabled={isRetryingPayment}
            className="bg-primary-orange hover:bg-primary-orange/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-orange/20 disabled:opacity-70 flex items-center gap-2 transition-all">
            {isRetryingPayment ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <MdRefresh /> Retry Payment
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate(`/track-order/${data._id}`)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors mt-1">
            Order Details
          </button>
        )}
      </div>
    </div>
  );
}

export default UserOrderCard;
