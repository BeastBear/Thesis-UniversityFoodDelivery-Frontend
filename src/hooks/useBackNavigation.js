import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Custom hook for implementing breadcrumb-style back navigation
 * Flow: Checkout → Back → Restaurant → Back → Home
 */
export const useBackNavigation = (isRetryPayment = false) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useSelector((state) => state.user);

  const getBackDestination = () => {
    const path = location.pathname;

    // Checkout/ Cart page -> go to restaurant (or history for retry payment)
    if (path.startsWith("/cart")) {
      if (isRetryPayment) {
        return "/history";
      }
      // Try to get restaurant ID from cart items
      if (cartItems && cartItems.length > 0 && cartItems[0].shop) {
        return `/restaurant/${cartItems[0].shop}`;
      }
      return "/";
    }

    // Restaurant page -> go to home
    if (path.startsWith("/restaurant/")) {
      return "/";
    }

    // Item detail page -> go to restaurant
    if (path.startsWith("/item/")) {
      // Extract restaurant ID from item data or navigate back
      return -1;
    }

    // Profile/Settings pages -> go to home
    if (
      path.startsWith("/profile") ||
      path.startsWith("/setting") ||
      path.startsWith("/saved-addresses") ||
      path.startsWith("/payment-methods")
    ) {
      return "/";
    }

    // Orders/History pages -> go to home
    if (
      path.startsWith("/my-orders") ||
      path.startsWith("/history") ||
      path.startsWith("/track-order")
    ) {
      return "/";
    }

    // Default: go back in history
    return -1;
  };

  const handleBack = () => {
    const destination = getBackDestination();

    if (destination === -1) {
      navigate(-1);
    } else {
      navigate(destination);
    }
  };

  const getBreadcrumbPath = () => {
    const path = location.pathname;
    const breadcrumbs = [];

    if (path.startsWith("/cart")) {
      breadcrumbs.push({ label: "Home", path: "/" });
      const restaurantPath = getBackDestination();
      if (restaurantPath !== "/") {
        breadcrumbs.push({ label: "Restaurant", path: restaurantPath });
      }
      breadcrumbs.push({ label: "Checkout", path: location.pathname });
    } else if (path.startsWith("/restaurant/")) {
      breadcrumbs.push({ label: "Home", path: "/" });
      breadcrumbs.push({ label: "Restaurant", path: location.pathname });
    } else if (path.startsWith("/item/")) {
      breadcrumbs.push({ label: "Home", path: "/" });
      const restaurantPath = getBackDestination();
      if (restaurantPath !== -1) {
        breadcrumbs.push({ label: "Restaurant", path: restaurantPath });
      }
      breadcrumbs.push({ label: "Item", path: location.pathname });
    }

    return breadcrumbs;
  };

  return {
    handleBack,
    getBackDestination,
    getBreadcrumbPath,
  };
};
