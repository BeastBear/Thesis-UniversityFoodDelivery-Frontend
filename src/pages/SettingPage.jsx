import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import { usePushNotification } from "../hooks/usePushNotification";
import {
  FaUser,
  FaBell,
  FaLock,
  FaGlobe,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaCreditCard,
  FaFileContract,
  FaEye,
  FaEnvelope,
  FaPen,
  FaChartBar,
  FaMoneyBill,
  FaFileAlt,
  FaCog,
  FaBook,
  FaHeadset,
  FaShieldAlt,
  FaSignOutAlt,
  FaStar,
  FaChevronRight,
  FaAngleRight,
} from "react-icons/fa";

function SettingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const isOwner = userData?.role === "owner";
  const isDeliverer = userData?.role === "deliveryBoy";
  const {
    subscribeToPush,
    sendTestNotification,
    loading: pushLoading,
    isSubscribed,
  } = usePushNotification();

  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [showSalesOnHome, setShowSalesOnHome] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [delivererReviews, setDelivererReviews] = useState([]);
  const [delivererReviewsLoading, setDelivererReviewsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("autoAcceptOrders");
    if (saved === null) {
      localStorage.setItem("autoAcceptOrders", "true");
      setAutoAcceptOrders(true);
      return;
    }
    setAutoAcceptOrders(saved === "true");
  }, []);

  useEffect(() => {
    const savedSetting = localStorage.getItem("showSalesOnHome");
    if (savedSetting !== null) {
      setShowSalesOnHome(savedSetting === "true");
    } else {
      setShowSalesOnHome(true);
      localStorage.setItem("showSalesOnHome", "true");
    }
  }, []);

  useEffect(() => {
    const checkExistingSubscription = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setPushEnabled(false);
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) {
        setPushEnabled(false);
      }
    };

    checkExistingSubscription();
  }, []);

  useEffect(() => {
    const fetchDeliveryReviews = async () => {
      if (!isDeliverer) return;
      if (!userData?._id) return;
      setDelivererReviewsLoading(true);
      try {
        const res = await axios.get(
          `${serverUrl}/api/review/rider/my-reviews`,
          {
            withCredentials: true,
          },
        );
        const reviews = res?.data?.reviews || res?.data || [];
        setDelivererReviews(Array.isArray(reviews) ? reviews : []);
      } catch (e) {
        setDelivererReviews([]);
      } finally {
        setDelivererReviewsLoading(false);
      }
    };

    fetchDeliveryReviews();
  }, [isDeliverer, userData?._id]);

  const handleToggleAutoAcceptOrders = (value) => {
    setAutoAcceptOrders(value);
    localStorage.setItem("autoAcceptOrders", value ? "true" : "false");
  };

  const handleToggleShowSalesOnHome = (value) => {
    setShowSalesOnHome(value);
    localStorage.setItem("showSalesOnHome", value ? "true" : "false");
  };

  const handleTogglePushNotifications = async (value) => {
    if (pushLoading) return;

    if (value) {
      await subscribeToPush();
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) {
        setPushEnabled(isSubscribed);
      }
      return;
    }

    // Attempt to unsubscribe locally (backend cleanup endpoint is not implemented here)
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushEnabled(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        toast.success("Push notifications disabled");
      }
      setPushEnabled(false);
    } catch (e) {
      toast.error("Unable to disable push notifications on this device");
      setPushEnabled(true);
    }
  };

  const handleLogOut = async () => {
    // Check if deliverer has an active job
    if (userData?.role === "deliveryBoy") {
      try {
        const activeOrderRes = await axios.get(
          `${serverUrl}/api/order/get-current-order`,
          { withCredentials: true },
        );
        if (activeOrderRes.data) {
          toast.error(
            "You have an active job. Please complete it before logging out.",
          );
          return;
        }
      } catch (error) {}
    }

    try {
      const result = await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      // Navigate directly to signin instead of "/" to avoid race condition
      navigate("/signin", { replace: true });
    } catch (error) {
      // Even if logout fails, clear user data and redirect to signin
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    }
  };

  // Default user settings
  const userSettings = [
    {
      title: "Account",
      items: [
        { icon: <FaUser />, label: "Profile Information", path: "/profile" },
        {
          icon: <FaMapMarkerAlt />,
          label: "My Locations",
          path: "/saved-addresses",
        },
        {
          icon: <FaCreditCard />,
          label: "My Payment Methods",
          path: "/payment-methods",
        },

        { icon: <FaSignOutAlt />, label: "Logout", action: handleLogOut },
      ],
    },

    {
      title: "Support",
      items: [
        { icon: <FaQuestionCircle />, label: "Help Center", path: "/help" },
      ],
    },
  ];

  // Owner specific settings (matching the screenshot)
  const ownerSettings = [
    {
      title: "Restaurant",
      items: [
        {
          icon: <FaPen />,
          label: "Edit Restaurant Info",
          path: "/create-edit-shop",
        },
        {
          icon: <FaFileContract />,
          label: "Contract Documents",
          path: "/contracts",
        }, // Placeholder
      ],
    },
    {
      title: "Account",
      items: [
        { icon: <FaUser />, label: "My Account", path: "/profile" }, // Assuming profile page exists or re-use edit shop? Usually personal profile.
        { icon: <FaSignOutAlt />, label: "Logout", action: handleLogOut },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: <FaQuestionCircle />, label: "Help Center", path: "/help" },
      ],
    },
  ];

  // Deliverer specific settings
  const delivererSettings = [
    {
      items: [
        {
          icon: <FaUser />,
          label: "Profile",
          path: "/profile",
        },
        {
          icon: <FaFileContract />,
          label: "Contract",
          path: "/delivery-contract",
        },
        {
          icon: <FaQuestionCircle />,
          label: "Help Center",
          path: "/help",
        },
        { icon: <FaSignOutAlt />, label: "Logout", action: handleLogOut },
      ],
    },
  ];

  // Choose which settings to display
  let settingsOptions = userSettings;
  if (isOwner) {
    settingsOptions = ownerSettings;
  } else if (isDeliverer) {
    settingsOptions = delivererSettings;
  }

  // Render separate UI for Deliverer to match specific design
  if (isDeliverer) {
    const ratings = Array.isArray(delivererReviews) ? delivererReviews : [];
    const ratingCounts = [0, 0, 0, 0, 0, 0];
    let ratingSum = 0;
    ratings.forEach((r) => {
      const raw = Number(r?.rating);
      const v = Number.isFinite(raw) ? Math.round(raw) : 0;
      if (v >= 1 && v <= 5) {
        ratingCounts[v] += 1;
        ratingSum += v;
      }
    });
    const totalRatings =
      ratingCounts[1] +
      ratingCounts[2] +
      ratingCounts[3] +
      ratingCounts[4] +
      ratingCounts[5];
    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-[0_14px_34px_var(--color-primary-shadow)] border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-4">
                <div className="w-14 h-14 rounded-3xl bg-white/10 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                  {userData?.profileImage || userData?.image ? (
                    <img
                      src={userData?.profileImage || userData?.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-sm font-extrabold text-white">
                      {(userData?.fullName || "Deliverer")
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black tracking-[0.14em] text-white/80">
                    SETTINGS
                  </div>
                  <div className="mt-1 text-xl font-extrabold truncate">
                    {userData?.fullName || "Deliverer"}
                  </div>
                  <div className="mt-1 text-xs text-white/70 font-mono">
                    {userData?._id?.toUpperCase().slice(0, 8) || ""}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogOut}
                className="min-h-[44px] px-4 py-2.5 rounded-2xl font-extrabold bg-red-500/90 text-white border border-red-300/40 hover:bg-red-500">
                Logout
              </button>
            </div>
          </div>

          <div className="mt-5 w-full rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white border border-white/10 shadow-[0_14px_34px_var(--color-primary-shadow)] p-5 text-left">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-black tracking-[0.14em] text-white/80">
                  REVIEWS
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold">
                    {delivererReviewsLoading
                      ? "—"
                      : totalRatings > 0
                        ? averageRating.toFixed(1)
                        : "0.0"}
                  </div>
                  <div className="text-sm font-extrabold text-white/80">
                    / 5.0
                  </div>
                  <div className="ml-2 text-xs font-extrabold text-white/70">
                    {delivererReviewsLoading ? "" : `(${totalRatings})`}
                  </div>
                </div>
              </div>
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <FaStar />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star];
                const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="w-10 text-[11px] font-extrabold text-white/85 flex items-center gap-1">
                      {star}
                      <FaStar className="text-white/70" />
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full bg-white/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-[11px] font-extrabold text-white/85">
                      {delivererReviewsLoading ? "" : count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="w-full flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border-none shadow-sm flex items-center justify-center text-slate-700 text-lg">
                  <FaBell />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Notifications
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Enable delivery updates
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushEnabled || isSubscribed}
                  onChange={(e) =>
                    handleTogglePushNotifications(e.target.checked)
                  }
                  disabled={pushLoading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
              </label>
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              onClick={() => navigate("/profile")}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border-none shadow-sm flex items-center justify-center text-slate-700 text-lg">
                  <FaUser />
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Profile
                </div>
              </div>
              <FaAngleRight className="text-slate-300" />
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
              onClick={() => navigate("/delivery-contract")}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border-none shadow-sm flex items-center justify-center text-slate-700 text-lg">
                  <FaFileContract />
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Contract
                </div>
              </div>
              <FaAngleRight className="text-slate-300" />
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
              onClick={() => navigate("/help")}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border-none shadow-sm flex items-center justify-center text-slate-700 text-lg">
                  <FaQuestionCircle />
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Help Center
                </div>
              </div>
              <FaAngleRight className="text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  // For regular users (not owner/deliverer), return content without wrapper
  // ProfileLayout will handle the sidebar
  if (!isOwner && !isDeliverer) {
    return (
      <div className="w-full">
        {/* Notification Settings Card */}
        <div className="bg-white rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-gray-900">
                Notification Settings
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Push notifications for updates and promotions
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled || isSubscribed}
                onChange={(e) =>
                  handleTogglePushNotifications(e.target.checked)
                }
                disabled={pushLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/20"></div>
            </label>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsOptions.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="bg-white rounded-3xl overflow-hidden">
              {group.title && (
                <h2 className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-white/50">
                  {group.title}
                </h2>
              )}
              <div className="divide-y divide-gray-100">
                {group.items.map((item, itemIndex) => (
                  <button
                    type="button"
                    key={itemIndex}
                    className="w-full flex items-center justify-between p-5 hover:bg-white transition-colors group cursor-pointer text-left"
                    onClick={() =>
                      item.action
                        ? item.action()
                        : item.path
                          ? navigate(item.path)
                          : null
                    }>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 text-lg transition-all border-none shadow-sm group-hover:bg-[var(--color-primary-bg)] group-hover:text-[var(--color-primary)]">
                        {item.icon}
                      </div>
                      <span className="text-gray-900 font-bold text-base">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-gray-300 transition-colors group-hover:text-[var(--color-primary)]">
                      <FaAngleRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For owners and deliverers, use the original layout
  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Mobile Header */}
      <div className="max-w-6xl mx-auto px-2 lg:px-4">
        {isOwner && (
          <div className="space-y-4 mb-6 pt-4">
            <Card className="p-5 flex items-center gap-10">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-gray-900">
                  Auto Accept Orders
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Automatically accept incoming orders
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAcceptOrders}
                  onChange={(e) =>
                    handleToggleAutoAcceptOrders(e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/20"></div>
              </label>
            </Card>

            <Card className="p-5 flex items-center gap-10">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-gray-900">
                  Show Sales on Home
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Display today's sales summary on your dashboard
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSalesOnHome}
                  onChange={(e) =>
                    handleToggleShowSalesOnHome(e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/20"></div>
              </label>
            </Card>
          </div>
        )}

        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-gray-900">
                Notification Settings
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Push notifications for updates
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled || isSubscribed}
                onChange={(e) =>
                  handleTogglePushNotifications(e.target.checked)
                }
                disabled={pushLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green) peer-focus:ring-4 peer-focus:ring-green-100"></div>
            </label>
          </div>
        </Card>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsOptions.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="bg-white rounded-3xl overflow-hidden">
              {group.title && (
                <h2 className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-white/50">
                  {group.title}
                </h2>
              )}
              <div className="divide-y divide-gray-100">
                {group.items.map((item, itemIndex) => (
                  <button
                    type="button"
                    key={itemIndex}
                    className="w-full flex items-center justify-between p-5 hover:bg-white transition-colors group cursor-pointer text-left"
                    onClick={() =>
                      item.action
                        ? item.action()
                        : item.path
                          ? navigate(item.path)
                          : null
                    }>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-gray-600 text-lg transition-all group-hover:bg-primary-bg-light"
                        style={{ "--hover-color": "var(--color-primary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--color-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "")
                        }>
                        {item.icon}
                      </div>
                      <span className="text-gray-900 font-bold text-base">
                        {item.label}
                      </span>
                      {item.hasNotification && (
                        <span className="w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/50"></span>
                      )}
                    </div>
                    <div
                      className="text-gray-300 transition-colors"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--color-primary)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}>
                      <FaAngleRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom spacing */}
          <div className="py-8"></div>
        </div>
      </div>
    </div>
  );
}

export default SettingPage;
