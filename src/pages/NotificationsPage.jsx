import React from "react";
import useNotifications from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import UserNotificationsView from "../components/Notifications/UserNotificationsView";
import ShopNotificationsView from "../components/Notifications/ShopNotificationsView";
import DelivererNotificationsView from "../components/Notifications/DelivererNotificationsView";

const NotificationsPage = () => {
  const { userData } = useSelector((state) => state.user);
  const role = userData?.role || "user";

  const allowedTypes = React.useMemo(() => {
    if (role === "admin")
      return [
        "system",
        "order_update",
        "promo",
        "ticket",
        "verification",
        "payout",
      ];
    if (role === "deliveryBoy")
      return ["delivery_assignment", "order_update", "system"];
    if (role === "owner")
      return [
        "order_update",
        "system",
        "promo",
        "verification",
        "payout",
      ];
    // Standard user
    return ["order_update", "system", "promo"];
  }, [role]);

  const {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications(allowedTypes);

  const navigate = useNavigate();

  // Auto-mark all as read for deliverers when page loads
  React.useEffect(() => {
    if (role === "deliveryBoy") {
      const deliveryNotifications = (notifications || []).filter((n) => {
        const type = String(n?.type || "");
        return ["delivery_assignment", "order_update", "system"].includes(type);
      });
      if (deliveryNotifications.length > 0) {
        markAllAsRead();
      }
    }
    // run only when opening page / list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, notifications.length]);

  // Common props for all notification views
  const commonProps = {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    navigate,
  };

  if (role === "deliveryBoy") {
    return (
      <div className="w-full min-h-screen font-sans flex flex-col">
        <div className="flex-1 w-full pb-safe safe-area-bottom">
          <DelivererNotificationsView
            {...commonProps}
            userData={userData}
          />
        </div>
      </div>
    );
  }

  if (role === "owner") {
    return (
      <div className="w-full min-h-screen font-sans flex flex-col">
        <div className="flex-1 w-full pb-safe safe-area-bottom">
          <ShopNotificationsView {...commonProps} />
        </div>
      </div>
    );
  }

  // Default: User role
  return (
    <div className="w-full min-h-screen font-sans flex flex-col">
      <div className="flex-1 w-full pb-safe safe-area-bottom">
        <UserNotificationsView {...commonProps} />
      </div>
    </div>
  );
};

export default NotificationsPage;
