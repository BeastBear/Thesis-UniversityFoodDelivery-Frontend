import React from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import {
  FaBell,
  FaCheckDouble,
  FaClipboardList,
  FaBullhorn,
  FaInfoCircle,
  FaTicketAlt,
  FaUserShield,
  FaWallet,
} from "react-icons/fa";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const visibleNotifications = (notifications || []).filter((n) => {
    const type = String(n?.type || "");
    if (!type) return true;
    return new Set([
      "system",
      "order_update",
      "promo",
      "ticket",
      "verification",
      "payout",
    ]).has(type);
  });

  const handleNotificationClick = async (notification) => {
    if (!notification?.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.type === "ticket") {
      navigate("/admin/tickets");
      return;
    }

    if (notification.type === "verification") {
      navigate("/admin/verifications");
      return;
    }

    if (notification.type === "payout") {
      navigate("/admin/finance");
      return;
    }

    if (notification.relatedId) {
      if (
        notification.type === "order_update" ||
        notification.relatedModel === "Order"
      ) {
        navigate("/admin/orders");
        return;
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order_update":
        return <FaClipboardList className="text-blue-600" />;
      case "promo":
        return <FaBullhorn className="text-purple-600" />;
      case "ticket":
        return <FaTicketAlt className="text-indigo-600" />;
      case "verification":
        return <FaUserShield className="text-purple-700" />;
      case "payout":
        return <FaWallet className="text-rose-600" />;
      case "system":
      default:
        return <FaInfoCircle className="text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <FaBell />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              Notifications
            </div>
            <div className="text-sm text-gray-500 font-semibold">
              System updates and admin activity
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="min-h-[44px] px-5 rounded-2xl text-sm font-extrabold transition-all shadow-sm bg-purple-600 text-white hover:bg-purple-700 active:scale-95 inline-flex items-center gap-2">
          <FaCheckDouble />
          Mark all read
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {visibleNotifications.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FaBell size={22} />
              </div>
              <div className="font-medium">No notifications yet.</div>
              <div className="text-sm">
                We’ll notify you when something important happens.
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleNotifications.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-5 hover:bg-white transition-colors ${
                  n.isRead ? "bg-white" : "bg-purple-50/30"
                }`}>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-lg">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900 truncate">
                          {n.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {n.message}
                        </div>
                      </div>
                      {!n.isRead ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                      ) : null}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-500 font-semibold">
          Loading...
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="min-h-[44px] px-6 rounded-2xl text-sm font-extrabold transition-all shadow-sm bg-white border border-gray-200 text-gray-700 hover:bg-white active:scale-95">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
