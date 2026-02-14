import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyOrders } from "../redux/userSlice";
import { setMyShopData } from "../redux/ownerSlice";
import { toast } from "react-toastify";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { FaWallet } from "react-icons/fa";

function SalesSummary() {
  const { userData, myOrders } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const dispatch = useDispatch();

  const [selectedPeriod, setSelectedPeriod] = useState("today"); // today, 7days, 30days, custom
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Refresh orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(result.data));
      } catch (error) {}
    };
    const fetchShopData = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });
        dispatch(setMyShopData(result.data));
      } catch (error) {}
    };
    if (userData?.role === "owner") {
      fetchOrders();
      fetchShopData();
    }
  }, [userData, dispatch]);

  // Calculate wallet balance according to business rules:
  // Wallet Balance = Sum of all Shop Earnings (from delivered orders) - Completed Payouts - Pending Payouts
  // Shop Earnings = foodPrice - Platform Income = foodPrice * (1 - gpRate)
  useEffect(() => {
    const calculateWalletBalance = async () => {
      if (!myOrders || !myShopData || userData?.role !== "owner") {
        setWalletBalance(0);
        return;
      }

      try {
        // Fetch commission rate from system settings
        const settingsResponse = await axios.get(`${serverUrl}/api/settings`, {
          withCredentials: true,
        });
        const commissionPercentage = Number(
          settingsResponse.data?.commissionPercentage ?? 0,
        );
        const gpRate = Number.isFinite(commissionPercentage)
          ? Math.min(Math.max(commissionPercentage, 0), 100) / 100
          : 0;

        // Calculate total shop earnings from all delivered orders
        let totalShopEarnings = 0;
        myOrders.forEach((order) => {
          const shopOrder = order.shopOrders?.find((so) => {
            const shopId = so.shop?._id || so.shop;
            return shopId?.toString() === myShopData._id.toString();
          });

          if (shopOrder) {
            const status = shopOrder.status?.toLowerCase()?.trim();
            if (status === "delivered" && shopOrder.subtotal) {
              const foodPrice = Number(shopOrder.subtotal) || 0;
              const platformIncome = Math.round(foodPrice * gpRate * 100) / 100;
              const shopEarnings =
                Math.round((foodPrice - platformIncome) * 100) / 100;
              totalShopEarnings += shopEarnings;
            }
          }
        });

        // Calculate total completed payouts (paid status only)
        let totalCompletedPayouts = 0;
        if (myShopData?.payouts && Array.isArray(myShopData.payouts)) {
          myShopData.payouts.forEach((payout) => {
            if (payout.status === "paid") {
              totalCompletedPayouts += Number(payout.amount) || 0;
            }
          });
        }

        // Calculate pending payouts
        let pendingPayouts = 0;
        if (myShopData?.payouts && Array.isArray(myShopData.payouts)) {
          myShopData.payouts.forEach((payout) => {
            if (payout.status === "pending" || payout.status === "in_transit") {
              pendingPayouts += Number(payout.amount) || 0;
            }
          });
        }

        const netWalletBalance = Math.max(
          0,
          totalShopEarnings - totalCompletedPayouts,
        );
        const availableWalletBalance = Math.max(
          0,
          netWalletBalance - pendingPayouts,
        );
        setWalletBalance(availableWalletBalance);
      } catch (error) {
        setWalletBalance(0);
      }
    };

    calculateWalletBalance();
  }, [myOrders, myShopData, userData]);

  // Filter orders for this owner's shop
  const ownerOrders = useMemo(() => {
    if (!myOrders || userData?.role !== "owner") return [];

    return myOrders
      .filter(
        (order) =>
          order && order._id && order.shopOrders && order.shopOrders.length > 0,
      )
      .map((order) => {
        const shopOrder = order.shopOrders[0];
        return {
          ...order,
          shopOrder,
        };
      });
  }, [myOrders, userData]);

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === "today") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === "7days") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === "30days") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (
      selectedPeriod === "custom" &&
      customStartDate &&
      customEndDate
    ) {
      // Custom date range shows data from start date to end date
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return ownerOrders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });
  }, [ownerOrders, dateRange]);

  // Calculate sales metrics
  const salesMetrics = useMemo(() => {
    let totalSales = 0;
    let cashSales = 0;
    let ePaymentSales = 0;
    let totalOrders = 0;
    let previousPeriodSales = 0;

    // Calculate sales for selected period (only delivered orders)
    filteredOrders.forEach((order) => {
      const orderStatus = order.shopOrder?.status?.toLowerCase()?.trim();
      if (orderStatus === "delivered" && order.shopOrder?.subtotal) {
        const amount = Number(order.shopOrder.subtotal) || 0;
        totalSales += amount;
        totalOrders++;

        const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
        if (paymentMethod === "cod") {
          cashSales += amount;
        } else if (paymentMethod === "online") {
          ePaymentSales += amount;
        }
      }
    });

    // Calculate previous period sales for comparison (rolling periods from today)
    // Previous period should be the immediately preceding period of the same duration
    // Example: If current period is "10 Jan - 16 Jan" (7 days), compare with "3 Jan - 9 Jan" (previous 7 days)
    const now = new Date();
    let previousPeriodStart, previousPeriodEnd;

    if (selectedPeriod === "7days") {
      // Current period: last 7 days (today - 6 days to today, inclusive)
      // Previous period: the 7 days immediately before that (today - 13 days to today - 7 days)
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(now.getDate() - 7); // End of previous period (7 days ago)
      previousPeriodEnd.setHours(23, 59, 59, 999);

      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodEnd.getDate() - 6); // Start of previous period (13 days ago)
      previousPeriodStart.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === "30days") {
      // Current period: last 30 days (today - 29 days to today, inclusive)
      // Previous period: the 30 days immediately before that (today - 59 days to today - 30 days)
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(now.getDate() - 30); // End of previous period (30 days ago)
      previousPeriodEnd.setHours(23, 59, 59, 999);

      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodEnd.getDate() - 29); // Start of previous period (59 days ago)
      previousPeriodStart.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === "today") {
      // For today, compare to yesterday
      previousPeriodStart = new Date(now);
      previousPeriodStart.setDate(now.getDate() - 1);
      previousPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodEnd = new Date(previousPeriodStart);
      previousPeriodEnd.setHours(23, 59, 59, 999);
    } else {
      // For custom periods, no comparison
      previousPeriodStart = null;
      previousPeriodEnd = null;
    }

    // Calculate previous period sales
    if (previousPeriodStart && previousPeriodEnd) {
      ownerOrders.forEach((order) => {
        if (!order.createdAt) return;
        const orderDate = new Date(order.createdAt);
        if (
          orderDate >= previousPeriodStart &&
          orderDate <= previousPeriodEnd
        ) {
          const orderStatus = order.shopOrder?.status?.toLowerCase()?.trim();
          if (orderStatus === "delivered" && order.shopOrder?.subtotal) {
            previousPeriodSales += Number(order.shopOrder.subtotal) || 0;
          }
        }
      });
    }

    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate percentage change
    let salesChange = null;
    let comparisonText = "";
    let hasComparison = false; // Track if we have valid comparison data

    if (selectedPeriod === "today") {
      comparisonText = "yesterday";
      hasComparison = true;
      if (previousPeriodSales > 0) {
        salesChange = parseFloat(
          (
            ((totalSales - previousPeriodSales) / previousPeriodSales) *
            100
          ).toFixed(1),
        );
      } else if (totalSales === 0 && previousPeriodSales === 0) {
        salesChange = 0.0; // Both are 0
      }
      // If previous was 0 but current has sales, salesChange stays null (infinite increase)
    } else if (selectedPeriod === "7days") {
      comparisonText = "last 7 days";
      hasComparison = true;
      // Always calculate percentage if we have comparison data
      if (previousPeriodSales > 0) {
        salesChange = parseFloat(
          (
            ((totalSales - previousPeriodSales) / previousPeriodSales) *
            100
          ).toFixed(1),
        );
      } else if (previousPeriodSales === 0 && totalSales === 0) {
        salesChange = 0.0; // Both are 0
      } else if (previousPeriodSales === 0 && totalSales > 0) {
        // Previous had no sales, current has sales - show positive infinity as +100%
        salesChange = 100.0;
      }
    } else if (selectedPeriod === "30days") {
      comparisonText = "last 30 days";
      hasComparison = true;
      // Always calculate percentage if we have comparison data
      if (previousPeriodSales > 0) {
        salesChange = parseFloat(
          (
            ((totalSales - previousPeriodSales) / previousPeriodSales) *
            100
          ).toFixed(1),
        );
      } else if (previousPeriodSales === 0 && totalSales === 0) {
        salesChange = 0.0; // Both are 0
      } else if (previousPeriodSales === 0 && totalSales > 0) {
        // Previous had no sales, current has sales - show positive infinity as +100%
        salesChange = 100.0;
      }
    }

    return {
      totalSales,
      cashSales,
      ePaymentSales,
      totalOrders,
      averageOrder,
      previousPeriodSales,
      salesChange,
      comparisonText,
      hasComparison,
    };
  }, [filteredOrders, ownerOrders, selectedPeriod]);

  // Calculate best-selling products
  const bestSellingProducts = useMemo(() => {
    const productMap = {}; // { itemName: { quantity: number, revenue: number } }

    // Count products from delivered orders only
    filteredOrders.forEach((order) => {
      const orderStatus = order.shopOrder?.status?.toLowerCase()?.trim();
      if (orderStatus !== "delivered") return;

      const shopOrderItems = order.shopOrder?.shopOrderItems || [];
      shopOrderItems.forEach((item) => {
        if (!item.name) return;

        const itemName = item.name;
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const revenue = quantity * price;

        if (productMap[itemName]) {
          productMap[itemName].quantity += quantity;
          productMap[itemName].revenue += revenue;
        } else {
          productMap[itemName] = {
            quantity: quantity,
            revenue: revenue,
          };
        }
      });
    });

    // Convert to array and sort by quantity (descending)
    const productsArray = Object.entries(productMap).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
    }));

    return productsArray.sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  const formatDate = (date) => {
    const d = new Date(date);
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
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateRange = () => {
    // Check if start and end dates are on the same day
    const startDay = dateRange.startDate.getDate();
    const startMonth = dateRange.startDate.getMonth();
    const startYear = dateRange.startDate.getFullYear();

    const endDay = dateRange.endDate.getDate();
    const endMonth = dateRange.endDate.getMonth();
    const endYear = dateRange.endDate.getFullYear();

    const isSameDay =
      startDay === endDay && startMonth === endMonth && startYear === endYear;

    if (isSameDay) {
      return formatDate(dateRange.startDate);
    } else {
      return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
    }
  };

  const formatDateShort = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error("Please enter a valid payout amount");
      return;
    }

    if (parseFloat(payoutAmount) > walletBalance) {
      toast.error(
        `Insufficient wallet balance. Available: ฿${walletBalance.toFixed(2)}`,
      );
      return;
    }

    // Check if bank account is set up
    if (
      !myShopData?.ePaymentAccount?.accountNumber ||
      !myShopData?.ePaymentAccount?.bank
    ) {
      toast.error("Please set up your bank account information first.");
      return;
    }

    setPayoutLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/shop/request-payout`,
        {
          amount: parseFloat(payoutAmount),
        },
        { withCredentials: true },
      );

      toast.success("Payout request submitted successfully!");
      setShowPayoutModal(false);
      setPayoutAmount("");

      // Refresh shop data and orders
      const shopResponse = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(shopResponse.data));

      const ordersResponse = await axios.get(
        `${serverUrl}/api/order/my-orders`,
        {
          withCredentials: true,
        },
      );
      dispatch(setMyOrders(ordersResponse.data));
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit payout request. Please try again.";
      toast.error(errorMessage);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (userData?.role !== "owner") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">
          This page is only available for shop owners.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Period Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedPeriod("today")}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedPeriod === "today"
                ? "text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-100"
            }`}
            style={
              selectedPeriod === "today"
                ? {
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (selectedPeriod !== "today")
                e.currentTarget.style.borderColor =
                  "var(--color-primary-border)";
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== "today")
                e.currentTarget.style.borderColor = "";
            }}>
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod("7days")}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedPeriod === "7days"
                ? "text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-100"
            }`}
            style={
              selectedPeriod === "7days"
                ? {
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (selectedPeriod !== "7days")
                e.currentTarget.style.borderColor =
                  "var(--color-primary-border)";
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== "7days")
                e.currentTarget.style.borderColor = "";
            }}>
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod("30days")}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedPeriod === "30days"
                ? "text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-100"
            }`}
            style={
              selectedPeriod === "30days"
                ? {
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (selectedPeriod !== "30days")
                e.currentTarget.style.borderColor =
                  "var(--color-primary-border)";
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== "30days")
                e.currentTarget.style.borderColor = "";
            }}>
            30 Days
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPeriod("custom");
              setShowCustomDatePicker(true);
            }}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
              selectedPeriod === "custom"
                ? "text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-100"
            }`}
            style={
              selectedPeriod === "custom"
                ? {
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (selectedPeriod !== "custom")
                e.currentTarget.style.borderColor =
                  "var(--color-primary-border)";
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== "custom")
                e.currentTarget.style.borderColor = "";
            }}>
            <span>📅</span>
            <span>Custom</span>
          </button>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <Card className="p-5">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <DatePicker
                  onChange={(date) => {
                    if (date) {
                      setCustomStartDate(date);
                      setSelectedPeriod("custom");
                      // If end date is before start date, update end date to start date
                      if (customEndDate && date > customEndDate) {
                        setCustomEndDate(date);
                      }
                    }
                  }}
                  value={customStartDate}
                  format="dd/MM/yyyy"
                  maxDate={customEndDate || undefined}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <DatePicker
                  onChange={(date) => {
                    if (date) {
                      setCustomEndDate(date);
                      setSelectedPeriod("custom");
                    }
                  }}
                  value={customEndDate}
                  format="dd/MM/yyyy"
                  minDate={customStartDate || undefined}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCustomDatePicker(false);
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                  setSelectedPeriod("today");
                }}
                className="flex-1 py-3 px-4 bg-white text-gray-700 rounded-2xl text-sm font-bold border border-gray-200 hover:bg-gray-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setShowCustomDatePicker(false);
                  } else {
                    toast.error("Please select both start and end dates");
                  }
                }}
                className="flex-1 py-3 px-4 text-white rounded-2xl text-sm font-bold shadow-lg theme-button">
                Confirm
              </button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Sales Summary Section */}
          <Card className="p-4">
            <div className="space-y-1 mb-3">
              <h2 className="text-lg font-extrabold text-gray-900">
                Sales Summary
              </h2>
              <div className="text-sm text-gray-600">{formatDateRange()}</div>
            </div>

            <div
              className="text-3xl font-extrabold mb-2"
              style={{ color: "var(--color-primary)" }}>
              ฿{salesMetrics.totalSales.toFixed(2)}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              {salesMetrics.salesChange !== null
                ? `${salesMetrics.salesChange > 0 ? "+" : ""}${salesMetrics.salesChange}% compared to ${salesMetrics.comparisonText || "previous period"}`
                : salesMetrics.hasComparison && salesMetrics.salesChange === 0.0
                  ? `0.0% compared to ${salesMetrics.comparisonText}`
                  : salesMetrics.comparisonText
                    ? `N/A compared to ${salesMetrics.comparisonText}`
                    : "N/A"}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-100 rounded-2xl p-3">
                <div className="text-[11px] font-bold text-gray-500">
                  Orders
                </div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">
                  {salesMetrics.totalOrders}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-3">
                <div className="text-[11px] font-bold text-gray-500">
                  Avg / Order
                </div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">
                  ฿{salesMetrics.averageOrder.toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-3">
                <div className="text-[11px] font-bold text-gray-500">
                  Cash (COD)
                </div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">
                  ฿{salesMetrics.cashSales.toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-3">
                <div className="text-[11px] font-bold text-gray-500">
                  Online
                </div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">
                  ฿{salesMetrics.ePaymentSales.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {/* Best-Selling Products Section */}
            <Card className="p-4">
              <div className="flex items-end justify-between gap-3 mb-4">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Best-Selling Products
                </h2>
                <div className="text-xs font-bold text-gray-400">Top 10</div>
              </div>

              {bestSellingProducts.length === 0 ? (
                <EmptyState
                  title="No sales data yet"
                  description="Delivered orders will appear here once you start selling."
                  className="pt-0"
                />
              ) : (
                <div className="space-y-2">
                  {bestSellingProducts.slice(0, 10).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:bg-white transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-extrabold text-gray-900">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-extrabold text-gray-900">
                            {product.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-bold ml-8">
                          {product.quantity}{" "}
                          {product.quantity === 1 ? "unit" : "units"} sold
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900">
                        ฿{product.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Sales Tips Section - Fills the void if product list is short */}
            
          </div>
        </div>
      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="absolute inset-0 flex items-end md:items-center justify-center">
            <div className="w-full md:max-w-md md:w-full bg-white md:rounded-3xl rounded-t-3xl shadow-xl overflow-hidden border border-gray-100 max-h-svh md:max-h-[calc(100vh-2rem)] flex flex-col">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black tracking-[0.14em] text-gray-500">
                    REQUEST PAYOUT
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-gray-900">
                    Request Payout from Wallet
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount("");
                  }}
                  className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
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

              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                <div className="space-y-6">
                  {/* Available Balance */}
                  <div className="rounded-3xl p-5 bg-gradient-to-br from-green-600 to-emerald-600 text-white border border-white/10 shadow-lg">
                    <div className="text-[11px] font-black tracking-[0.14em] text-white/80">
                      AVAILABLE WALLET BALANCE
                    </div>
                    <div className="mt-2 text-4xl font-extrabold">
                      ฿{walletBalance.toFixed(2)}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-black tracking-[0.14em] text-gray-500 mb-2">
                      Payout Amount (THB)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                        ฿
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={walletBalance}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => setPayoutAmount(walletBalance.toFixed(2))}
                      className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium">
                      Use full balance
                    </button>
                  </div>

                  {/* Bank Info */}
                  {myShopData?.ePaymentAccount?.accountNumber && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="text-xs font-black tracking-[0.14em] text-gray-500 mb-2">
                        BANK ACCOUNT
                      </div>
                      <div className="text-sm font-extrabold text-gray-900">
                        {myShopData.ePaymentAccount.bank} •{" "}
                        {myShopData.ePaymentAccount.accountNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={
                    payoutLoading ||
                    !payoutAmount ||
                    parseFloat(payoutAmount) <= 0 ||
                    parseFloat(payoutAmount) > walletBalance
                  }
                  className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-primary-green to-primary-green/80-600 text-white font-extrabold hover:bg-gradient-to-r from-primary-green to-primary-green/80-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                  {payoutLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Request Payout"
                  )}
                </button>

                <div className="mt-3 text-[11px] text-gray-500 text-center font-bold">
                  Your payout request will be reviewed by admin
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesSummary;
