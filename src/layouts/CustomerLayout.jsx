import React, { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { FaHome, FaReceipt, FaCog, FaShoppingCart } from "react-icons/fa";
import { useSelector } from "react-redux";
import CustomerHeader from "../components/CustomerHeader";
import CartDrawer from "../components/CartDrawer";

/**
 * CustomerLayout - Modern Responsive App Shell for Food Delivery Customer App
 *
 * Features:
 * - Mobile: Top bar (Logo + Cart) + Bottom Navigation (Glassmorphism)
 * - Desktop: Left Sidebar (Navigation) + Main Content (Flex 1)
 * - Cart: Slide-over Drawer
 */
const CustomerLayout = () => {
  const location = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems } = useSelector((state) => state.user);

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Determine which pages should have full-bleed content (no padding)
  const isFullBleedContent =
    location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/track-order") ||
    location.pathname.startsWith("/order-placed") ||
    location.pathname.startsWith("/restaurant");

  // Determine which pages should hide header
  const hideHeader =
    location.pathname.startsWith("/track-order") ||
    location.pathname.startsWith("/order-placed");

  const showHeader = !hideHeader;
  const hideBottomNavForItemDetail = location.pathname.startsWith("/item/");
  const showBottomNav = !isFullBleedContent && !hideBottomNavForItemDetail;

  // Navigation items for sidebar
  const navItems = [
    {
      label: "Home",
      icon: <FaHome />,
      path: "/",
      active: location.pathname === "/",
    },
    {
      label: "Orders",
      icon: <FaReceipt />,
      path: "/my-orders",
      active: location.pathname.startsWith("/my-orders"),
    },
    {
      label: "Cart",
      icon: <FaShoppingCart />,
      path: "/cart",
      active: location.pathname.startsWith("/cart"),
      badge:
        totalCartItems > 0
          ? totalCartItems > 99
            ? "99+"
            : totalCartItems
          : null,
    },
    {
      label: "Settings",
      icon: <FaCog />,
      path: "/setting",
      active: location.pathname.startsWith("/setting"),
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden flex flex-col">
      {/* Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Main Content Area - Full Width */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          {showHeader && (
            <div className="shrink-0">
              <CustomerHeader onCartClick={() => setIsCartOpen(true)} />
            </div>
          )}

          {/* Scrollable Page Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div
              className={`min-h-full ${
                isFullBleedContent ? "" : "p-4 lg:p-6"
              }`}>
              {isFullBleedContent ? (
                <Outlet />
              ) : (
                <div className="bg-white p-6 min-h-[calc(100vh-(--spacing(32)))]">
                  <Outlet />
                </div>
              )}
            </div>
            {/* Mobile Bottom Nav Spacer */}
            {showBottomNav && <div className="h-24 lg:hidden" />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Fixed) */}
      {showBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe z-50 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3 pointer-events-auto">
            <div className="flex justify-between items-center">
              {navItems.slice(0, 4).map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-all ${
                    item.active ? "text-white" : "text-gray-500"
                  }`}
                  style={
                    item.active
                      ? {
                          backgroundColor: "var(--color-primary)",
                          boxShadow:
                            "0 4px 12px var(--color-primary-shadow-light)",
                        }
                      : {}
                  }>
                  <div className="relative">
                    <span className="text-xl">{item.icon}</span>
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold flex items-center justify-center rounded-full bg-primary-orange shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold">
                    {item.label.split(" ")[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;
