import React, { useState, useMemo, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils, FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineClipboardCopy } from "react-icons/hi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "react-toastify";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";

function IncomeSummary() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState("daily"); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [incomeData, setIncomeData] = useState({
    netIncome: 0,
    completedOrders: 0,
    previousPeriodIncome: 0,
  });
  const [completedOrdersList, setCompletedOrdersList] = useState([]);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate date list for horizontal scrolling (for daily view)
  const generateDateList = () => {
    const dates = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison

    // Show 7 days before and today (no future dates)
    for (let i = -7; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dateList = useMemo(() => generateDateList(), []);

  // Format date for display
  const formatDateDisplay = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return { dayName, day, month };
  };

  // Calculate date range based on selected tab and date
  const dateRange = useMemo(() => {
    const date = new Date(selectedDate);
    let startDate, endDate;

    if (selectedTab === "daily") {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedTab === "weekly") {
      // Get the start of the week (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startDate = new Date(date.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedTab === "monthly") {
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }, [selectedTab, selectedDate]);

  // Fetch income data
  useEffect(() => {
    const fetchIncomeData = async () => {
      if (!userData) return;

      setLoading(true);
      try {
        // Fetch all orders and filter by date range
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });

        const orders = result.data || [];
        let totalIncome = 0;
        let completedCount = 0;
        const processedOrderIds = new Set();
        const completedOrders = [];

        orders.forEach((order) => {
          if (!order.shopOrders) return;

          // Filter: Only include orders with online payment methods (exclude COD)
          const paymentMethod = String(order.paymentMethod || "").toLowerCase();
          const isOnlinePayment = ["online", "promptpay", "card"].includes(
            paymentMethod,
          );

          if (!isOnlinePayment) return; // Skip COD orders

          order.shopOrders.forEach((shopOrder) => {
            if (
              shopOrder.assignedDeliveryBoy?.toString() ===
                userData._id?.toString() &&
              shopOrder.status === "delivered" &&
              shopOrder.deliveredAt
            ) {
              const deliveredDate = new Date(shopOrder.deliveredAt);
              if (
                deliveredDate >= dateRange.startDate &&
                deliveredDate <= dateRange.endDate
              ) {
                completedCount++;
                // Add delivery fee only once per order
                if (!processedOrderIds.has(order._id.toString())) {
                  totalIncome += order.deliveryFee || 0;
                  processedOrderIds.add(order._id.toString());
                  // Store order for list display
                  completedOrders.push({
                    ...order,
                    shopOrder,
                  });
                }
              }
            }
          });
        });

        // Sort orders by delivered date (newest first)
        completedOrders.sort((a, b) => {
          const dateA = new Date(a.shopOrder.deliveredAt);
          const dateB = new Date(b.shopOrder.deliveredAt);
          return dateB - dateA;
        });

        setCompletedOrdersList(completedOrders);
        setIncomeData({
          netIncome: totalIncome,
          completedOrders: completedCount,
          previousPeriodIncome: 0, // Will be calculated below
        });

        // Calculate previous period income for comparison
        let previousStartDate, previousEndDate;
        if (selectedTab === "daily") {
          previousStartDate = new Date(selectedDate);
          previousStartDate.setDate(selectedDate.getDate() - 1);
          previousStartDate.setHours(0, 0, 0, 0);
          previousEndDate = new Date(previousStartDate);
          previousEndDate.setHours(23, 59, 59, 999);
        } else if (selectedTab === "weekly") {
          previousStartDate = new Date(dateRange.startDate);
          previousStartDate.setDate(dateRange.startDate.getDate() - 7);
          previousEndDate = new Date(dateRange.endDate);
          previousEndDate.setDate(dateRange.endDate.getDate() - 7);
        } else if (selectedTab === "monthly") {
          previousStartDate = new Date(dateRange.startDate);
          previousStartDate.setMonth(dateRange.startDate.getMonth() - 1);
          previousEndDate = new Date(dateRange.endDate);
          previousEndDate.setMonth(dateRange.endDate.getMonth() - 1);
        }

        // Fetch previous period data
        if (previousStartDate && previousEndDate) {
          const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
            withCredentials: true,
          });

          const orders = result.data || [];
          let previousIncome = 0;
          const processedOrderIds = new Set();

          orders.forEach((order) => {
            if (!order.shopOrders) return;

            // Filter: Only include orders with online payment methods (exclude COD)
            const paymentMethod = String(
              order.paymentMethod || "",
            ).toLowerCase();
            const isOnlinePayment = ["online", "promptpay", "card"].includes(
              paymentMethod,
            );

            if (!isOnlinePayment) return; // Skip COD orders

            order.shopOrders.forEach((shopOrder) => {
              if (
                shopOrder.assignedDeliveryBoy?.toString() ===
                  userData._id?.toString() &&
                shopOrder.status === "delivered" &&
                shopOrder.deliveredAt
              ) {
                const deliveredDate = new Date(shopOrder.deliveredAt);
                if (
                  deliveredDate >= previousStartDate &&
                  deliveredDate <= previousEndDate
                ) {
                  if (!processedOrderIds.has(order._id.toString())) {
                    previousIncome += order.deliveryFee || 0;
                    processedOrderIds.add(order._id.toString());
                  }
                }
              }
            });
          });

          setIncomeData((prev) => ({
            ...prev,
            previousPeriodIncome: previousIncome,
          }));
        }
      } catch (error) {
        setIncomeData({
          netIncome: 0,
          completedOrders: 0,
          previousPeriodIncome: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeData();
  }, [userData, selectedTab, selectedDate, dateRange]);

  // Calculate difference from previous period
  const incomeDifference = useMemo(() => {
    if (incomeData.previousPeriodIncome === 0 && incomeData.netIncome === 0) {
      return 0.0;
    }
    if (incomeData.previousPeriodIncome === 0) {
      return null; // Infinite increase
    }
    return incomeData.netIncome - incomeData.previousPeriodIncome;
  }, [incomeData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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
    const year = date.getFullYear() % 100; // Last 2 digits
    return `${month} ${day}, ${year}`;
  };

  const copyOrderId = (orderId) => {
    navigator.clipboard
      .writeText(orderId)
      .then(() => {
        toast.success("Order ID copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  };

  if (userData?.role !== "deliveryBoy") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">
          This page is only available for deliverers.
        </p>
      </div>
    );
  }

  return (
    <DeliveryLayout>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER FINANCE"
          title="Income Summary"
          description="Track your earnings by day, week, and month."
          icon={<FaFileInvoiceDollar size={20} />}
          onBack={() => navigate(-1)}
        />

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-100">
            <button
              onClick={() => setSelectedTab("daily")}
              className={`pb-3 px-2 text-base font-extrabold transition-colors ${
                selectedTab === "daily"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500"
              }`}>
              Daily
            </button>
            <button
              onClick={() => setSelectedTab("weekly")}
              className={`pb-3 px-2 text-base font-extrabold transition-colors ${
                selectedTab === "weekly"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500"
              }`}>
              Weekly
            </button>
            <button
              onClick={() => setSelectedTab("monthly")}
              className={`pb-3 px-2 text-base font-extrabold transition-colors ${
                selectedTab === "monthly"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500"
              }`}>
              Monthly
            </button>
          </div>

          {/* Date Selector (for daily view) */}
          {selectedTab === "daily" && (
            <div className="mb-6 overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {dateList.map((date, index) => {
                  const { dayName, day, month } = formatDateDisplay(date);
                  const isSelected =
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(new Date(date))}
                      className={`flex flex-col items-center px-4 py-2 rounded-2xl min-w-[74px] transition-colors border ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-white text-slate-600 border-slate-100"
                      }`}>
                      <span className="text-xs mb-1">{dayName}</span>
                      <span className="text-sm font-extrabold">
                        {day} {month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week/Month Selector */}
          {(selectedTab === "weekly" || selectedTab === "monthly") && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    if (selectedTab === "weekly") {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1);
                    }
                    setSelectedDate(newDate);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-2xl">
                  <IoIosArrowRoundBack size={20} className="text-gray-600" />
                </button>
                <span className="text-base font-extrabold text-slate-900">
                  {selectedTab === "weekly"
                    ? `Week of ${formatDateDisplay(dateRange.startDate).day} ${formatDateDisplay(dateRange.startDate).month}`
                    : `${formatDateDisplay(dateRange.startDate).month} ${dateRange.startDate.getFullYear()}`}
                </span>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    if (selectedTab === "weekly") {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1);
                    }
                    // Don't allow future dates
                    const today = new Date();
                    if (newDate <= today) {
                      setSelectedDate(newDate);
                    }
                  }}
                  className="p-2 hover:bg-slate-100 rounded-2xl transform rotate-180">
                  <IoIosArrowRoundBack size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Income Summary Card */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-6">
              <div className="mb-4">
                <h2 className="text-xs font-black tracking-[0.14em] text-slate-500 mb-2">
                  NET INCOME
                </h2>
                <div className="text-4xl font-extrabold text-blue-600 mb-2">
                  ฿{incomeData.netIncome.toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">
                  ={" "}
                  {incomeDifference !== null
                    ? incomeDifference.toFixed(1)
                    : "0.0"}{" "}
                  from{" "}
                  {selectedTab === "daily"
                    ? "previous day"
                    : selectedTab === "weekly"
                      ? "previous week"
                      : "previous month"}
                </div>
              </div>

              <div
                onClick={() => setShowOrdersList(!showOrdersList)}
                className="bg-slate-50 rounded-2xl p-4 mt-4 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100">
                <div className="text-base font-extrabold text-slate-900 mb-1">
                  {incomeData.completedOrders} completed orders
                </div>
                <div className="text-xs text-slate-500">
                  {selectedTab === "daily"
                    ? "Counted from orders completed between 0:00 – 23:59 of the day"
                    : selectedTab === "weekly"
                      ? "Counted from orders completed during the week"
                      : "Counted from orders completed during the month"}
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {showOrdersList && completedOrdersList.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">
                Completed Orders
              </h3>
              {completedOrdersList.map((order) => {
                const orderId = order._id ? order._id : "";
                const shopName = order.shopOrder?.shop?.name || "Restaurant";
                const deliveryAddress =
                  order.deliveryAddress?.text || "Delivery destination";
                const deliveryFee = order.deliveryFee || 0;
                const orderDate = formatDate(
                  order.shopOrder?.deliveredAt || order.createdAt,
                );

                return (
                  <div
                    key={order._id}
                    onClick={() =>
                      navigate(`/delivery-order-detail/${order._id}`)
                    }
                    className="bg-white border border-slate-100 rounded-3xl p-4 cursor-pointer hover:shadow-md transition-shadow">
                    {/* Top row: Food Delivery badge, date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-extrabold">
                          <FaUtensils size={10} />
                          Food Delivery
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {orderDate}
                      </span>
                    </div>

                    {/* Restaurant name with green pin */}
                    <div className="flex items-center gap-2 mb-2">
                      <FaMapMarkerAlt className="text-blue-600" size={14} />
                      <span className="text-sm font-extrabold text-slate-900">
                        {shopName}
                      </span>
                    </div>

                    {/* Delivery destination with red pin */}
                    <div className="flex items-center gap-2 mb-3">
                      <FaMapMarkerAlt className="text-red-600" size={14} />
                      <span className="text-sm text-slate-700">
                        {deliveryAddress}
                      </span>
                      <span className="ml-auto inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-extrabold">
                        ฿{deliveryFee.toFixed(2)}
                      </span>
                    </div>

                    {/* Order ID with copy button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-slate-500 font-mono">
                        {orderId}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyOrderId(orderId);
                        }}
                        className="text-blue-600 text-xs font-extrabold hover:text-blue-700 flex items-center gap-1"
                        onMouseDown={(e) => e.stopPropagation()}>
                        <HiOutlineClipboardCopy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DeliveryLayout>
  );
}

export default IncomeSummary;
