import React from "react";
import {
  FaCheckDouble,
  FaBell,
  FaClipboardList,
  FaWallet,
  FaInfoCircle,
  FaStore,
  FaDollarSign,
  FaShoppingCart,
} from "react-icons/fa";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import PrimaryButton from "../ui/PrimaryButton";

const ShopNotificationsView = ({
  notifications,
  loading,
  hasMore,
  loadMore,
  markAsRead,
  markAllAsRead,
  navigate,
}) => {
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.relatedId) {
      if (
        notification.type === "order_update" ||
        notification.relatedModel === "Order"
      ) {
        navigate(`/order-detail/${notification.relatedId}`);
        return;
      }
      if (notification.type === "payout") {
        navigate("/sales-summary");
        return;
      }
    }
  };

  const getIcon = (type, title) => {
    // For shop role, show icons for orders and payouts
    const titleLower = (title || "").toLowerCase();
    
    if (titleLower.includes("payout") || titleLower.includes("payment") || titleLower.includes("revenue")) {
      return <FaDollarSign className="text-primary-green" />;
    }
    if (titleLower.includes("order") || titleLower.includes("new order")) {
      return <FaShoppingCart className="text-primary-blue" />;
    }
    
    switch (type) {
      case "order_update":
        return <FaClipboardList className="text-primary-blue" />;
      case "payout":
        return <FaWallet className="text-primary-green" />;
      case "system":
        return <FaInfoCircle className="text-amber-600" />;
      default:
        return <FaStore className="text-gray-500" />;
    }
  };

  // Filter notifications relevant to shops (incoming orders, payouts, system)
  const visibleNotifications = (notifications || []).filter((n) => {
    const type = String(n?.type || "");
    return ["order_update", "payout", "system"].includes(type);
  });

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
      {/* Header Section - Shop-focused design */}
      <div className="bg-gradient-to-br from-primary-green to-primary-green/80 rounded-3xl text-white shadow-lg border-none p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors flex items-center justify-center shrink-0"
              aria-label="Back">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-extrabold">Shop Notifications</h1>
              <p className="mt-2 text-xs sm:text-sm text-white/80">
                New orders, payout updates, and important business alerts
              </p>
            </div>
          </div>
          {visibleNotifications.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="min-h-[44px] px-4 rounded-2xl text-sm font-extrabold transition-colors border border-white/15 bg-white/10 text-white hover:bg-white/15 inline-flex items-center gap-2 shrink-0"
              aria-label="Mark all notifications as read"
              title="Mark all as read">
              <FaCheckDouble />
              <span className="hidden sm:inline">Mark all</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {visibleNotifications.length === 0 && !loading ? (
        <div className="bg-white rounded-3xl shadow-lg border-none py-16 px-6">
          <EmptyState
            icon={<FaStore className="text-4xl text-gray-300" />}
            title="No notifications yet"
            description="You'll be notified when you receive new orders or payout updates."
            className="pt-0"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => {
            const isOrderNotification = 
              notification.type === "order_update" || 
              notification.relatedModel === "Order";
            const isPayoutNotification = notification.type === "payout";
            
            return (
              <Card
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-all hover:shadow-xl rounded-3xl border-none ${
                  notification.isRead
                    ? "bg-white shadow-lg"
                    : isOrderNotification
                    ? "bg-primary-blue/10 shadow-lg"
                    : isPayoutNotification
                    ? "bg-primary-green/10 shadow-lg"
                    : "bg-amber-50 shadow-lg"
                }`}>
                <div className="flex gap-4">
                  <div className="mt-1 text-xl shrink-0">
                    {getIcon(notification.type, notification.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-extrabold text-base ${
                          notification.isRead ? "text-slate-700" : "text-slate-900"
                        }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          isOrderNotification ? "bg-primary-blue" : 
                          isPayoutNotification ? "bg-primary-green" : 
                          "bg-amber-500"
                        }`} />
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
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

export default ShopNotificationsView;

