import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaSearch,
  FaBell,
  FaShoppingCart,
  FaSignOutAlt,
  FaUser,
  FaCreditCard,
  FaHistory,
  FaCog,
  FaChevronDown,
  FaMapMarkerAlt,
  FaWallet,
} from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { useBackNavigation } from "../hooks/useBackNavigation";
import { useUI, DEFAULT_HEADER_TITLE } from "../context/UIContext.jsx";

/**
 * CustomerHeader - Responsive Header Component
 *
 * Mobile (< md):
 * - Logo (Left) + Cart Icon (Right)
 * - Location selector on home page
 *
 * Desktop (>= md):
 * - Logo + Search Bar (Center) + Navigation Links + User Dropdown + Cart
 * - User Dropdown includes: Profile, Addresses, Wallet, Settings, Logout
 */
const CustomerHeader = ({ onCartClick }) => {
  const { userData, cartItems } = useSelector((state) => state.user);
  const { address: mapAddress } = useSelector((state) => state.map);
  const { headerTitle, headerLoading } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { handleBack, getBreadcrumbPath } = useBackNavigation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const profileDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Avatar Logic
  const profileImage =
    userData?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userData?.fullName || "User",
    )}&background=FF6B00&color=fff&size=128`;

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  // Find default saved address or fallback to map/user address
  const defaultSavedAddress = userData?.savedAddresses?.find(
    (addr) => addr.isDefault,
  );
  const currentAddress =
    defaultSavedAddress?.address ||
    mapAddress ||
    userData?.address ||
    "Select Location";

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

  const handleSearch = (query) => {
    if (!query.trim()) return;
    navigate(`/?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm shadow-primary-orange/5 border-b border-gray-100/50">
      {/* Mobile View (< md) */}
      <div className="flex items-center justify-between w-full md:hidden">
        {/* Left: Logo or Location/Back */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {shouldShowAddressSelector ? (
            <>
              {/* UniEats Logo */}
              <Link to="/" className="flex items-center gap-1.5 shrink-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm bg-primary-orange shadow-lg shadow-primary-orange/30">
                  U
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-sm tracking-tight leading-none">
                    Uni
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary-orange">
                    Eats
                  </span>
                </div>
              </Link>

              {/* Location Selector */}
              <div
                className="flex items-center gap-2 cursor-pointer min-w-0"
                onClick={() => navigate("/saved-addresses")}>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">
                    DELIVER TO
                  </span>
                  <span className="text-sm font-bold text-gray-800 leading-tight truncate">
                    {currentAddress.split(",")[0] || "Select Location"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800 -ml-1">
                <IoIosArrowBack size={22} />
              </button>
              {pageTitle && (
                <h1 className="font-bold text-lg text-gray-900 leading-tight">
                  {pageTitle}
                </h1>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <button
          onClick={onCartClick || (() => navigate("/cart"))}
          className="relative hidden sm:flex w-10 h-10 items-center justify-center text-gray-700 hover:text-primary-orange transition-colors"
          aria-label={`Shopping cart with ${totalCartItems} items`}>
          <FaShoppingCart className="text-xl" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white bg-primary-orange shadow-sm">
              {totalCartItems > 99 ? "99+" : totalCartItems}
            </span>
          )}
        </button>

        {/* Right: Notifications (Mobile) */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 flex items-center justify-center text-gray-700 hover:text-primary-orange transition-colors"
          aria-label="Notifications">
          <FaBell className="text-xl" />
          {/* You might want to add a notification count badge here if available in userData or another slice */}
        </button>
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:flex items-center justify-between w-full gap-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl transform group-hover:rotate-3 transition-transform bg-primary-orange shadow-lg shadow-primary-orange/30">
            U
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-xl tracking-tight leading-none">
              Uni
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-orange">
              Eats
            </span>
          </div>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <FaSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search restaurants, dishes, or cuisines..."
              defaultValue={new URLSearchParams(location.search).get("q") || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.target.value);
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-white border border-gray-200 focus:bg-white focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium text-gray-800 placeholder-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Right: Navigation Links + Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/50 p-1.5 rounded-2xl border border-gray-100">
            <Link
              to="/"
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                location.pathname === "/"
                  ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/20"
                  : "text-gray-500 hover:text-primary-orange hover:bg-primary-orange/10"
              }`}>
              Home
            </Link>
            <Link
              to="/my-orders"
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                location.pathname.startsWith("/my-orders")
                  ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/20"
                  : "text-gray-500 hover:text-primary-orange hover:bg-primary-orange/10"
              }`}>
              Orders
            </Link>
          </nav>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary-orange hover:bg-primary-orange/10 rounded-full transition-colors"
            aria-label="Notifications">
            <FaBell size={18} />
          </button>

          {/* Cart */}
          <button
            onClick={onCartClick || (() => navigate("/cart"))}
            className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary-orange hover:bg-primary-orange/10 rounded-full transition-colors"
            aria-label={`Shopping cart with ${totalCartItems} items`}>
            <FaShoppingCart className="text-xl" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white bg-primary-orange shadow-sm">
                {totalCartItems > 99 ? "99+" : totalCartItems}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          {userData && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-white border border-transparent hover:border-gray-100 transition-all">
                <div className="text-right hidden xl:block">
                  <div className="text-sm font-bold text-gray-800 leading-tight">
                    {userData?.fullName?.split(" ")[0] || "Guest"}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    User
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
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100/50 rounded-3xl shadow-xl shadow-primary-orange/10 overflow-hidden z-50">
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

                    {/* My Addresses */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/saved-addresses");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaMapMarkerAlt className="text-gray-400" size={16} />
                      <span>Saved Addresses</span>
                    </button>

                    {/* Wallet/Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/payment-methods");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaWallet className="text-gray-400" size={16} />
                      <span>Wallet & Payment</span>
                    </button>

                    {/* Order History */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/my-orders");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors text-sm font-bold text-gray-700">
                      <FaHistory className="text-gray-400" size={16} />
                      <span>Order History</span>
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

export default CustomerHeader;
