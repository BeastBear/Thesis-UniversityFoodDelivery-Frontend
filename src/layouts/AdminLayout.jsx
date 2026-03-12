import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FaChartPie,
  FaStore,
  FaUsers,
  FaClipboardList,
  FaTicketAlt,
  FaUserShield,
  FaWallet,
  FaMapMarkedAlt,
  FaUtensils,
  FaCogs,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import useNotifications from "../hooks/useNotifications";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef(null);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleLogout = () => {
    dispatch(setUserData(null));
    navigate("/signin");
  };

  const navItems = [
    { label: "Overview", icon: <FaChartPie />, path: "/admin" },
    { label: "Shops", icon: <FaStore />, path: "/admin/shops" },
    { label: "Users", icon: <FaUsers />, path: "/admin/users" },
    { label: "Orders", icon: <FaClipboardList />, path: "/admin/orders" },
    { label: "Categories", icon: <FaUtensils />, path: "/admin/categories" },
    { label: "Tickets", icon: <FaTicketAlt />, path: "/admin/tickets" },
    {
      label: "Verifications",
      icon: <FaUserShield />,
      path: "/admin/verifications",
    },
    { label: "Finance", icon: <FaWallet />, path: "/admin/finance" },
    { label: "Zones", icon: <FaMapMarkedAlt />, path: "/admin/zones" },
    { label: "Cafeterias", icon: <FaUtensils />, path: "/admin/cafeterias" },
    { label: "Settings", icon: <FaCogs />, path: "/admin/settings" },
  ];

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isNotifOpen) {
      return;
    }

    const handleOutside = (e) => {
      if (!notifRef.current) {
        return;
      }
      if (!notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [isNotifOpen]);

  const activeNavItem =
    navItems.find(
      (i) =>
        i.path === location.pathname ||
        (i.path !== "/admin" && location.pathname.startsWith(i.path)),
    ) || navItems[0];

  return (
    <div className="min-h-screen bg-white/90">
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Sidebar Card */}
        <div className="w-80 shrink-0 p-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 h-full flex flex-col sticky top-6">
            {/* Brand Section */}
            <div className="mb-8 pb-6 border-b-2 border-gray-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  U
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900">UniEats</h1>
                  <div className="mt-1 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full inline-block">
                    ADMIN
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-3 overflow-y-auto">
              {navItems.map((item, index) => {
                const isActive =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 bg-red-50 text-red-600 hover:bg-red-100">
                <FaSignOutAlt className="text-xl" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header Card */}
          <div className="p-6 pb-0">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-gray-900">
                    {activeNavItem?.label || "Dashboard"}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isNotifOpen;
                        setIsNotifOpen(next);
                        if (next) {
                          fetchNotifications(1);
                        }
                      }}
                      className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-purple-600 hover:text-white transition-all relative">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Panel */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden z-50">
                        <div className="p-6 border-b-2 border-gray-100 flex items-center justify-between">
                          <h3 className="text-lg font-black text-gray-900">
                            Notifications
                          </h3>
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-sm font-bold text-purple-600 hover:text-purple-700">
                            Mark all read
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-gray-500 font-bold">
                                No notifications
                              </p>
                            </div>
                          ) : (
                            notifications.slice(0, 6).map((n) => (
                              <button
                                key={n._id}
                                type="button"
                                onClick={async () => {
                                  if (!n.isRead) {
                                    await markAsRead(n._id);
                                  }
                                  setIsNotifOpen(false);
                                  navigate("/admin/notifications");
                                }}
                                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-white transition-colors ${
                                  !n.isRead ? "bg-purple-50" : ""
                                }`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900">
                                      {n.title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {n.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  {!n.isRead && (
                                    <div className="w-3 h-3 bg-purple-600 rounded-full shrink-0 mt-1"></div>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="p-4 border-t-2 border-gray-100 flex items-center justify-between bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              navigate("/admin/notifications");
                            }}
                            className="text-sm font-bold text-purple-600 hover:text-purple-700">
                            View all
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsNotifOpen(false)}
                            className="text-sm font-bold text-gray-500 hover:text-gray-700">
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      <p className="font-bold text-gray-900">
                        {userData?.fullName || "Administrator"}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        System Admin
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600">
                      {userData?.profileImage ? (
                        <img
                          src={userData.profileImage}
                          alt="Admin"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold bg-purple-50">
                          A
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 px-6 pb-6">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 min-h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Card */}
        <div
          className={`fixed top-0 left-0 h-full w-80 bg-white rounded-r-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 z-50 transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <div className="h-full flex flex-col">
            {/* Brand */}
            <div className="mb-8 pb-6 border-b-2 border-gray-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  V
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900">UniEats</h1>
                  <div className="mt-1 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full inline-block">
                    ADMIN
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-3 overflow-y-auto">
              {navItems.map((item, index) => {
                const isActive =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 bg-red-50 text-red-600 hover:bg-red-100">
                <FaSignOutAlt className="text-xl" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header Card */}
        <div className="p-4 pb-0">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700">
                  <FaBars size={20} />
                </button>
                <h2 className="text-lg font-black text-gray-900">
                  {activeNavItem?.label || "Dashboard"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isNotifOpen;
                      setIsNotifOpen(next);
                      if (next) {
                        fetchNotifications(1);
                      }
                    }}
                    className="relative w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700">
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden z-50">
                      <div className="p-4 border-b-2 border-gray-100 flex items-center justify-between">
                        <h3 className="font-black text-gray-900">
                          Notifications
                        </h3>
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs font-bold text-purple-600">
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <p className="text-gray-500 text-sm font-bold">
                              No notifications
                            </p>
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <button
                              key={n._id}
                              type="button"
                              onClick={async () => {
                                if (!n.isRead) {
                                  await markAsRead(n._id);
                                }
                                setIsNotifOpen(false);
                                navigate("/admin/notifications");
                              }}
                              className={`w-full text-left p-4 border-b border-gray-100 ${
                                !n.isRead ? "bg-purple-50" : ""
                              }`}>
                              <p className="font-bold text-sm text-gray-900">
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                              {!n.isRead && (
                                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-600">
                  {userData?.profileImage ? (
                    <img
                      src={userData.profileImage}
                      alt="Admin"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold bg-purple-50">
                      A
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 px-4 pb-4">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 min-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
