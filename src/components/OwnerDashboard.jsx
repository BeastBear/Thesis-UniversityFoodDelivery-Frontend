import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaUtensils } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import { FaStore } from "react-icons/fa6";
import {
  FaStickyNote,
  FaPhone,
  FaClock,
  FaStar,
  FaRegStar,
  FaChevronRight,
  FaTimes,
  FaCalendar,
  FaCloudSun,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { setMyShopData } from "../redux/ownerSlice";
import {
  setMyOrders,
  addMyOrder,
  updateRealtimeOrderStatus,
} from "../redux/userSlice";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { checkBusinessHours } from "../utils/checkBusinessHours";

function OwnerDashboard() {
  const { myShopData } = useSelector((state) => state.owner);
  const { myOrders, userData, socket } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showCloseStoreModal, setShowCloseStoreModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSales, setShowSales] = useState(true);

  // Check display settings
  useEffect(() => {
    const savedSetting = localStorage.getItem("showSalesOnHome");
    if (savedSetting !== null) {
      setShowSales(savedSetting === "true");
    }
  }, []);

  const fetchReviews = async () => {
    if (!myShopData?._id) return;
    setLoadingReviews(true);
    try {
      const result = await axios.get(
        `${serverUrl}/api/review/shop/${myShopData._id}`,
        { withCredentials: true },
      );
      setReviews(result.data);
    } catch (error) {
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} className="text-yellow-500 text-lg" />
        ) : (
          <FaRegStar key={i} className="text-yellow-500 text-lg" />
        ),
      );
    }
    return stars;
  };

  // Function to refresh shop data
  const refreshShopData = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
    } catch (error) {}
  }, [dispatch]);

  // Fetch orders for sales calculation
  const fetchOrders = useCallback(async () => {
    // Fetch orders if user is logged in (for owners, we need userData to be set)
    if (!userData?._id) return;
    setLoadingOrders(true);
    try {
      const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
        withCredentials: true,
      });
      dispatch(setMyOrders(result.data));
    } catch (error) {
    } finally {
      setLoadingOrders(false);
    }
  }, [userData?._id, dispatch]);

  useEffect(() => {
    if (myShopData?._id) {
      fetchReviews();
    }
  }, [myShopData?._id]);

  // Fetch orders when userData changes (after login) or when component mounts
  // This ensures orders are always up-to-date after login
  useEffect(() => {
    if (userData?._id && userData?.role === "owner") {
      fetchOrders();
    }
  }, [userData?._id, userData?.role, fetchOrders]);

  // Listen for real-time order updates via Socket.IO
  useEffect(() => {
    if (!socket || !userData?._id || userData?.role !== "owner") {
      return;
    }

    const handleNewOrder = async (data) => {
      // Add new order to Redux state
      const shopOrders = Array.isArray(data.shopOrders)
        ? data.shopOrders
        : [data.shopOrders];
      const relevantShopOrder = shopOrders.find((shopOrder) => {
        const ownerId = shopOrder?.owner?._id || shopOrder?.owner;
        return (
          ownerId &&
          (ownerId.toString() === userData._id.toString() ||
            ownerId === userData._id)
        );
      });

      if (relevantShopOrder) {
        dispatch(addMyOrder({ ...data, shopOrders }));
        // Refresh orders to ensure latest data
        fetchOrders();
      }
    };

    const handleUpdateStatus = ({
      orderId,
      shopId,
      status,
      userId,
      ownerId,
    }) => {
      // Update order status in Redux state for real-time updates
      if (ownerId === userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
        // Refresh orders to ensure latest data (especially for delivered orders affecting sales)
        fetchOrders();
      }
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("update-status", handleUpdateStatus);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("update-status", handleUpdateStatus);
    };
  }, [socket, userData, dispatch, fetchOrders]);

  // Calculate today's sales
  const todaySales = useMemo(() => {
    if (!myOrders || !Array.isArray(myOrders)) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let total = 0;
    myOrders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);
      if (orderDate >= today && orderDate < tomorrow) {
        const shopOrder = order.shopOrders?.[0];
        // Only count delivered (completed) orders
        if (
          shopOrder &&
          shopOrder.status === "delivered" &&
          shopOrder.subtotal
        ) {
          total += shopOrder.subtotal;
        }
      }
    });

    return total;
  }, [myOrders]);

  // Handle store close/open
  const handleCloseStore = () => {
    setShowCloseStoreModal(true);
  };

  // Calculate next business hours (returns open time of next business hours)
  const getNextBusinessHours = () => {
    if (!myShopData?.businessHours) return null;

    const now = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDayIndex = now.getDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Check today first, then next 7 days
    for (let i = 0; i < 8; i++) {
      const checkDayIndex = (currentDayIndex + i) % 7;
      const checkDay = dayNames[checkDayIndex];
      const dayHours = myShopData.businessHours.find((h) => h.day === checkDay);

      if (dayHours && !dayHours.isClosed) {
        let openTime = null;

        if (dayHours.timeSlots && dayHours.timeSlots.length > 0) {
          // Check all time slots for this day
          for (const slot of dayHours.timeSlots) {
            if (slot.is24Hours) {
              // If 24 hours and it's today, skip (already open)
              // If it's a future day, use start of day
              if (i > 0) {
                openTime = "00:00";
                break;
              }
              continue;
            }
            if (slot.openTime) {
              const [openHour, openMin] = slot.openTime.split(":").map(Number);
              const openTimeInMinutes = openHour * 60 + openMin;

              // If it's today and we're before the open time, use this open time
              if (i === 0 && currentTimeInMinutes < openTimeInMinutes) {
                openTime = slot.openTime;
                break;
              }
              // If it's a future day, use the first slot's open time
              if (i > 0) {
                openTime = slot.openTime;
                break;
              }
            }
          }
        } else if (dayHours.openTime) {
          const [openHour, openMin] = dayHours.openTime.split(":").map(Number);
          const openTimeInMinutes = openHour * 60 + openMin;

          // If it's today and we're before the open time, use this open time
          if (i === 0 && currentTimeInMinutes < openTimeInMinutes) {
            openTime = dayHours.openTime;
          } else if (i > 0) {
            openTime = dayHours.openTime;
          }
        }

        if (openTime) {
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + i);
          return {
            date: targetDate,
            time: openTime,
          };
        }
      }
    }

    return null;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string") {
      date = new Date(date);
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Handle close for 1 hour
  const handleClose1Hour = async () => {
    if (!myShopData?._id) return;
    try {
      const now = new Date();
      const reopenTimeDate = new Date(now.getTime() + 60 * 60 * 1000);
      const reopenTime = `${String(reopenTimeDate.getHours()).padStart(
        2,
        "0",
      )}:${String(reopenTimeDate.getMinutes()).padStart(2, "0")}`;

      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime },
        { withCredentials: true },
      );

      await refreshShopData();
      setShowCloseStoreModal(false);
    } catch (error) {}
  };

  // Handle close until next business hours
  const handleCloseUntilNextBusinessHours = async () => {
    if (!myShopData?._id) return;
    try {
      const nextHours = getNextBusinessHours();
      if (!nextHours) {
        toast.error("No business hours found");
        return;
      }

      const reopenTime = nextHours.time;
      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime },
        { withCredentials: true },
      );

      await refreshShopData();
      setShowCloseStoreModal(false);
    } catch (error) {}
  };

  // Handle close until specified date
  const handleCloseUntilDate = async () => {
    if (!myShopData?._id || !selectedDate) return;
    try {
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(23, 59, 59, 999); // Set to end of selected day
      const now = new Date();
      const days = Math.ceil((selectedDateTime - now) / (1000 * 60 * 60 * 24));

      if (days < 1) {
        toast.error("Please select a future date");
        return;
      }

      await axios.post(
        `${serverUrl}/api/shop/close-multiple-days`,
        { shopId: myShopData._id, days },
        { withCredentials: true },
      );

      await refreshShopData();
      setShowCloseStoreModal(false);
      setSelectedDate(null);
    } catch (error) {}
  };

  // Handle cancel/reopen store
  const handleCancelClosure = async () => {
    if (!myShopData?._id) return;
    try {
      // Use temporary-close with current time to immediately reopen
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        (now.getMinutes() + 1) % 60,
      ).padStart(2, "0")}`;

      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime: currentTime },
        { withCredentials: true },
      );

      // Wait a moment then refresh to trigger the closure check
      setTimeout(async () => {
        await refreshShopData();
      }, 1000);

      setShowCancelModal(false);
    } catch (error) {}
  };

  // Get auto accept setting and calculate time
  const getAutoAcceptInfo = () => {
    const autoAccept = localStorage.getItem("autoAcceptOrders") === "true";
    if (!autoAccept || !myShopData?.businessHours) {
      return null;
    }

    // Find today's business hours
    const today = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = dayNames[today.getDay()];

    const todayHours = myShopData.businessHours.find(
      (hours) => hours.day === todayName,
    );

    if (!todayHours || todayHours.isClosed) {
      return null;
    }

    // Get the first time slot's close time
    if (todayHours.timeSlots && todayHours.timeSlots.length > 0) {
      const firstSlot = todayHours.timeSlots[0];
      if (firstSlot.closeTime && !firstSlot.is24Hours) {
        return firstSlot.closeTime;
      }
    } else if (todayHours.closeTime) {
      return todayHours.closeTime;
    }

    return null;
  };

  const autoAcceptUntil = getAutoAcceptInfo();

  // Check if store is open based on business hours, temporary closure, and special holidays
  const storeStatus = useMemo(() => {
    if (!myShopData)
      return {
        isOpen: false,
        isTemporaryClosure: false,
        isSpecialHoliday: false,
      };

    // Check business hours without temporary closure or special holidays
    const businessHoursOnlyStatus = myShopData.businessHours
      ? checkBusinessHours(myShopData.businessHours, null, null)
      : { isOpen: true }; // If no business hours, assume open

    // Check with temporary closure and special holidays
    const statusWithClosure = myShopData.businessHours
      ? checkBusinessHours(
          myShopData.businessHours,
          myShopData.temporaryClosure,
          myShopData.specialHolidays,
        )
      : { isOpen: true };

    // Check if currently in a special holiday period
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isInSpecialHoliday =
      myShopData.specialHolidays &&
      myShopData.specialHolidays.some((holiday) => {
        const startDate = new Date(holiday.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(holiday.endDate);
        endDate.setHours(23, 59, 59, 999);
        return now >= startDate && now <= endDate;
      });

    // Determine if closure is due to temporary closure or special holiday
    // If business hours say open but final status is closed, check if it's temporary closure or special holiday
    const isTemporaryClosure =
      businessHoursOnlyStatus.isOpen === true &&
      statusWithClosure.isOpen === false &&
      myShopData.temporaryClosure?.isClosed === true &&
      !isInSpecialHoliday;

    return {
      ...statusWithClosure,
      isTemporaryClosure,
      isSpecialHoliday: isInSpecialHoliday,
    };
  }, [
    myShopData?.businessHours,
    myShopData?.temporaryClosure,
    myShopData?.specialHolidays,
  ]);

  const isStoreOpen = storeStatus.isOpen;
  const isTemporaryClosure = storeStatus.isTemporaryClosure;

  // Auto-refresh shop data when closure time expires
  useEffect(() => {
    if (!myShopData?.temporaryClosure?.isClosed) {
      return;
    }

    const checkAndRefresh = () => {
      const now = new Date();
      let shouldRefresh = false;

      // Check if closedUntil has passed
      if (myShopData.temporaryClosure.closedUntil) {
        const closedUntil = new Date(myShopData.temporaryClosure.closedUntil);
        if (now.getTime() > closedUntil.getTime()) {
          shouldRefresh = true;
        }
      } else if (myShopData.temporaryClosure.reopenTime) {
        // If only reopenTime is set (shouldn't happen, but handle it)
        const [hour, minute] = myShopData.temporaryClosure.reopenTime
          .split(":")
          .map(Number);
        if (!isNaN(hour) && !isNaN(minute)) {
          const reopenTimeToday = new Date(now);
          reopenTimeToday.setHours(hour, minute, 0, 0);

          // If reopen time has passed today, refresh
          if (now.getTime() >= reopenTimeToday.getTime()) {
            shouldRefresh = true;
          }
        }
      }

      // If closure has expired, refresh immediately
      if (shouldRefresh) {
        refreshShopData();
      }
    };

    // Check immediately
    checkAndRefresh();

    // Set up periodic check every 30 seconds to detect when closure expires
    const interval = setInterval(() => {
      checkAndRefresh();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [
    myShopData?.temporaryClosure?.isClosed,
    myShopData?.temporaryClosure?.closedUntil,
    myShopData?.temporaryClosure?.reopenTime,
    refreshShopData,
  ]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center">
      {!myShopData && (
        <div className="flex justify-center items-center w-full p-4 sm:p-6">
          <div className="w-full max-w-md bg-white shadow-lg rounded-3xl border-none p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col items-center text-center">
              <FaUtensils
                className="w-16 h-16 sm:w-20 sm:h-20 mb-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h2 className="text-xl sm:text-2xl font-bold text-grey-800 mb-2">
                Add Your Restaurant
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Join our food delivery platform and reach thousands of hungry
                customers every day.
              </p>
              <button
                className="text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md transition-colors duration-200 theme-button"
                onClick={() => navigate("/create-edit-shop")}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
      {myShopData && (
        <div className="w-full max-w-7xl flex flex-col items-center gap-6 px-4 sm:px-6 lg:px-8 pt-6">
          <div className="w-full flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {myShopData.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Owner dashboard</p>
            </div>
            <button
              type="button"
              className="shrink-0 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-2xl font-bold hover:bg-white transition-colors"
              onClick={() => navigate("/create-edit-shop")}>
              Edit restaurant
            </button>
          </div>

          {/* Dashboard Section */}
          <div className="w-full">
            {/* Store Status Header */}
            {/* Store Status Header */}
            {isStoreOpen ? (
              <div className="bg-linear-to-r from-primary-green to-primary-green/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-primary-green/20 text-white mb-6 transform transition-all hover:scale-[1.01] border-none">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                    <FaStore size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      Restaurant is Open
                      <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
                    </div>
                    {autoAcceptUntil ? (
                      <div className="text-white/80 text-sm">
                        Auto-accept enabled until {autoAcceptUntil}
                      </div>
                    ) : (
                      <div className="text-white/80 text-sm">
                        Ready to receive orders
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseStore}
                  className="w-full sm:w-auto bg-white text-primary-green px-6 py-2.5 rounded-2xl font-bold hover:bg-primary-green/10 transition-colors shadow-sm">
                  Set Restaurant Closed
                </button>
              </div>
            ) : (
              <div className="bg-linear-to-r from-red-500 to-pink-600 rounded-3xl border-none p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-red-500/20 text-white mb-6">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                    <FaStore size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      Restaurant is Closed
                    </div>
                    <div className="text-white/80 text-sm max-w-md">
                      {storeStatus.isSpecialHoliday ? (
                        <>
                          On Holiday
                          {(() => {
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const activeHoliday =
                              myShopData.specialHolidays?.find((holiday) => {
                                const startDate = new Date(holiday.startDate);
                                startDate.setHours(0, 0, 0, 0);
                                const endDate = new Date(holiday.endDate);
                                endDate.setHours(23, 59, 59, 999);
                                return now >= startDate && now <= endDate;
                              });
                            if (activeHoliday) {
                              return (
                                <>
                                  {" "}
                                  (until{" "}
                                  {formatDate(new Date(activeHoliday.endDate))})
                                </>
                              );
                            }
                            return null;
                          })()}
                        </>
                      ) : myShopData.temporaryClosure?.isClosed === true &&
                        !myShopData.temporaryClosure?.closedUntil &&
                        !myShopData.temporaryClosure?.reopenTime ? (
                        <>Closed by Admin</>
                      ) : isTemporaryClosure ? (
                        <>
                          Temporarily Closed
                          {myShopData.temporaryClosure?.closedUntil && (
                            <>
                              {" "}
                              until{" "}
                              {formatDate(
                                new Date(
                                  myShopData.temporaryClosure.closedUntil,
                                ),
                              )}{" "}
                              {new Date(
                                myShopData.temporaryClosure.closedUntil,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </>
                          )}
                          {!myShopData.temporaryClosure?.closedUntil &&
                            myShopData.temporaryClosure?.reopenTime && (
                              <>
                                {" "}
                                until {myShopData.temporaryClosure.reopenTime}
                              </>
                            )}
                        </>
                      ) : (
                        <>Currently closed (outside business hours)</>
                      )}
                    </div>
                  </div>
                </div>
                {isTemporaryClosure && !storeStatus.isSpecialHoliday && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full sm:w-auto bg-white text-red-600 px-6 py-2.5 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm">
                    Reopen Now
                  </button>
                )}
              </div>
            )}

            {/* Sales and Order Quality Card */}
            {showSales && (
              <div className="bg-white rounded-3xl shadow-lg border-none relative">
                <div className="p-5 sm:p-6">
                  {/* Today's Sales Section */}
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/sales-summary")}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        Today's Sales
                      </h2>
                      <FaChevronRight className="text-gray-400 text-sm" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ฿{todaySales.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          {myShopData && (
            <div className="bg-white shadow-lg rounded-3xl overflow-hidden border-none w-full">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Customer Reviews
                  </h2>
                  {myShopData.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(
                          Math.round(myShopData.rating.average || 0),
                        )}
                      </div>
                      <span className="text-gray-600 font-semibold">
                        {myShopData.rating.average?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  )}
                </div>

                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                      style={{ borderTopColor: "var(--color-primary)" }}></div>
                    <p className="text-gray-600">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="p-4 bg-white rounded-3xl border-none shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-extrabold text-gray-900 truncate">
                              {review.user?.fullName || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {renderStars(review.rating)}
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-gray-700 mt-2 leading-relaxed text-sm">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaStar className="text-gray-300 text-4xl mx-auto mb-2" />
                    <p className="text-gray-700 font-extrabold">
                      No reviews yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Reviews from customers will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Close Store Modal */}
      {showCloseStoreModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform scale-100 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Set Temporary Closure
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage your restaurant's availability
                  </p>
                </div>
                <button
                  onClick={() => setShowCloseStoreModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <FaTimes size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Option 1: Close for 1 hour */}
                <button
                  onClick={handleClose1Hour}
                  className="w-full text-left p-4 border-none rounded-3xl bg-white shadow-sm transition-all group hover:shadow-md"
                  style={{
                    "--hover-bg": "var(--color-primary-bg-light)",
                    "--hover-border": "var(--color-primary-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-bg-light)";
                    e.currentTarget.style.borderColor =
                      "var(--color-primary-border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.borderColor = "";
                  }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                      style={{ color: "var(--color-primary)" }}>
                      <FaClock />
                    </div>
                    <div>
                      <div
                        className="font-bold text-gray-900 transition-colors"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--color-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "")
                        }>
                        Close for 1 Hour
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Until{" "}
                        {(() => {
                          const now = new Date();
                          const reopenTime = new Date(
                            now.getTime() + 60 * 60 * 1000,
                          );
                          return (
                            formatDate(reopenTime) +
                            ", " +
                            reopenTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Close until next business hours */}
                {getNextBusinessHours() && (
                  <button
                    onClick={handleCloseUntilNextBusinessHours}
                    className="w-full text-left p-4 border-none rounded-3xl bg-white shadow-sm transition-all group hover:shadow-md"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-primary-bg-light)";
                      e.currentTarget.style.borderColor =
                        "var(--color-primary-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.borderColor = "";
                    }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                        style={{ color: "var(--color-primary)" }}>
                        <FaStore />
                      </div>
                      <div>
                        <div
                          className="font-bold text-gray-900 transition-colors"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color =
                              "var(--color-primary)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "")
                          }>
                          Until Next Business Day
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Reopen: {formatDate(getNextBusinessHours().date)}{" "}
                          {getNextBusinessHours().time}
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Option 3: Close until specified date */}
                <div className="p-4 border-none rounded-3xl bg-white shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--color-primary-bg-light)",
                        color: "var(--color-primary)",
                      }}>
                      <FaCalendar />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-2">
                        Custom Date
                      </div>
                      <DatePicker
                        onChange={setSelectedDate}
                        value={selectedDate}
                        format="dd/MM/yyyy"
                        minDate={new Date()}
                        className="w-full custom-datepicker"
                        clearIcon={null}
                        calendarIcon={null}
                      />
                      {selectedDate && (
                        <button
                          onClick={handleCloseUntilDate}
                          className="mt-3 w-full text-white px-4 py-2.5 rounded-2xl font-bold transition-all shadow-lg text-sm bg-primary-green hover:bg-primary-green/90">
                          Confirm Closure
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 4: Set special holiday */}
                <button
                  onClick={() => {
                    setShowCloseStoreModal(false);
                    navigate("/set-special-holiday", { state: { from: "/" } });
                  }}
                  className="w-full text-left p-4 border-none rounded-3xl bg-white shadow-sm hover:bg-gray-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors">
                      <FaCloudSun />
                    </div>
                    <div>
                      <div className="font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                        Manage Special Holidays
                      </div>
                      <div className="text-xs text-gray-400">
                        Set long-term closures or holiday hours
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Closure Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100 transition-all">
            <div className="w-16 h-16 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-green">
              <FaStore size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Reopen Restaurant?
            </h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Are you sure you want to reopen <strong>{myShopData.name}</strong>
              ? This will cancel the current temporary closure immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border-none shadow-sm rounded-2xl text-gray-700 font-bold hover:bg-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCancelClosure}
                className="flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors shadow-lg theme-button">
                Yes, Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
