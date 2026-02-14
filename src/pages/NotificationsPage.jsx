import React from "react";
import useNotifications from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DeliveryLayout from "../layouts/DeliveryLayout";
import UserNotificationsView from "../components/Notifications/UserNotificationsView";
import ShopNotificationsView from "../components/Notifications/ShopNotificationsView";
import DelivererNotificationsView from "../components/Notifications/DelivererNotificationsView";

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const role = userData?.role || "user";

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

  // Render role-specific notification views
  if (role === "deliveryBoy") {
    return (
      <DeliveryLayout>
        <DelivererNotificationsView
          {...commonProps}
          userData={userData}
        />
      </DeliveryLayout>
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
