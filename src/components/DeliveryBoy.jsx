import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import TaskCard from "./Delivery/TaskCard";
import ActiveOrderPanel from "./Delivery/ActiveOrderPanel";
import DeliveryMap from "./Delivery/DeliveryMap";
import { ClipLoader } from "react-spinners";
import { FiFilter } from "react-icons/fi";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBox,
  FaCamera,
  FaCheck,
  FaClock,
  FaCoins,
  FaComment,
  FaExclamationCircle,
  FaFlag,
  FaFolder,
  FaHandHoldingUsd,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaMotorcycle,
  FaPhone,
  FaShoppingBag,
  FaStar,
  FaUtensils,
  FaWalking,
} from "react-icons/fa";
import { MdCreditCard } from "react-icons/md";
import { RiShutDownLine } from "react-icons/ri";
import io from "socket.io-client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";
import { toast } from "react-toastify";
import CancelJobModal from "./CancelJobModal";
import Pagination from "./ui/Pagination";
import { useDeliverer } from "../context/DelivererContext.jsx";
import { DelivererDataContext } from "../layouts/DeliveryLayout.jsx";

function DeliveryBoy() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- States ---
  const {
    isOnline: isOnDuty,
    setOnlineStatus,
    loading: statusLoading,
    toggleOnlineStatus,
  } = useDeliverer();
  const { visibleDeliveries: sharedVisibleDeliveries = [], triggerRefresh } =
    useContext(DelivererDataContext) || {};
  const [currentLocation, setCurrentLocation] = useState(null);
  // Note: available assignments come from context (computedAvailableAssignments)
  const [availableAssignments, setAvailableAssignments] = useState([]); // legacy setter used elsewhere

  // Get deliverer's current location
  useEffect(() => {
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          console.log("Current location obtained:", {
            lat: latitude,
            lon: longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Bangkok coordinates if location access denied
          setCurrentLocation({ lat: 13.7563, lon: 100.5018 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Accept cached location up to 1 minute old
        },
      );
    };

    getCurrentLocation();

    // Update location periodically
    const locationInterval = setInterval(getCurrentLocation, 30000); // Every 30 seconds

    return () => clearInterval(locationInterval);
  }, []);

  // Sync local state with context data
  useEffect(() => {
    setAvailableAssignments(sharedVisibleDeliveries);
  }, [sharedVisibleDeliveries]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [socket, setSocket] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  // States for stages logic
  const [hasArrivedAtRestaurant, setHasArrivedAtRestaurant] = useState(false);
  const [showTravelToRestaurant, setShowTravelToRestaurant] = useState(false);
  const [showTravelToCustomer, setShowTravelToCustomer] = useState(false);
  const [showConfirmDelivery, setShowConfirmDelivery] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showOrderItemsInConfirm, setShowOrderItemsInConfirm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  // States for financial/history
  const [financialData, setFinancialData] = useState({
    todayIncome: 0,
    jobCredit: 0,
    todayTip: 0,
    incentive: 0,
    todayCoins: 0,
    completedTasks: 0,
  });
  const [financialLoading, setFinancialLoading] = useState(false);
  const [delivererReviews, setDelivererReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [showHistoryDatePicker, setShowHistoryDatePicker] = useState(false);
  const [historyDateRange, setHistoryDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tempHistoryStartDate, setTempHistoryStartDate] = useState(null);
  const [tempHistoryEndDate, setTempHistoryEndDate] = useState(null);

  // States for UI
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCountdowns, setOrderCountdowns] = useState({});
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [allAssignments, setAllAssignments] = useState([]); // Store all assignments
  const [assignmentsReceivedAt, setAssignmentsReceivedAt] = useState(null); // Track when assignments were received
  const [visibleAssignments, setVisibleAssignments] = useState([]); // Only visible assignments (local fallback)
  const prevVisibleCountRef = useRef(0);
  const prevAllCountRef = useRef(0);
  const notificationAudioRef = useRef(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem("pushEnabled");
      if (stored === "false") return false;
      if (stored === "true") return true;
    } catch (e) {}
    return true; // default on
  });

  const navAssignments = useMemo(
    () =>
      sharedVisibleDeliveries.length
        ? sharedVisibleDeliveries
        : visibleAssignments,
    [sharedVisibleDeliveries, visibleAssignments],
  );

  const computedAvailableAssignments = useMemo(() => {
    const list = sharedVisibleDeliveries.length
      ? sharedVisibleDeliveries
      : visibleAssignments;
    if (assignmentFilter === "priority") {
      return list.filter((a) => a?.deliveryPriority === "priority");
    }
    return list;
  }, [sharedVisibleDeliveries, visibleAssignments, assignmentFilter]);

  const averageRating = useMemo(() => {
    const profileRating = Number(
      userData?.rating || userData?.averageRating || 0,
    );
    if (profileRating > 0) return profileRating;

    if (!delivererReviews || delivererReviews.length === 0) return 0;
    const total = delivererReviews.reduce(
      (sum, review) => sum + Number(review?.rating || 0),
      0,
    );
    return total / delivererReviews.length;
  }, [delivererReviews, userData?.rating, userData?.averageRating]);

  const fetchReviews = useCallback(async () => {
    if (!userData?._id) return;
    setReviewsLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/review/rider/my-reviews`, {
        withCredentials: true,
      });
      if (res.data && Array.isArray(res.data)) {
        setDelivererReviews(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [userData?._id]);

  const fetchFinancialData = useCallback(async () => {
    if (!userData?._id) return;
    setFinancialLoading(true);
    try {
      const res = await axios.get(
        `${serverUrl}/api/delivery/financial-summary`,
        {
          withCredentials: true,
        },
      );
      if (res.data) {
        setFinancialData({
          todayIncome: res.data.todayIncome || 0,
          jobCredit: res.data.jobCredit || userData?.jobCredit || 0,
          todayTip: res.data.todayTip || 0,
          incentive: res.data.incentive || 0,
          todayCoins: res.data.todayCoins || 0,
          completedTasks: res.data.completedTasks || 0,
        });
        console.log("Financial data fetched:", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch financial data:", err);
      // Set default values on error
      setFinancialData({
        todayIncome: 0,
        jobCredit: userData?.jobCredit || 0,
        todayTip: 0,
        incentive: 0,
        todayCoins: 0,
        completedTasks: 0,
      });
    } finally {
      setFinancialLoading(false);
    }
  }, [userData?._id, userData?.jobCredit]);

  const fetchAssignments = useCallback(() => {
    if (typeof triggerRefresh === "function") {
      triggerRefresh();
    }
  }, [triggerRefresh]);

  const handleJobCancelled = (data) => {
    const activeId = currentOrder?._id ? String(currentOrder._id) : "";
    const incomingId = data?.orderId ? String(data.orderId) : "";

    if (activeId && incomingId && activeId === incomingId) {
      try {
        localStorage.removeItem(`deliveryStage_${activeId}`);
      } catch (e) {
        // ignore
      }
      setCurrentOrder(null);
      setHasArrivedAtRestaurant(false);
      setShowTravelToCustomer(false);
      setShowTravelToRestaurant(false);
      toast.success(
        data?.message ||
          "Job cancelled successfully. The job is now available for other deliverers.",
      );
      fetchAssignments();
    }
  };

  const handleAssignmentTimeout = useCallback((assignmentId) => {
    // Remove the assignment from available assignments when timeout occurs
    setAvailableAssignments((prev) =>
      prev.filter((assignment) => assignment.assignmentId !== assignmentId),
    );
    console.log(`Assignment ${assignmentId} timed out - removed from view`);
  }, []);

  const handleNewAssignment = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleAssignmentRemoved = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const toggleDuty = useCallback(async () => {
    try {
      await toggleOnlineStatus();
      fetchAssignments();
    } catch (e) {
      // ignore errors here; UI handles toast inside toggleOnlineStatus
    }
  }, [toggleOnlineStatus, fetchAssignments]);

  const handleDeliveryOrderCancelled = (data) => {
    const activeId = currentOrder?._id ? String(currentOrder._id) : "";
    const incomingId = data?.orderId ? String(data.orderId) : "";

    if (activeId && incomingId && activeId === incomingId) {
      try {
        localStorage.removeItem(`deliveryStage_${activeId}`);
      } catch (e) {
        // ignore
      }
      setCurrentOrder(null);
      setHasArrivedAtRestaurant(false);
      setShowTravelToCustomer(false);
      setShowTravelToRestaurant(false);
      toast.info("Order cancelled by owner");
    }
  };

  useEffect(() => {
    if (!socket || !userData?._id) return;

    socket.on("delivery-assignment", handleNewAssignment);
    socket.on("delivery-assignment-removed", handleAssignmentRemoved);
    socket.on("update-status", handleStatusUpdate);
    socket.on("delivery-order-cancelled", handleDeliveryOrderCancelled);
    socket.on("job-cancelled", handleJobCancelled);

    return () => {
      socket.off("delivery-assignment", handleNewAssignment);
      socket.off("delivery-assignment-removed", handleAssignmentRemoved);
      socket.off("update-status", handleStatusUpdate);
      socket.off("delivery-order-cancelled", handleDeliveryOrderCancelled);
      socket.off("job-cancelled", handleJobCancelled);
    };
  }, [
    socket,
    userData?._id,
    currentOrder?._id,
    fetchAssignments,
    handleDeliveryOrderCancelled,
    handleNewAssignment,
    handleAssignmentRemoved,
    handleJobCancelled,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setOrderCountdowns((prev) => {
        const next = {};
        let changed = false;
        Object.keys(prev).forEach((key) => {
          if (prev[key] > 0) {
            next[key] = prev[key] - 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Current Active Order
  const fetchCurrentOrder = useCallback(async () => {
    if (!userData?._id) return;
    setPageLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/order/get-current-order`, {
        withCredentials: true,
      });
      if (res.data) {
        const order = res.data;
        const shopOrderStatus = order.shopOrder?.status?.toLowerCase();

        // Check if order is cancelled
        if (shopOrderStatus === "cancelled" || shopOrderStatus === "canceled") {
          setCurrentOrder(null);
          setHasArrivedAtRestaurant(false);
          setShowTravelToCustomer(false);
          setShowTravelToRestaurant(false);
          try {
            localStorage.removeItem(`deliveryStage_${order._id}`);
          } catch (e) {
            // ignore
          }
          return;
        }

        setCurrentOrder(order);

        // Restore stage from local storage or infer
        const orderId = order._id.toString();
        const savedStage = localStorage.getItem(`deliveryStage_${orderId}`);

        if (savedStage === "picked_up") {
          setHasArrivedAtRestaurant(true);
          setShowTravelToCustomer(true);
          setShowTravelToRestaurant(false);
        } else if (savedStage === "restaurant") {
          setHasArrivedAtRestaurant(true);
          setShowTravelToRestaurant(false); // At restaurant
          setShowTravelToCustomer(false);
        } else if (
          order.shopOrder?.status === "prepared" ||
          order.shopOrder?.status === "being_cooked" ||
          order.shopOrder?.status === "accepted"
        ) {
          // Default to traveling to restaurant
          setShowTravelToRestaurant(true);
          setHasArrivedAtRestaurant(false);
          setShowTravelToCustomer(false);
        } else if (
          order.shopOrder?.status === "picked_up" ||
          order.shopOrder?.status === "out_for_delivery"
        ) {
          setHasArrivedAtRestaurant(true);
          setShowTravelToCustomer(true);
          setShowTravelToRestaurant(false);
        }
      } else {
        setCurrentOrder(null);
      }
    } catch (err) {
    } finally {
      setPageLoading(false);
    }
  }, [userData?._id]);

  useEffect(() => {
    fetchCurrentOrder();
  }, [fetchCurrentOrder]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // --- Action Handlers ---

  const acceptOrder = async (assignmentId) => {
    if (!userData?._id) return;
    setAcceptingOrderId(assignmentId);
    try {
      await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, {
        withCredentials: true,
      });
      // Order accepted
      // Clear assignments
      setAvailableAssignments([]);
      setSelectedOrder(null);
      fetchCurrentOrder();
      // Set View
      setShowTravelToRestaurant(true);
    } catch (err) {
      toast.error("Error accepting order. It may have been taken.");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleConfirmArrivalAtRestaurant = async () => {
    if (!currentOrder) return;
    setPageLoading(true);
    try {
      // Logic to update status
      // For now just local state as per original code logic usually involving socket or API
      setHasArrivedAtRestaurant(true);
      setShowTravelToRestaurant(false);
      // Persist
      localStorage.setItem(`deliveryStage_${currentOrder._id}`, "restaurant");
    } catch (err) {
    } finally {
      setPageLoading(false);
    }
  };

  const handleConfirmPickupOrder = async () => {
    if (!currentOrder) return;
    setPageLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/order/confirm-pickup`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder?.shopOrder?._id,
        },
        { withCredentials: true },
      );
      setHasArrivedAtRestaurant(true);
      setShowTravelToCustomer(true);
      localStorage.setItem(`deliveryStage_${currentOrder._id}`, "picked_up");
      // Update order data locally
      setCurrentOrder((prev) => ({
        ...prev,
        shopOrder: { ...prev.shopOrder, status: "picked_up" },
      }));
    } catch (err) {
      toast.error("Failed to confirm pickup");
    } finally {
      setPageLoading(false);
    }
  };

  const handleConfirmDelivery = () => {
    setShowConfirmDelivery(true);
    setShowTravelToCustomer(false);
  };

  const handleConfirmDeliveryAndPayment = async () => {
    if (!currentOrder) return;
    setPageLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/order/confirm-delivery`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder?.shopOrder?._id,
        },
        { withCredentials: true },
      );
      setShowConfirmDelivery(false);
      setShowOrderDetail(true); // Show summary
      localStorage.removeItem(`deliveryStage_${currentOrder._id}`);
      // Refresh financial data after a delay to ensure backend has processed the order

      setTimeout(() => {
        fetchFinancialData();
        fetchReviews(); // Refresh reviews to update rating
      }, 3000);
    } catch (err) {
      toast.error("Failed to complete delivery");
    } finally {
      setPageLoading(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setCurrentOrder(null);
    setHasArrivedAtRestaurant(false);
    setShowTravelToCustomer(false);
    setShowTravelToRestaurant(false);
    // Add a delay to ensure backend has processed the delivery before fetching financial data

    setTimeout(() => {
      fetchFinancialData(); // update income
    }, 2000);
    setOnlineStatus(true); // back to duty
    fetchAssignments(); // search again
  };

  // --- Redesign Logic (Replaces Render) ---
  const deliveryStage = showConfirmDelivery
    ? "confirming_delivery"
    : showTravelToCustomer
      ? "traveling_to_customer"
      : hasArrivedAtRestaurant
        ? "at_restaurant"
        : "traveling_to_restaurant";

  const effectiveDeliveryStage = showOrderDetail ? "completed" : deliveryStage;

  const getActionLabel = () => {
    if (effectiveDeliveryStage === "traveling_to_restaurant")
      return "I've Arrived at Restaurant";
    if (effectiveDeliveryStage === "at_restaurant") {
      const soStatus = String(
        currentOrder?.shopOrder?.status || "",
      ).toLowerCase();
      if (soStatus === "preparing") return "Waiting for Restaurant";
      return "Confirm Pickup";
    }
    if (effectiveDeliveryStage === "traveling_to_customer")
      return "I've Arrived at Customer";
    if (effectiveDeliveryStage === "confirming_delivery")
      return "Confirm Delivery & Payment";
    if (effectiveDeliveryStage === "completed") return "Continue Working";
    return "Action";
  };

  const pickupBlocked =
    effectiveDeliveryStage === "at_restaurant" &&
    String(currentOrder?.shopOrder?.status || "").toLowerCase() === "preparing";

  const handleActiveOrderAction = async () => {
    if (effectiveDeliveryStage === "traveling_to_restaurant") {
      await handleConfirmArrivalAtRestaurant();
      return;
    }
    if (effectiveDeliveryStage === "at_restaurant") {
      if (pickupBlocked) return;
      await handleConfirmPickupOrder();
      return;
    }
    if (effectiveDeliveryStage === "traveling_to_customer") {
      handleConfirmDelivery();
      return;
    }
    if (effectiveDeliveryStage === "confirming_delivery") {
      await handleConfirmDeliveryAndPayment();
      return;
    }
    if (effectiveDeliveryStage === "completed") {
      handleCloseOrderDetail();
      return;
    }
  };

  const handleLogout = async () => {
    if (currentOrder) {
      toast.error(
        "You have an active job. Please complete it before logging out.",
      );
      return;
    }

    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    } catch (error) {
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER CONSOLE"
          title={userData?.fullName || "Deliverer"}
          description="Go online to receive deliveries and complete jobs."
          left={
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center">
              {userData?.profileImage || userData?.image ? (
                <img
                  src={userData?.profileImage || userData?.image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs font-extrabold text-white">
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
          }
          icon={<FaMotorcycle size={22} />}
          right={
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleDuty}
                aria-label={isOnDuty ? "Go Offline" : "Go Online"}
                title={isOnDuty ? "Go Offline" : "Go Online"}
                className={`min-h-[44px] px-4 rounded-2xl text-sm font-extrabold transition-colors border inline-flex items-center gap-2 ${
                  isOnDuty
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}>
                <RiShutDownLine size={18} />
              </button>
            </div>
          }
        />

        <div className="bg-white rounded-3xl shadow-lg border-none p-4 sm:p-6">
          <div
            className={`grid grid-cols-2 gap-3 ${
              currentOrder ? "sm:grid-cols-2" : "sm:grid-cols-4"
            }`}>
            <div className="rounded-3xl bg-slate-50 border-none shadow-sm p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                TODAY
              </div>
              {financialLoading ? (
                <div className="mt-3 h-8 w-24 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  ฿{Number(financialData.todayIncome ?? 0).toFixed(2)}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-slate-50 border-none shadow-sm p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                CREDIT
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                ฿
                {Number(
                  userData?.jobCredit ?? financialData.jobCredit ?? 0,
                ).toFixed(0)}
              </div>
            </div>

            {!currentOrder && (
              <div className="rounded-3xl bg-slate-50 border-none shadow-sm p-4">
                <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                  COMPLETED
                </div>
                {financialLoading ? (
                  <div className="mt-3 h-8 w-16 rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">
                    {Number(financialData?.completedTasks ?? 0)}
                  </div>
                )}
              </div>
            )}

            {!currentOrder && (
              <div className="rounded-3xl bg-slate-50 border-none shadow-sm p-4">
                <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                  RATING
                </div>
                {reviewsLoading ? (
                  <div className="mt-3 h-8 w-16 rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">
                    {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isOnDuty &&
            (userData?.jobCredit ?? financialData.jobCredit ?? 0) < 300 && (
              <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-2xl text-sm font-extrabold border border-amber-100">
                Insufficient credit (฿
                {(userData?.jobCredit ?? financialData.jobCredit ?? 0).toFixed(
                  2,
                )}
                ) . Min ฿300 required.
              </div>
            )}
        </div>

        {currentOrder && (
          <div className="space-y-3">
            {effectiveDeliveryStage !== "at_restaurant" &&
              effectiveDeliveryStage !== "confirming_delivery" &&
              effectiveDeliveryStage !== "completed" && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-[260px] sm:h-[320px]">
                    <DeliveryMap
                      delivererLocation={
                        currentLocation
                          ? {
                              lat: currentLocation.lat,
                              lon: currentLocation.lon,
                            }
                          : null
                      }
                      targetLocation={(() => {
                        const shopLat =
                          currentOrder?.shopOrder?.shop?.location?.latitude;
                        const shopLon =
                          currentOrder?.shopOrder?.shop?.location?.longitude;
                        const customerLat =
                          currentOrder?.deliveryAddress?.latitude ||
                          currentOrder?.deliveryAddress?.lat;
                        const customerLon =
                          currentOrder?.deliveryAddress?.longitude ||
                          currentOrder?.deliveryAddress?.lon;
                        if (
                          effectiveDeliveryStage === "traveling_to_restaurant"
                        ) {
                          return shopLat != null && shopLon != null
                            ? { lat: shopLat, lon: shopLon }
                            : null;
                        }
                        return customerLat != null && customerLon != null
                          ? { lat: customerLat, lon: customerLon }
                          : null;
                      })()}
                      targetType={
                        effectiveDeliveryStage === "traveling_to_restaurant"
                          ? "shop"
                          : "customer"
                      }
                    />
                  </div>
                </div>
              )}

            <ActiveOrderPanel
              order={currentOrder}
              status={effectiveDeliveryStage}
              onAction={handleActiveOrderAction}
              actionLabel={getActionLabel()}
              actionDisabled={
                effectiveDeliveryStage === "at_restaurant"
                  ? pickupBlocked
                  : false
              }
              actionHint={
                effectiveDeliveryStage === "at_restaurant" && pickupBlocked
                  ? "Order is still preparing. Please wait until the restaurant marks it ready."
                  : undefined
              }
              absolute={false}
            />

            {/* Cancel Job Button - Show when order is out of delivery (before pickup) */}
            {currentOrder?.shopOrder &&
              (effectiveDeliveryStage === "traveling_to_restaurant" ||
                (effectiveDeliveryStage === "at_restaurant" &&
                  !currentOrder?.shopOrder?.pickedUpAt)) && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors border border-red-200 text-sm">
                    Cancel Job
                  </button>
                </div>
              )}
          </div>
        )}

        {/* Cancel Job Modal */}
        {showCancelModal && currentOrder?.shopOrder && (
          <CancelJobModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            orderId={currentOrder._id}
            shopId={
              currentOrder.shopOrder?.shop?._id ||
              currentOrder.shopOrder?.shop ||
              currentOrder.shopOrder?.shopId
            }
            onSuccess={() => {
              // Clear current order after job cancellation
              setCurrentOrder(null);
              setHasArrivedAtRestaurant(false);
              setShowTravelToCustomer(false);
              setShowTravelToRestaurant(false);
              setShowCancelModal(false);
              // Refresh assignments to see available jobs
              fetchAssignments();
            }}
          />
        )}

        {!currentOrder && (
          <div className="bg-white rounded-3xl shadow-lg border-none p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                  ASSIGNMENTS
                </div>
                <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
                  Available Deliveries
                </div>
              </div>
              <button
                type="button"
                onClick={fetchAssignments}
                className="min-h-[44px] px-4 rounded-2xl bg-slate-100 text-slate-900 font-extrabold hover:bg-slate-200 transition-colors">
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {!isOnDuty ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <div className="font-extrabold text-slate-900">
                    You're offline
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Go online to start receiving delivery requests.
                  </div>
                </div>
              ) : assignmentsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 animate-pulse" />
                          <div className="min-w-0 flex-1">
                            <div className="h-4 w-36 bg-slate-100 rounded-lg animate-pulse" />
                            <div className="mt-2 h-3 w-52 bg-slate-100 rounded-lg animate-pulse" />
                          </div>
                        </div>
                        <div className="h-10 w-28 bg-slate-100 rounded-xl animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableAssignments.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center">
                  <div className="font-extrabold text-slate-900">
                    No tasks right now
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Keep online and tap refresh.
                  </div>
                </div>
              ) : (
                availableAssignments.map((assignment) => (
                  <TaskCard
                    key={assignment.assignmentId}
                    assignment={assignment}
                    delivererLocation={currentLocation}
                    onAccept={acceptOrder}
                    isAccepting={acceptingOrderId === assignment.assignmentId}
                    onTimeout={handleAssignmentTimeout}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(showReviews || showHistory) && (
        <div className="pointer-events-auto fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="p-4 flex items-center gap-2 border-b border-gray-100 sticky top-0 bg-white shadow-sm z-10">
            <button
              onClick={() => {
                setShowReviews(false);
                setShowHistory(false);
              }}
              className="p-2 -ml-2 text-gray-600">
              <FaArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-lg text-gray-800">
              {showReviews ? "My Reviews" : "Delivery History"}
            </h2>
          </div>

          <div className="p-4">
            {showReviews ? (
              reviewsLoading ? (
                <div className="text-center py-10 text-gray-400">
                  <p>Loading reviews...</p>
                  <ClipLoader size={20} color="#cbd5e1" className="mt-4" />
                </div>
              ) : delivererReviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-700 font-bold">No reviews yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete deliveries to start receiving ratings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {delivererReviews.map((review) => (
                    <div
                      key={review._id}
                      className="border border-gray-100 p-4 rounded-2xl bg-white">
                      <div className="flex justify-between mb-2">
                        <span className="font-extrabold text-gray-900">
                          {review.user?.fullName}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          <FaStar /> {review.rating}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )
            ) : historyLoading ? (
              <div className="text-center py-10 text-gray-400">
                <p>Loading history...</p>
                <ClipLoader size={20} color="#cbd5e1" className="mt-4" />
              </div>
            ) : filteredHistoryOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-700 font-bold">No deliveries found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your completed deliveries will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="font-bold text-gray-700">
                    Total Earnings
                  </span>
                  <span className="font-extrabold text-blue-700">
                    ฿{historyEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredHistoryOrders
                    .slice(
                      (currentHistoryPage - 1) * historyItemsPerPage,
                      currentHistoryPage * historyItemsPerPage,
                    )
                    .map((order) => (
                      <div
                        key={order._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedOrder(order)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedOrder(order);
                          }
                        }}
                        className="border border-gray-100 p-4 rounded-2xl flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-extrabold text-gray-900">
                            #{order._id.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatHistoryDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="font-extrabold text-blue-600">
                          ฿{order.deliveryFee?.toFixed(2)}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                {filteredHistoryOrders.length > historyItemsPerPage && (
                  <div className="pt-2">
                    <Pagination
                      currentPage={currentHistoryPage}
                      totalItems={filteredHistoryOrders.length}
                      itemsPerPage={historyItemsPerPage}
                      onPageChange={setCurrentHistoryPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showHistory && selectedOrder && (
        <div className="pointer-events-auto fixed inset-0 bg-black/40 z-60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                  ORDER
                </div>
                <div className="mt-1 text-base font-extrabold text-slate-900">
                  #{selectedOrder?._id?.slice(-6) || ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center"
                aria-label="Close">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {(() => {
                const shopOrders = Array.isArray(selectedOrder?.shopOrders)
                  ? selectedOrder.shopOrders
                  : [];
                const myId = userData?._id?.toString();
                const myShopOrder =
                  shopOrders.find((so) => {
                    const assigned = so?.assignedDeliveryBoy;
                    const assignedId =
                      typeof assigned === "object"
                        ? assigned?._id?.toString()
                        : assigned?.toString();
                    return assignedId && myId && assignedId === myId;
                  }) || shopOrders[0];

                const items = Array.isArray(myShopOrder?.shopOrderItems)
                  ? myShopOrder.shopOrderItems
                  : Array.isArray(myShopOrder?.items)
                    ? myShopOrder.items
                    : [];

                return (
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-slate-50 border-none shadow-sm p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                            DATE
                          </div>
                          <div className="mt-1 text-sm font-extrabold text-slate-900">
                            {selectedOrder?.createdAt
                              ? formatHistoryDate(selectedOrder.createdAt)
                              : "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                            EARNED
                          </div>
                          <div className="mt-1 text-sm font-extrabold text-blue-700">
                            ฿
                            {Number(selectedOrder?.deliveryFee || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-4">
                      <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                        STATUS
                      </div>
                      <div className="mt-1 text-sm font-extrabold text-slate-900 capitalize">
                        {myShopOrder?.status || "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-4">
                      <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                        ITEMS
                      </div>
                      <div className="mt-2 space-y-1">
                        {items.length === 0 ? (
                          <div className="text-sm text-slate-500 font-bold">
                            —
                          </div>
                        ) : (
                          items.slice(0, 8).map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 text-sm">
                              <div className="font-bold text-slate-700 truncate">
                                {Number(it?.quantity || it?.qty || 1)}x{" "}
                                {it?.name || "Item"}
                              </div>
                              <div className="font-extrabold text-slate-900">
                                ฿{Number(it?.price || 0).toFixed(0)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryBoy;
