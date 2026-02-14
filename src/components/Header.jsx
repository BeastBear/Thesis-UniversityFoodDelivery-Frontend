import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaSearch,
  FaBell,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaSignOutAlt,
  FaUser,
  FaCreditCard,
  FaHistory,
  FaCog,
  FaChevronDown,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { useUI, DEFAULT_HEADER_TITLE } from "../context/UIContext.jsx";

const HeaderLayout = () => {
  const { userData, cartItems, address } = useSelector((state) => state.user);
  const { address: mapAddress } = useSelector((state) => state.map);
  const { headerTitle, headerLoading } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Avatar Logic
  const profileImage =
    userData?.profileImage ||
    "https://ui-avatars.com/api/?name=" +
      (userData?.fullName || "User") +
      "&background=random";

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  // Find default saved address or fallback to map/user address
  const defaultSavedAddress = userData?.savedAddresses?.find(
    (addr) => addr.isDefault,
  );
  const currentAddress =
    defaultSavedAddress?.address || mapAddress || address || "Select Location";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Orders", path: "/my-orders" },
  ];

  if (userData?.role === "owner" || userData?.role === "deliveryBoy") {
    navLinks.push({ name: "History", path: "/history" });
  }

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
    } catch (error) {
      // ignore
    } finally {
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    }
  };

  // Determine if we should show address selector (only on home page)
  const isHomePage = location.pathname === "/";
  const shouldShowAddressSelector = isHomePage;

  const pageTitle =
    headerTitle?.trim() || (headerLoading ? "" : DEFAULT_HEADER_TITLE);

  return (
    <header className="h-[72px] lg:h-[84px] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      {/* Left: Logo (Desktop) or Location/Page Title (Mobile) */}
      <div className="flex items-center gap-2 lg:gap-8">
        {/* Desktop Logo */}
        <Link to="/" className="hidden lg:flex items-center gap-2 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl transform group-hover:rotate-3 transition-transform"
            style={{
              background: `linear-gradient(to bottom right, var(--color-primary), var(--color-primary-light))`,
              boxShadow: `0 10px 25px -5px var(--color-primary-shadow)`,
            }}>
            U
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-xl tracking-tight leading-none">
              UniEats
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--color-primary)" }}>
              Eats
            </span>
          </div>
        </Link>

        {/* Mobile: Location (Home) or Page Title (Other Pages) */}
        {shouldShowAddressSelector ? (
          <div
            className="lg:hidden flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate("/saved-addresses")}>
            <div
              className="rounded-lg px-2.5 py-1.5 flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "var(--color-primary-bg-light)",
                color: "var(--color-primary)",
              }}>
              <FaMapMarkerAlt size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">
                DELIVER TO
              </span>
              <span className="text-sm font-bold text-gray-800 leading-tight">
                {currentAddress.split(",")[0] || "Select Location"}
              </span>
            </div>
          </div>
        ) : (
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800 -ml-2">
              <IoIosArrowBack size={24} />
            </button>
            {pageTitle && (
              <h1 className="font-bold text-lg text-gray-900 leading-tight">
                {pageTitle}
              </h1>
            )}
          </div>
        )}

        {/* Desktop: Page Title for non-home pages */}
        {!shouldShowAddressSelector && pageTitle && (
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-600">
              <IoIosArrowBack size={20} />
            </button>
            <h1 className="font-bold text-lg text-gray-900 leading-tight">
              {pageTitle}
            </h1>
          </div>
        )}
      </div>

      {/* Center: Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/50 p-1.5 rounded-full border border-gray-100/50">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
              isActive(link.path)
                ? "bg-white shadow-sm ring-1 ring-gray-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
            }`}
            style={
              isActive(link.path) ? { color: "var(--color-primary)" } : {}
            }>
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 lg:gap-6">
        {/* Mobile: Icon Buttons - Updated Design */}
        <div className="lg:hidden flex items-center gap-2.5">
          {/* Search */}
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Search">
            <FaSearch size={18} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Notifications">
            <FaBell size={18} />
          </button>
        </div>

        {/* Desktop: Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 flex items-center justify-center text-gray-600 bg-white rounded-full theme-hover"
            aria-label="Notifications">
            <FaBell size={18} />
          </button>

          {/* Cart */}
          <button
            onClick={() => navigate("/cart")}
            className="relative w-10 h-10 flex items-center justify-center text-gray-600 bg-white rounded-full theme-hover">
            <FaShoppingCart className="text-xl" />
            {totalCartItems > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Logout */}
          {userData && (
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-600 hover:text-red-600 transition-colors bg-white hover:bg-red-50 rounded-full"
              aria-label="Logout">
              <FaSignOutAlt className="text-lg" />
            </button>
          )}

          {/* Desktop User Profile Dropdown */}
          {userData && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white border border-transparent hover:border-gray-100 transition-all">
                <div className="text-right hidden xl:block">
                  <div className="text-sm font-bold text-gray-800 leading-tight">
                    {userData?.fullName?.split(" ")[0] || "Guest"}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {userData?.role === "owner" ? "Owner" : "User"}
                  </div>
                </div>
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                />
                <FaChevronDown
                  className={`text-xs text-gray-400 transition-transform ${
                    isProfileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-3xl shadow-lg border-none overflow-hidden z-50">
                  <div className="py-2">
                    {/* My Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/profile");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaUser className="text-gray-400" size={16} />
                      <span>My Profile</span>
                    </button>

                    {/* My Addresses / Locations */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/saved-addresses");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaMapMarkerAlt className="text-gray-400" size={16} />
                      <span>My Addresses</span>
                    </button>

                    {/* My Payment Methods */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/payment-methods");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaCreditCard className="text-gray-400" size={16} />
                      <span>Payment Methods</span>
                    </button>

                    {/* Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/setting");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaCog className="text-gray-400" size={16} />
                      <span>Settings</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-bold text-red-600">
                      <FaSignOutAlt className="text-red-500" size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderLayout;
