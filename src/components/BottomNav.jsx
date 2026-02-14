import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaReceipt,
  FaUser,
  FaCog,
  FaShoppingCart,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const { cartItems } = useSelector((state) => state.user);

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const navItems = [
    {
      label: "Home",
      icon: <FaHome size={24} />,
      path: "/",
      active: path === "/",
    },
    {
      label: "Cart",
      icon: <FaShoppingCart size={24} />,
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
      icon: <FaReceipt size={24} />,
      path: "/my-orders",
      active: path === "/my-orders" || path.includes("/track-order"),
    },
    {
      label: "Profile",
      icon: <FaUser size={22} />,
      path: "/profile",
      active: path === "/profile",
    },
    {
      label: "Setting",
      icon: <FaCog size={22} />,
      path: "/setting",
      active: path === "/setting" || path.startsWith("/setting"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 lg:hidden flex justify-between items-center pb-safe safe-area-bottom pb-4">
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ${
            item.active
              ? "text-primary-orange"
              : "text-gray-400 hover:text-gray-600"
          }`}>
          {item.active && (
            <div className="absolute inset-0 rounded-2xl bg-primary-orange/10 border border-primary-orange/20" />
          )}

          <div className="relative flex flex-col items-center gap-1">
            <div
              className={`${
                item.active ? "transform -translate-y-0.5" : ""
              } transition-transform duration-200 mt-0.5`}>
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white bg-primary-orange shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-bold tracking-wide ${
                item.active ? "opacity-100" : "opacity-70"
              } transition-all duration-200`}>
              {item.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;
