import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaReceipt,
  FaUser,
  FaShoppingCart,
} from "react-icons/fa";
import { useSelector } from "react-redux";

/**
 * CustomerBottomNav - Mobile Bottom Navigation Bar
 *
 * Fixed at bottom on mobile devices (< md breakpoint)
 * Contains: Home, Search, Orders, Profile
 */
const CustomerBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const { cartItems } = useSelector((state) => state.user);

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const navItems = [
    {
      label: "Home",
      icon: <FaHome size={22} />,
      path: "/",
      active: path === "/",
    },
    {
      label: "Search",
      icon: <FaSearch size={20} />,
      path: "/?search=true",
      active:
        path === "/" &&
        new URLSearchParams(location.search).get("search") === "true",
    },
    {
      label: "Cart",
      icon: <FaShoppingCart size={22} />,
      path: "/cart",
      active: path === "/cart",
      badge:
        totalCartItems > 0
          ? totalCartItems > 99
            ? "99+"
            : totalCartItems
          : null,
    },
    {
      label: "Orders",
      icon: <FaReceipt size={22} />,
      path: "/my-orders",
      active: path.startsWith("/my-orders") || path.includes("/track-order"),
    },
    {
      label: "Profile",
      icon: <FaUser size={20} />,
      path: "/profile",
      active:
        path.startsWith("/profile") ||
        path.startsWith("/setting") ||
        path.startsWith("/saved-addresses") ||
        path.startsWith("/payment-methods"),
    },
  ];

  const handleSearchClick = (e) => {
    if (path === "/") {
      e.preventDefault();
      // Focus search input or scroll to search section
      const searchInput = document.querySelector(
        'input[type="text"][placeholder*="Search"]',
      );
      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100/50 px-4 py-2.5 shadow-xl shadow-primary-orange/10 z-50 md:hidden flex justify-between items-center pb-safe safe-area-bottom">
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          onClick={item.label === "Search" ? handleSearchClick : undefined}
          className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-[60px] ${
            item.active
              ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/30"
              : "text-gray-500 hover:text-primary-orange"
          }`}>
          <div
            className={`relative z-10 transition-transform ${
              item.active ? "scale-110" : ""
            }`}>
            {item.icon}
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold flex items-center justify-center rounded-full bg-primary-orange shadow-sm">
                {item.badge}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-bold tracking-wide relative z-10 ${
              item.active ? "opacity-100" : "opacity-70"
            }`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default CustomerBottomNav;
