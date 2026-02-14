import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import {
  FaBell,
  FaCog,
  FaHome,
  FaMoneyBillWave,
  FaQuestionCircle,
} from "react-icons/fa";
import { MdHistory } from "react-icons/md";
import { useDeliverer } from "../context/DelivererContext.jsx";

export const DelivererDataContext = createContext({
  visibleDeliveries: [],
  triggerRefresh: () => {},
  isOnline: false,
});

const useNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const readNotificationPreference = useCallback(() => {
    try {
      const stored = localStorage.getItem("pushEnabled");
      if (stored === "false") return false;
      if (stored === "true") return true;
    } catch (e) {
      return true;
    }
    return true;
  }, []);

  useEffect(() => {
    setNotificationsEnabled(readNotificationPreference());
    const handler = () => {
      setNotificationsEnabled(readNotificationPreference());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [readNotificationPreference]);

  const triggerNotification = useCallback(
    (assignment) => {
      if (!notificationsEnabled) {
        return;
      }

      if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return;
      }

      const restaurantName =
        assignment?.shop?.name ||
        assignment?.shopOrder?.shop?.name ||
        assignment?.shopName ||
        "Restaurant";
      const earnings = Number(assignment?.deliveryFee ?? 0).toFixed(2);

      // Increment unread count for badge
      setUnreadCount((prev) => prev + 1);

      // Play notification sound
      try {
        const audio = new Audio("/notification1.mp3");
        audio.play().catch((error) => {
          // Silently handle audio play failures
        });
      } catch (error) {
        // Silently handle audio creation failures
      }

      if (Notification.permission === "granted") {
        const notification = new Notification("New Delivery Available!", {
          body: `Earnings: ฿${earnings} - Pickup at ${restaurantName}`,
          icon: "/scooter.png",
          requireInteraction: true, // Keep notification visible until user interacts
          tag: `delivery-${assignment.assignmentId}`, // Prevent duplicates
          sound: "/notification1.mp3", // Add sound reference
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        notification.onshow = () => {
          // Notification shown successfully
        };

        notification.onerror = (error) => {
          console.error("Notification error:", error);
        };

        notification.onclose = () => {
          // Notification closed by user
        };
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            const notification = new Notification("New Delivery Available!", {
              body: `Earnings: ฿${earnings} - Pickup at ${restaurantName}`,
              icon: "/scooter.png",
              sound: "/notification1.mp3",
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        });
      }
    },
    [notificationsEnabled, setUnreadCount],
  );

  return { unreadCount, setUnreadCount, triggerNotification };
};

const useToast = () => {
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  const handleShowToast = useCallback(() => {
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 5000);
  }, []);

  return { showToast, handleShowToast };
};

const useDelivererLayout = () => {
  const { userData } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useDeliverer();

  // Log location changes for debugging
  useEffect(() => {
    // Location tracking for delivery navigation
  }, [location]);

  const [visibleDeliveries, setVisibleDeliveries] = useState([]);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const { unreadCount, setUnreadCount, triggerNotification } =
    useNotification();
  const { showToast, handleShowToast } = useToast();

  // Clear badge when navigating away from notifications
  useEffect(() => {
    if (location.pathname !== "/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname, setUnreadCount]);

  // Save job notification to database
  const saveJobNotification = useCallback(
    async (assignment) => {
      try {
        await axios.post(
          `${serverUrl}/api/notifications`,
          {
            recipient: userData?._id, // Send the deliverer's ID as recipient
            title: "New Job Available",
            message: `New delivery job from ${assignment.shopName} - Earnings: ฿${Number(assignment.deliveryFee || 0).toFixed(2)} - Distance: ${assignment.distance ? assignment.distance.toFixed(1) : "Unknown"} km`,
            type: "delivery_assignment",
            relatedId: assignment.assignmentId,
            relatedModel: "DeliveryAssignment",
          },
          { withCredentials: true },
        );
        // Job notification saved successfully
      } catch (error) {
        console.error("Failed to save job notification:", error);
      }
    },
    [userData?._id],
  );

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!userData?._id || !isOnline) return;
    try {
      const res = await axios.get(
        `${serverUrl}/api/order/get-assignments?t=${Date.now()}`,
        {
          withCredentials: true,
        },
      );

      if (res.data && Array.isArray(res.data)) {
        // Process assignments for visibility delay logic

        // Implement visibility delay logic based on current distance
        const updatedDeliveries = [];

        res.data.forEach((assignment) => {
          // Parse the ISO date string correctly
          const createdTime = new Date(assignment.createdAt).getTime();

          // Calculate delay based on current distance, not creation time
          const distance = assignment?.distance || 0;
          let effectiveRemainingDelay = 0;

          if (distance > 0) {
            // Calculate delay based on distance (same as backend logic)
            if (distance <= 0.1) {
              // Within 100m: 1 second delay
              effectiveRemainingDelay = 1;
            } else if (distance <= 1) {
              // Within 1km: 10 seconds delay
              effectiveRemainingDelay = 10;
            } else {
              // Beyond 1km: 10 seconds + 10 seconds per additional km
              const additionalKm = distance - 1;
              effectiveRemainingDelay = 10 + Math.ceil(additionalKm * 10);
            }
          } else {
            // Unknown distance: 60 seconds delay
            effectiveRemainingDelay = 60;
          }

          if (effectiveRemainingDelay <= 0) {
            // If delay has passed, show immediately
            updatedDeliveries.push(assignment);
            // Trigger notification for immediately visible jobs
            triggerNotification(assignment);
            // Save to notifications database
            saveJobNotification(assignment);
          } else {
            // Otherwise, schedule to show after the remaining delay
            setTimeout(() => {
              setVisibleDeliveries((prev) => {
                if (
                  !prev.some((d) => d.assignmentId === assignment.assignmentId)
                ) {
                  // Trigger notification for delayed jobs when they become visible
                  triggerNotification(assignment);
                  // Save to notifications database when job becomes visible
                  saveJobNotification(assignment);
                  return [...prev, assignment];
                }
                return prev;
              });
            }, effectiveRemainingDelay * 1000);
          }
        });

        // Merge immediately visible assignments with existing ones that are still scheduled
        setVisibleDeliveries((prev) => {
          const merged = [...updatedDeliveries];

          // Add existing assignments that aren't in the new fetch but are still valid
          prev.forEach((existing) => {
            if (!merged.some((d) => d.assignmentId === existing.assignmentId)) {
              // Check if this existing assignment is still in the new data
              const stillExists = res.data.some(
                (newAssignment) =>
                  newAssignment.assignmentId === existing.assignmentId,
              );
              if (stillExists) {
                merged.push(existing);
              }
            }
          });

          return merged;
        });
        console.log(
          `Immediately visible assignments: ${updatedDeliveries.length}`,
        );
        console.log(
          `Delayed assignments scheduled: ${res.data.length - updatedDeliveries.length}`,
        );
      }
      console.log("=== END FRONTEND DEBUG ===");
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      // Don't clear existing deliveries on error, just log it
      // This prevents jobs from disappearing on temporary network issues
    }
  }, [userData?._id, isOnline]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchAssignments();
    };
    window.addEventListener("delivery:refreshAssignments", handleRefresh);
    return () =>
      window.removeEventListener("delivery:refreshAssignments", handleRefresh);
  }, [fetchAssignments]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (isOnline) {
      fetchAssignments();
      // Poll every 30 seconds
      const interval = setInterval(fetchAssignments, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, fetchAssignments]);

  const isDeliveryVerificationPage = useMemo(
    () =>
      location.pathname === "/delivery-verification" ||
      location.pathname === "/delivery-contract",
    [location.pathname],
  );

  const showBottomNav = useMemo(() => {
    if (userData?.role !== "deliveryBoy") return false;
    if (location.pathname === "/delivery-verification") return false;
    return true;
  }, [location.pathname, userData?.role]);

  const contentNeedsBottomPadding = useMemo(() => {
    if (!showBottomNav) return false;
    if (
      location.pathname === "/delivery-boy-finance" ||
      location.pathname === "/delivery-history" ||
      location.pathname === "/delivery-boy-bank-account" ||
      location.pathname === "/delivery-boy-job-details" ||
      location.pathname === "/income-summary"
    )
      return false;
    return true;
  }, [location.pathname, showBottomNav]);

  const navActive = useMemo(() => {
    const path = location.pathname;
    return {
      home: path === "/",
      history: path === "/delivery-history",
      notifications: path === "/notifications",
      finance: path === "/delivery-boy-finance",
      settings: path === "/setting" || path.startsWith("/setting"),
    };
  }, [location.pathname]);

  const openHistory = () => navigate("/delivery-history");
  const openNotifications = () => {
    setUnreadCount(0); // Clear badge when opening notifications
    navigate("/notifications");
  };
  const openHelp = () => navigate("/help");

  const navItems = [
    {
      label: "Home",
      icon: <FaHome />,
      path: "/",
      active: navActive.home,
      onClick: () => navigate("/"),
    },
    {
      label: "History",
      icon: <MdHistory />,
      path: "/delivery-history",
      active: navActive.history,
      onClick: openHistory,
    },
    {
      label: "Notifications",
      icon: <FaBell />,
      path: "/notifications",
      active: navActive.notifications,
      onClick: openNotifications,
      badge: unreadCount,
    },
    {
      label: "Finance",
      icon: <FaMoneyBillWave />,
      path: "/delivery-boy-finance",
      active: navActive.finance,
      onClick: () => navigate("/delivery-boy-finance"),
    },
    {
      label: "Settings",
      icon: <FaCog />,
      path: "/setting",
      active: navActive.settings,
      onClick: () => navigate("/setting"),
    },
  ];

  const triggerRefresh = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    visibleDeliveries,
    triggerRefresh,
    isOnline,
    showToast,
    handleShowToast,
    triggerNotification,
    navItems,
    showBottomNav,
    contentNeedsBottomPadding,
    isDeliveryVerificationPage,
    checkingVerification,
    verificationStatus,
    openHelp,
    openNotifications,
    openHistory,
  };
};

const DeliveryLayout = ({ children }) => {
  const {
    visibleDeliveries,
    triggerRefresh,
    isOnline,
    showToast,
    handleShowToast,
    triggerNotification,
    navItems,
    showBottomNav,
    contentNeedsBottomPadding,
    isDeliveryVerificationPage,
    checkingVerification,
    verificationStatus,
    openHelp,
    openNotifications,
    openHistory,
  } = useDelivererLayout();

  if (checkingVerification) {
    return (
      <DelivererDataContext.Provider
        value={{ visibleDeliveries, triggerRefresh, isOnline }}>
        <div className="min-h-screen bg-white/90 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 max-w-sm w-full text-center">
            <div className="text-base font-black text-gray-900 mb-2">
              Checking verification…
            </div>
            <div className="text-sm text-gray-500 mb-6">
              Please wait a moment.
            </div>
            <div className="h-12 w-12 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        </div>
      </DelivererDataContext.Provider>
    );
  }

  return (
    <DelivererDataContext.Provider
      value={{ visibleDeliveries, triggerRefresh, isOnline }}>
      <div className="min-h-screen bg-white/90 relative">
        {showToast && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md"
            onClick={() => handleShowToast()}>
            <div className="bg-blue-600 text-white rounded-lg shadow-xl px-4 py-3 flex items-center justify-between gap-3 animate-[slideDown_0.3s_ease-out]">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">🔔</span>
                <div>
                  <p className="font-bold text-sm">New Order Available! 🍔</p>
                  <p className="text-xs text-blue-100">
                    Tap to view assignments
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-white text-lg font-bold px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowToast();
                }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen">
          <div className="w-80 shrink-0 p-6">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 h-full flex flex-col sticky top-6">
              <div className="mb-8 pb-6 border-b-2 border-gray-100">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    V
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900">
                      UniEats
                    </h1>
                    <div className="mt-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full inline-block">
                      DELIVERER
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-3 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={`w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 relative ${
                      item.active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    <span className="text-xl relative">
                      {item.icon}
                      {item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={openHelp}
                  className="w-full py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 bg-gray-100 text-gray-700 hover:bg-gray-200">
                  <FaQuestionCircle className="text-xl" />
                  <span>Help</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-screen">
            <div
              className={`flex-1 px-6 pb-6 ${contentNeedsBottomPadding ? "" : ""}`}>
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 min-h-full">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden flex flex-col min-h-screen">
          <div
            className={`flex-1 px-4 ${contentNeedsBottomPadding ? "pb-28" : "pb-4"}`}>
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 min-h-full">
              {children || <Outlet />}
            </div>
          </div>

          {showBottomNav && (
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe z-50">
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3">
                <div className="flex justify-between items-center">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-all relative ${
                        item.active ? "bg-blue-600 text-white" : "text-gray-500"
                      }`}>
                      <span className="text-xl relative">
                        {item.icon}
                        {item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-bold">
                        {item.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DelivererDataContext.Provider>
  );
};

export default DeliveryLayout;
