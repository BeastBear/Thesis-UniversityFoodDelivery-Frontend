import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckDouble,
  FaBell,
  FaClipboardList,
  FaInfoCircle,
} from "react-icons/fa";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import PrimaryButton from "../ui/PrimaryButton";
import DeliveryPageHero from "../Delivery/DeliveryPageHero";
import axios from "axios";
import { serverUrl } from "../../App";

const DelivererNotificationsView = ({
  notifications,
  loading,
  hasMore,
  loadMore,
  markAsRead,
  markAllAsRead,
  navigate,
  userData,
}) => {
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on type and relatedId
    if (notification.relatedId) {
      // For orders, usually go to track order
      if (
        notification.type === "order_update" ||
        notification.relatedModel === "Order"
      ) {
        try {
          const res = await axios.get(
            `${serverUrl}/api/order/get-order-by-id/${notification.relatedId}`,
            { withCredentials: true },
          );
          const order = res?.data;
          const myId = userData?._id ? String(userData._id) : "";
          const shopOrders = Array.isArray(order?.shopOrders)
            ? order.shopOrders
            : [];
          const myShopOrder = shopOrders.find((so) => {
            const assigned = so?.assignedDeliveryBoy;
            const assignedId =
              typeof assigned === "object"
                ? assigned?._id?.toString()
                : assigned?.toString();
            return assignedId && myId && assignedId === myId;
          });

          const isDelivered =
            String(myShopOrder?.status || "").toLowerCase() === "delivered";
          if (!isDelivered) {
            navigate("/");
            return;
          }
          navigate(`/delivery-order-detail/${notification.relatedId}`);
        } catch (e) {
          navigate("/");
        }
        return;
      }

      if (notification.type === "delivery_assignment") {
        navigate("/");
        return;
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order_update":
        return <FaClipboardList className="text-primary-blue" />;
      case "delivery_assignment":
        return <FaClipboardList className="text-primary-blue" />;
      case "system":
        return <FaInfoCircle className="text-amber-600" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  // Filter notifications relevant to deliverers
  const visibleNotifications = (notifications || []).filter((n) => {
    const type = String(n?.type || "");
    return ["delivery_assignment", "order_update", "system"].includes(type);
  });

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
      <DeliveryPageHero
        title="Notifications"
        description="Delivery updates, new jobs, and important activity."
        onBack={() => navigate(-1)}
        icon={<FaBell size={22} />}
        right={
          visibleNotifications.length > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="min-h-[44px] px-4 rounded-2xl text-sm font-extrabold transition-colors border border-white/15 bg-white/10 text-white hover:bg-white/15 inline-flex items-center gap-2"
              aria-label="Mark all notifications as read"
              title="Mark all as read">
              <FaCheckDouble />
              <span className="hidden sm:inline">Mark all</span>
            </button>
          ) : null
        }
      />

      {visibleNotifications.length === 0 && !loading ? (
        <div className="bg-white rounded-3xl shadow-lg border-none py-16 px-6">
          <EmptyState
            icon={<FaBell className="text-4xl text-gray-300" />}
            title="No notifications yet"
            description="We'll notify you when something important happens."
            className="pt-0"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => (
            <Card
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 cursor-pointer transition-all hover:shadow-xl rounded-3xl border-none ${
                notification.isRead
                  ? "bg-white shadow-lg"
                  : "bg-primary-blue/10 shadow-lg"
              }`}>
              <div className="flex gap-4">
                <div className="mt-1 text-xl">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <h3
                    className={`font-extrabold ${
                      notification.isRead ? "text-slate-900" : "text-slate-950"
                    }`}>
                    {notification.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-slate-500 font-semibold">
          Loading...
        </div>
      )}

      {!loading && hasMore && (
        <div className="text-center py-2">
          <PrimaryButton type="button" onClick={loadMore} className="py-3 px-8">
            Load More
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

export default DelivererNotificationsView;

