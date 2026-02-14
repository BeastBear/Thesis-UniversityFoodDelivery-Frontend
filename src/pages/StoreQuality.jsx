import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import {
  IoIosArrowRoundBack,
  IoIosArrowBack,
  IoIosArrowForward,
} from "react-icons/io";
import {
  FaInfoCircle,
  FaChartPie,
  FaExclamationCircle,
  FaClock,
  FaShoppingBasket,
  FaStar,
  FaHeadset,
  FaChevronRight,
  FaCheckCircle,
  FaDollarSign,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

function StoreQuality() {
  const navigate = useNavigate();
  const { myOrders } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("lastWeek");
  const [activeTab, setActiveTab] = useState("performance");
  const [weekOffset, setWeekOffset] = useState(0); // For pagination: 0 = most recent 5 weeks

  // Calculate metrics based on selected period or all time for history
  const metrics = useMemo(() => {
    if (!myOrders || !Array.isArray(myOrders)) {
      return {
        readyForDeliveryRate: null, // null means not calculated
        unsuccessfulOrdersRate: 0,
        rating: 0,
        complaints: 0,
        unsuccessfulOrdersBreakdown: [],
        totalOrders: 0,
        successfulOrders: 0,
        ordersWithReadyTime: 0,
        storeCancelledOrders: 0,
        totalSales: 0,
        cashSales: 0,
        ePaymentSales: 0,
        weeklyBreakdown: [],
      };
    }

    // If history tab is active, calculate all-time metrics
    if (activeTab === "history") {
      let totalOrders = 0;
      let successfulOrders = 0;
      let cancelledOrders = 0;
      let ordersWithReadyTime = 0;
      let lostRevenue = 0;
      let totalSales = 0; // Total revenue from delivered orders
      let cashSales = 0; // Cash on delivery (COD) sales from delivered orders
      let ePaymentSales = 0; // E-payment (online) sales from delivered orders
      const unsuccessfulBreakdown = {};
      const weeklyData = {};

      myOrders.forEach((order) => {
        if (!order.createdAt) return;
        const orderDate = new Date(order.createdAt);
        const shopOrder = order.shopOrders?.[0];
        if (!shopOrder) return;

        totalOrders++;

        // Only count sales from DELIVERED orders - orders must be completed/delivered
        // Strictly check status to ensure only delivered orders count
        const orderStatus = shopOrder.status?.toLowerCase()?.trim();
        if (orderStatus === "delivered") {
          successfulOrders++;
          if (shopOrder.readyForDeliveryAt) {
            ordersWithReadyTime++;
          }
          // Add sales ONLY from delivered orders - do NOT count pending, preparing, out of delivery, or cancelled
          if (shopOrder.subtotal) {
            const subtotalAmount = Number(shopOrder.subtotal) || 0;
            totalSales += subtotalAmount;

            // Track by payment method (only for delivered orders)
            const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
            if (paymentMethod === "cod") {
              cashSales += subtotalAmount;
            } else if (paymentMethod === "online") {
              ePaymentSales += subtotalAmount;
            }
          }
        } else if (orderStatus === "cancelled") {
          cancelledOrders++;
          if (shopOrder.subtotal) {
            lostRevenue += shopOrder.subtotal;
          }

          // Group by cancel reason
          const reason = shopOrder.cancelReason || "No reason provided";
          if (!unsuccessfulBreakdown[reason]) {
            unsuccessfulBreakdown[reason] = {
              reason,
              count: 0,
              revenue: 0,
            };
          }
          unsuccessfulBreakdown[reason].count++;
          if (shopOrder.subtotal) {
            unsuccessfulBreakdown[reason].revenue += shopOrder.subtotal;
          }
        }
        // Note: Orders with status "pending", "preparing", "out of delivery" are NOT counted in sales

        // Group by week for weekly breakdown
        // Use local date to avoid timezone issues
        const orderDateLocal = new Date(
          orderDate.getFullYear(),
          orderDate.getMonth(),
          orderDate.getDate(),
        );
        const dayOfWeek = orderDateLocal.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const weekStart = new Date(orderDateLocal);
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Create a consistent week key using YYYY-MM-DD format
        const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            weekStart: new Date(weekStart),
            totalOrders: 0,
            successfulOrders: 0,
            cancelledOrders: 0,
            ordersWithReadyTime: 0,
            sales: 0, // Sales from delivered orders in this week
            cashSales: 0, // Cash sales from delivered orders in this week
            ePaymentSales: 0, // E-payment sales from delivered orders in this week
          };
        }

        weeklyData[weekKey].totalOrders++;

        // Only count sales from DELIVERED orders in weekly breakdown - orders must be completed/delivered
        // Use the same status check as above for consistency
        const weekOrderStatus = shopOrder.status?.toLowerCase()?.trim();
        if (weekOrderStatus === "delivered") {
          weeklyData[weekKey].successfulOrders++;
          if (shopOrder.readyForDeliveryAt) {
            weeklyData[weekKey].ordersWithReadyTime++;
          }
          // Add sales ONLY from delivered orders for this week - do NOT count pending, preparing, out of delivery, or cancelled
          if (shopOrder.subtotal) {
            const subtotalAmount = Number(shopOrder.subtotal) || 0;
            weeklyData[weekKey].sales += subtotalAmount;

            // Track by payment method for weekly breakdown
            const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
            if (paymentMethod === "cod") {
              weeklyData[weekKey].cashSales += subtotalAmount;
            } else if (paymentMethod === "online") {
              weeklyData[weekKey].ePaymentSales += subtotalAmount;
            }
          }
        } else if (weekOrderStatus === "cancelled") {
          weeklyData[weekKey].cancelledOrders++;
        }
        // Note: Orders with status "pending", "preparing", "out of delivery" are NOT counted in weekly sales
      });

      // Find the date range (first order to last order or current date)
      let earliestDate = null;
      let latestDate = new Date(); // Default to today

      myOrders.forEach((order) => {
        if (!order.createdAt) return;
        const orderDate = new Date(order.createdAt);
        if (!earliestDate || orderDate < earliestDate) {
          earliestDate = new Date(orderDate);
        }
      });

      // If no orders, use a default range (last 3 months)
      if (!earliestDate) {
        earliestDate = new Date();
        earliestDate.setMonth(earliestDate.getMonth() - 3);
      }

      // Get Monday of the earliest week
      const earliestWeekStart = new Date(earliestDate);
      const earliestDayOfWeek = earliestWeekStart.getDay();
      const daysToMonday = earliestDayOfWeek === 0 ? 6 : earliestDayOfWeek - 1;
      earliestWeekStart.setDate(earliestWeekStart.getDate() - daysToMonday);
      earliestWeekStart.setHours(0, 0, 0, 0);

      // Get Monday of the current week
      const currentWeekStart = new Date(latestDate);
      const currentDayOfWeek = currentWeekStart.getDay();
      const currentDaysToMonday =
        currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      currentWeekStart.setDate(
        currentWeekStart.getDate() - currentDaysToMonday,
      );
      currentWeekStart.setHours(0, 0, 0, 0);

      // Generate all weeks between earliest and current
      const allWeeks = [];
      const currentWeek = new Date(currentWeekStart);

      while (currentWeek >= earliestWeekStart) {
        const weekKey = `${currentWeek.getFullYear()}-${String(currentWeek.getMonth() + 1).padStart(2, "0")}-${String(currentWeek.getDate()).padStart(2, "0")}`;

        // Use existing data or create empty week
        const weekData = weeklyData[weekKey] || {
          weekStart: new Date(currentWeek),
          totalOrders: 0,
          successfulOrders: 0,
          cancelledOrders: 0,
          ordersWithReadyTime: 0,
          sales: 0,
        };

        allWeeks.push({
          ...weekData,
          readyForDeliveryRate:
            weekData.successfulOrders >= 10 && weekData.successfulOrders > 0
              ? Math.round(
                  (weekData.ordersWithReadyTime / weekData.successfulOrders) *
                    100,
                )
              : null,
          unsuccessfulOrdersRate:
            weekData.successfulOrders + weekData.cancelledOrders > 0
              ? Math.round(
                  (weekData.cancelledOrders /
                    (weekData.successfulOrders + weekData.cancelledOrders)) *
                    100,
                )
              : 0,
        });

        // Move to previous week
        currentWeek.setDate(currentWeek.getDate() - 7);
      }

      // Sort by date (newest first)
      const weeklyBreakdown = allWeeks.sort(
        (a, b) => b.weekStart - a.weekStart,
      );

      const readyForDeliveryRate =
        successfulOrders >= 10 && successfulOrders > 0
          ? Math.round((ordersWithReadyTime / successfulOrders) * 100)
          : successfulOrders < 10
            ? null
            : 0;

      // Unsuccessful Orders Rate: Only count finalized orders (delivered + cancelled)
      // Don't include pending, preparing, or out of delivery orders in the calculation
      const finalizedOrders = successfulOrders + cancelledOrders;
      const unsuccessfulOrdersRate =
        finalizedOrders > 0
          ? Math.round((cancelledOrders / finalizedOrders) * 100)
          : 0;

      const rating = myShopData?.rating?.average || 0;
      const complaints = 0;

      const breakdownArray = Object.values(unsuccessfulBreakdown).sort(
        (a, b) => b.count - a.count,
      );

      return {
        readyForDeliveryRate,
        unsuccessfulOrdersRate,
        rating,
        complaints,
        unsuccessfulOrdersBreakdown: breakdownArray,
        totalOrders,
        successfulOrders,
        cancelledOrders,
        lostRevenue,
        ordersWithReadyTime,
        storeCancelledOrders: cancelledOrders,
        totalSales,
        cashSales,
        ePaymentSales,
        weeklyBreakdown,
        isAllTime: true,
        totalWeeks: weeklyBreakdown.length,
      };
    }

    // Calculate date range based on selected period (for performance tab)
    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === "lastWeek") {
      // Last week (Monday to Sunday)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToMonday - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else if (selectedPeriod === "thisWeek") {
      // This week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }

    let totalOrders = 0;
    let successfulOrders = 0;
    let cancelledOrders = 0;
    let ordersWithReadyTime = 0;
    let lostRevenue = 0;
    let totalSales = 0; // Total revenue from delivered orders
    let cashSales = 0; // Cash on delivery (COD) sales from delivered orders
    let ePaymentSales = 0; // E-payment (online) sales from delivered orders
    const unsuccessfulBreakdown = {};

    myOrders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startDate && orderDate < endDate) {
        const shopOrder = order.shopOrders?.[0];
        if (shopOrder) {
          totalOrders++;

          const orderStatus = shopOrder.status?.toLowerCase()?.trim();
          if (orderStatus === "delivered") {
            successfulOrders++;
            if (shopOrder.readyForDeliveryAt) {
              ordersWithReadyTime++;
            }
            // Only count sales from DELIVERED orders
            if (shopOrder.subtotal) {
              const subtotalAmount = Number(shopOrder.subtotal) || 0;
              totalSales += subtotalAmount;

              // Track by payment method (only for delivered orders)
              const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
              if (paymentMethod === "cod") {
                cashSales += subtotalAmount;
              } else if (paymentMethod === "online") {
                ePaymentSales += subtotalAmount;
              }
            }
          } else if (orderStatus === "cancelled") {
            cancelledOrders++;
            if (shopOrder.subtotal) {
              lostRevenue += shopOrder.subtotal;
            }

            // Group by cancel reason
            const reason = shopOrder.cancelReason || "No reason provided";
            if (!unsuccessfulBreakdown[reason]) {
              unsuccessfulBreakdown[reason] = {
                reason,
                count: 0,
                revenue: 0,
              };
            }
            unsuccessfulBreakdown[reason].count++;
            if (shopOrder.subtotal) {
              unsuccessfulBreakdown[reason].revenue += shopOrder.subtotal;
            }
          }
        }
      }
    });

    // Ready for Delivery Rate: Only calculated if 10+ completed orders
    const readyForDeliveryRate =
      successfulOrders >= 10 && successfulOrders > 0
        ? Math.round((ordersWithReadyTime / successfulOrders) * 100)
        : successfulOrders < 10
          ? null
          : 0; // null means not enough orders

    // Filter out customer-initiated cancellations
    // Only count store cancellations (cancelled by owner via cancel-order endpoint)
    // Customer cancellations typically have reasons like "customer cancelled", "wanting to change items"
    const storeCancelledOrders = cancelledOrders; // All cancellations from owner endpoint are store-initiated

    // Unsuccessful Orders Rate: Only count finalized orders (delivered + cancelled)
    // Don't include pending, preparing, or out of delivery orders in the calculation
    const finalizedOrders = successfulOrders + cancelledOrders;
    const unsuccessfulOrdersRate =
      finalizedOrders > 0
        ? Math.round((storeCancelledOrders / finalizedOrders) * 100)
        : 0;

    const rating = myShopData?.rating?.average || 0;
    const complaints = 0; // TODO: Implement complaints tracking

    const breakdownArray = Object.values(unsuccessfulBreakdown).sort(
      (a, b) => b.count - a.count,
    );

    return {
      readyForDeliveryRate,
      unsuccessfulOrdersRate,
      rating,
      complaints,
      unsuccessfulOrdersBreakdown: breakdownArray,
      totalOrders,
      successfulOrders,
      cancelledOrders: storeCancelledOrders,
      lostRevenue,
      ordersWithReadyTime,
      storeCancelledOrders,
      totalSales,
      cashSales,
      ePaymentSales,
      weeklyBreakdown: [],
      isAllTime: false,
    };
  }, [myOrders, selectedPeriod, myShopData, activeTab]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Reset week offset when switching tabs
  useEffect(() => {
    setWeekOffset(0);
  }, [activeTab]);

  // Calculate pagination for weekly breakdown
  const weeklyPagination = useMemo(() => {
    if (
      activeTab !== "history" ||
      !metrics.weeklyBreakdown ||
      metrics.weeklyBreakdown.length === 0
    ) {
      return null;
    }

    const weeksPerPage = 5;
    const startIndex = weekOffset * weeksPerPage;
    const endIndex = startIndex + weeksPerPage;
    const currentWeeks = metrics.weeklyBreakdown.slice(startIndex, endIndex);
    const totalPages = Math.ceil(metrics.weeklyBreakdown.length / weeksPerPage);
    const currentPage = weekOffset + 1;
    const hasNextPage = endIndex < metrics.weeklyBreakdown.length;
    const hasPrevPage = weekOffset > 0;

    return {
      currentWeeks,
      totalPages,
      currentPage,
      hasNextPage,
      hasPrevPage,
      startIndex,
      endIndex,
      totalWeeks: metrics.weeklyBreakdown.length,
    };
  }, [activeTab, metrics.weeklyBreakdown, weekOffset]);

  const formatDateRange = () => {
    if (activeTab === "history") {
      return "All Time";
    }

    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === "lastWeek") {
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToMonday - 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToMonday);
      endDate = new Date(now);
    }

    const formatDate = (date) => {
      const day = date.getDate();
      const monthNames = [
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
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear() % 100;
      return `${day} ${month} ${year}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatWeekDate = (date) => {
    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const monthNames = [
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
    return `${date.getDate()} ${monthNames[date.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear() % 100}`;
  };

  const getStatusColor = (value, target, isReverse = false) => {
    if (isReverse) {
      return value <= target ? "text-green-600" : "text-red-600";
    }
    return value >= target ? "text-green-600" : "text-red-600";
  };

  const getStatusDot = (value, target, isReverse = false) => {
    if (isReverse) {
      return value <= target ? (
        <span className="text-green-500">●</span>
      ) : (
        <span className="text-red-500">●</span>
      );
    }
    return value >= target ? (
      <span className="text-green-500">●</span>
    ) : (
      <span className="text-red-500">●</span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="#FF6B00" />
      </div>
    );
  }

  const handlePrevPeriod = () => {
    // Logic to go to previous period
    if (selectedPeriod === "thisWeek") {
      setSelectedPeriod("lastWeek");
    }
  };

  const handleNextPeriod = () => {
    // Logic to go to next period
    if (selectedPeriod === "lastWeek") {
      setSelectedPeriod("thisWeek");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Gradient Header */}
      <div className="bg-gradient-to-b from-orange-100 to-white relative overflow-hidden">
        <div className="relative z-10">
          {/* Back Button */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <button className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium">
              Learn More
            </button>
          </div>

          {/* Title Section */}
          <div className="px-4 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Maintain Store Quality to Impress Customers
            </h1>
            <p className="text-base text-gray-700">
              View Store Performance This Week!
            </p>
          </div>
        </div>

        {/* Mascot Bear Illustration Placeholder */}
        <div className="absolute right-4 top-16 opacity-20">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <span className="text-4xl">🐻</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 py-4 text-center font-medium relative ${
              activeTab === "performance"
                ? "text-primary-orange"
                : "text-gray-500"
            }`}>
            Store Performance
            {activeTab === "performance" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-orange"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 text-center font-medium relative ${
              activeTab === "history" ? "text-primary-orange" : "text-gray-500"
            }`}>
            Store Performance History
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-orange"></div>
            )}
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      {activeTab === "performance" && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevPeriod}
              className="p-2 hover:bg-gray-100 rounded-full">
              <IoIosArrowBack size={20} className="text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {formatDateRange()}
            </span>
            <button
              onClick={handleNextPeriod}
              className="p-2 hover:bg-gray-100 rounded-full">
              <IoIosArrowForward size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">All Time</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Key Metrics Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Ready for Delivery Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaClock
                  className={`text-lg ${
                    metrics.readyForDeliveryRate !== null &&
                    metrics.readyForDeliveryRate >= 70
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  Ready for Delivery
                </span>
              </div>
              <FaChevronRight className="text-gray-400 text-sm" />
            </div>
            <div
              className={`text-3xl font-bold mb-1 ${
                metrics.readyForDeliveryRate === null
                  ? "text-gray-400"
                  : metrics.readyForDeliveryRate >= 70
                    ? "text-green-600"
                    : "text-red-600"
              }`}>
              {metrics.readyForDeliveryRate === null
                ? "N/A"
                : `${metrics.readyForDeliveryRate}%`}
            </div>
            <div className="flex items-center gap-1.5">
              {metrics.readyForDeliveryRate !== null &&
              metrics.readyForDeliveryRate >= 70 ? (
                <>
                  <FaCheckCircle className="text-green-500 text-xs" />
                  <span className="text-xs text-green-600">Target: 70%</span>
                </>
              ) : (
                <>
                  <FaExclamationCircle className="text-red-500 text-xs" />
                  <span className="text-xs text-red-600">Target: 70%</span>
                </>
              )}
            </div>
          </div>

          {/* Unsuccessful Orders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaShoppingBasket
                  className={`text-lg ${
                    metrics.unsuccessfulOrdersRate <= 2
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  Unsuccessful Orders
                </span>
              </div>
              <FaChevronRight className="text-gray-400 text-sm" />
            </div>
            <div
              className={`text-3xl font-bold mb-1 ${
                metrics.unsuccessfulOrdersRate <= 2
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
              {metrics.unsuccessfulOrdersRate}%
            </div>
            <div className="flex items-center gap-1.5">
              {metrics.unsuccessfulOrdersRate <= 2 ? (
                <>
                  <FaCheckCircle className="text-green-500 text-xs" />
                  <span className="text-xs text-green-600">
                    Target: Not exceeding 2%
                  </span>
                </>
              ) : (
                <>
                  <FaExclamationCircle className="text-red-500 text-xs" />
                  <span className="text-xs text-red-600">
                    Target: Not exceeding 2%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Reviews Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaStar className="text-lg text-green-500" />
                <span className="text-sm font-medium text-gray-900">
                  Reviews
                </span>
              </div>
              <FaChevronRight className="text-gray-400 text-sm" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-3xl font-bold ${
                  metrics.rating >= 4.7 ? "text-green-600" : "text-red-600"
                }`}>
                {metrics.rating.toFixed(1)}
              </span>
              <FaStar className="text-yellow-400 text-lg" />
            </div>
            <div className="flex items-center gap-1.5">
              {metrics.rating >= 4.7 ? (
                <>
                  <FaCheckCircle className="text-green-500 text-xs" />
                  <span className="text-xs text-green-600">
                    Target: 4.7 or higher
                  </span>
                </>
              ) : (
                <>
                  <FaExclamationCircle className="text-red-500 text-xs" />
                  <span className="text-xs text-red-600">
                    Target: 4.7 or higher
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Complaints Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaHeadset
                  className={`text-lg ${
                    metrics.complaints === 0 ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  Complaints
                </span>
              </div>
              <FaChevronRight className="text-gray-400 text-sm" />
            </div>
            <div
              className={`text-3xl font-bold mb-1 ${
                metrics.complaints === 0 ? "text-green-600" : "text-red-600"
              }`}>
              {metrics.complaints}
            </div>
            <div className="flex items-center gap-1.5">
              {metrics.complaints === 0 ? (
                <>
                  <FaCheckCircle className="text-green-500 text-xs" />
                  <span className="text-xs text-green-600">
                    Target: 0 orders
                  </span>
                </>
              ) : (
                <>
                  <FaExclamationCircle className="text-red-500 text-xs" />
                  <span className="text-xs text-red-600">Target: 0 orders</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Breakdown for History Tab */}
        {weeklyPagination && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Weekly Performance Breakdown
              </h2>
              <span className="text-sm text-gray-500">
                Page {weeklyPagination.currentPage} of{" "}
                {weeklyPagination.totalPages}
              </span>
            </div>
            <div className="space-y-4">
              {weeklyPagination.currentWeeks.map((week, index) => (
                <div
                  key={`${week.weekStart.getTime()}-${index}`}
                  className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {formatWeekDate(week.weekStart)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {week.totalOrders} orders
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-gray-600">
                        Ready for Delivery
                      </span>
                      <div className="text-lg font-semibold text-gray-900">
                        {week.readyForDeliveryRate !== null
                          ? `${week.readyForDeliveryRate}%`
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">
                        Unsuccessful Orders
                      </span>
                      <div
                        className={`text-lg font-semibold ${
                          week.unsuccessfulOrdersRate <= 2
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                        {week.unsuccessfulOrdersRate}%
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Total Sales</span>
                      <div className="text-lg font-semibold text-green-600">
                        ฿{(week.sales || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                disabled={!weeklyPagination.hasPrevPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  weeklyPagination.hasPrevPage
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-white text-gray-400 cursor-not-allowed"
                }`}>
                <IoIosArrowBack className="inline mr-1" />
                Previous 5 weeks
              </button>
              <span className="text-sm text-gray-600">
                Showing {weeklyPagination.startIndex + 1}-
                {Math.min(
                  weeklyPagination.endIndex,
                  weeklyPagination.totalWeeks,
                )}{" "}
                of {weeklyPagination.totalWeeks} weeks
              </span>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                disabled={!weeklyPagination.hasNextPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  weeklyPagination.hasNextPage
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-white text-gray-400 cursor-not-allowed"
                }`}>
                Next 5 weeks
                <IoIosArrowForward className="inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Unsuccessful Orders Breakdown */}
        {metrics.unsuccessfulOrdersBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Unsuccessful Orders Breakdown
            </h2>
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FaChartPie className="text-gray-400" />
                <span>
                  {metrics.unsuccessfulOrdersBreakdown.length} Reasons
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {metrics.unsuccessfulOrdersBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.reason}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.count} orders • ฿{item.revenue.toFixed(2)} lost
                      revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total Lost Revenue
                </span>
                <span className="text-lg font-bold text-red-600">
                  ฿{metrics.lostRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Indicator Explanations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 mt-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-4">
                Store Quality Indicators Explained
              </h3>

              {/* Ready for Delivery */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  Ready for Delivery Rate
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  The rate of pressing the "Ready for Delivery" button compared
                  to the number of successful orders in the past 7 days.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Orders completed 10 or more
                      orders
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-sm text-gray-700">
                      <strong>Not Counted:</strong> Orders completed less than
                      10 orders
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Calculated when there are 10 or more successful orders.
                </p>
              </div>

              {/* Unsuccessful Orders */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  Order Cancellation or Rejection Rate
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  The rate of orders cancelled or rejected due to store reasons
                  in the past 7 days.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Store did not accept order
                      within specified time
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Store cancelled order due to
                      food being out of stock
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Store could not prepare food
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-sm text-gray-700">
                      <strong>Not Counted:</strong> Customer cancelled order
                      (e.g., wanting to change product items)
                    </span>
                  </div>
                </div>
              </div>

              {/* Complaints */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Complaints</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Customer complaint cases in the past 7 days.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Finding hair/foreign objects in
                      food box
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      <strong>Counted:</strong> Store delivered incorrect
                      quantity of food
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="text-sm text-gray-700">
                      <strong>Not Counted:</strong> Food taste issues (e.g., too
                      salty, too spicy)
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Rating</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Average rating on the app.
                </p>
                <p className="text-sm text-gray-700">
                  Rating that customers see on the app page.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Store quality indicators are displayed weekly and scores reset
              every Monday. Data last updated{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 px-2">
          <FaInfoCircle className="text-gray-400 mt-0.5" />
          <span>
            Data last updated{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            and only available for stores that can view this data
          </span>
        </div>
      </div>
    </div>
  );
}

export default StoreQuality;
