import React, { useState, useMemo, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import {
  FaInfoCircle,
  FaFilter,
  FaUtensils,
  FaMapMarkerAlt,
  FaWallet,
} from "react-icons/fa";
import { HiOutlineClipboardCopy } from "react-icons/hi";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyOrders } from "../redux/userSlice";
import { setMyShopData } from "../redux/ownerSlice";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { useHeaderTitle } from "../context/UIContext.jsx";

function History() {
  const { userData, myOrders } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useHeaderTitle("My Orders");

  // Refresh orders on mount
  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });

        dispatch(setMyOrders(result.data));
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load order history";
        toast.error(msg);
      }
    };
    if (userData?.role === "owner" || userData?.role === "deliveryBoy") {
      fetchOrders();
    }
  }, [userData, dispatch]);

  // Fetch shop data for owners
  useEffect(() => {
    const fetchShopData = async () => {
      if (userData?.role === "owner") {
        try {
          const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
            withCredentials: true,
          });
          dispatch(setMyShopData(result.data));
        } catch (error) {}
      }
    };
    fetchShopData();
  }, [userData, dispatch]);

  // Calculate wallet balance for owners - use walletBalance from backend
  useEffect(() => {
    if (!myShopData || userData?.role !== "owner") {
      setWalletBalance(0);
      return;
    }

    // Use wallet balance calculated by backend (from getMyShop endpoint)
    // This ensures we use ALL delivered orders, not just what's in myOrders
    if (
      myShopData.walletBalance &&
      typeof myShopData.walletBalance.availableWalletBalance === "number"
    ) {
      setWalletBalance(myShopData.walletBalance.availableWalletBalance);
    } else {
      // Fallback to 0 if walletBalance not available
      setWalletBalance(0);
    }
  }, [myShopData, userData]);

  // Filter orders for this owner's shop or delivery boy's orders
  // Backend already filters orders by role, so we just need to get the shopOrder
  const filteredOrders = useMemo(() => {
    if (
      !myOrders ||
      (userData?.role !== "owner" && userData?.role !== "deliveryBoy")
    ) {
      return [];
    }

    if (userData?.role === "owner") {
      return myOrders
        .filter(
          (order) =>
            order &&
            order._id &&
            order.shopOrders &&
            order.shopOrders.length > 0,
        )
        .map((order) => {
          // Backend already filters by owner, so we can use the first shopOrder
          const shopOrder = order.shopOrders[0];
          return {
            ...order,
            shopOrder, // Include the relevant shopOrder
          };
        });
    } else if (userData?.role === "deliveryBoy") {
      // For delivery boys, backend already filters by assignedDeliveryBoy
      // But we need to find the specific shopOrder assigned to this delivery boy
      const filtered = myOrders
        .filter((order) => {
          if (
            !order ||
            !order._id ||
            !order.shopOrders ||
            order.shopOrders.length === 0
          ) {
            return false;
          }
          return true;
        })
        .map((order) => {
          // Find the shopOrder assigned to this delivery boy
          const shopOrder = order.shopOrders.find((so) => {
            const assigned = so.assignedDeliveryBoy;
            if (!assigned) {
              return false;
            }
            // Handle both populated (object) and unpopulated (string/ObjectId) cases
            const assignedId =
              typeof assigned === "object" && assigned !== null
                ? assigned._id || assigned.id || assigned
                : assigned;
            const matches =
              assignedId?.toString() === userData?._id?.toString();
            if (!matches) {
            }
            return matches;
          });
          if (!shopOrder) {
            return null;
          }
          return {
            ...order,
            shopOrder,
          };
        })
        .filter((order) => order !== null); // Remove null entries

      return filtered;
    }
    return [];
  }, [myOrders, userData]);

  // Calculate total sales/earnings and breakdown
  // Only count sales from DELIVERED orders - orders must be completed/delivered
  const salesData = useMemo(() => {
    if (userData?.role === "owner") {
      let totalSales = 0;
      let cashSales = 0;
      let ePaymentSales = 0;

      filteredOrders.forEach((order) => {
        // Only count sales from DELIVERED orders - do NOT count pending, preparing, out of delivery, or cancelled
        const orderStatus = order.shopOrder?.status?.toLowerCase()?.trim();
        if (orderStatus === "delivered" && order.shopOrder?.subtotal) {
          const amount = Number(order.shopOrder.subtotal) || 0;
          totalSales += amount;

          // Track by payment method (only for delivered orders)
          const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
          if (paymentMethod === "cod") {
            cashSales += amount;
          } else if (paymentMethod === "online") {
            ePaymentSales += amount;
          }
        }
      });

      return {
        total: totalSales,
        cash: cashSales,
        ePayment: ePaymentSales,
      };
    } else if (userData?.role === "deliveryBoy") {
      // For delivery boys, calculate total earnings from delivery fees
      // Filter: Only include orders with online payment methods (exclude COD)
      let totalEarnings = 0;
      filteredOrders.forEach((order) => {
        const orderStatus = order.shopOrder?.status?.toLowerCase()?.trim();
        const paymentMethod = String(order.paymentMethod || "").toLowerCase();
        const isOnlinePayment = ["online", "promptpay", "card"].includes(
          paymentMethod,
        );

        if (
          orderStatus === "delivered" &&
          order.deliveryFee &&
          isOnlinePayment
        ) {
          totalEarnings += Number(order.deliveryFee) || 0;
        }
      });
      return {
        total: totalEarnings,
        cash: 0,
        ePayment: 0,
      };
    }
    return { total: 0, cash: 0, ePayment: 0 };
  }, [filteredOrders, userData]);

  // Apply filters
  const finalFilteredOrders = useMemo(() => {
    let filtered = [...filteredOrders];

    const normalizeStatus = (status) => {
      const value = String(status || "").toLowerCase();
      if (value === "delivered") return "delivered";
      if (value === "cancelled") return "cancelled";
      return "in-progress"; // pending, preparing, out for delivery, etc.
    };

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => {
        return normalizeStatus(order.shopOrder?.status) === statusFilter;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredOrders, dateRange, statusFilter]);

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

  const formatDateRange = () => {
    if (!dateRange.start || !dateRange.end) {
      return "Select date range";
    }
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  const handleOpenDatePicker = () => {
    setShowDateRangePicker(true);
    setTempStartDate(dateRange.start ? new Date(dateRange.start) : null);
    setTempEndDate(dateRange.end ? new Date(dateRange.end) : null);
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tempEndDate);
      end.setHours(23, 59, 59, 999);
      setDateRange({ start, end });
    }
    setShowDateRangePicker(false);
  };

  const handleClearDateRange = () => {
    setDateRange({ start: null, end: null });
    setTempStartDate(null);
    setTempEndDate(null);
    setShowDateRangePicker(false);
  };

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "in-progress", label: "Ongoing" },
    { value: "delivered", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

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

  if (userData?.role !== "owner" && userData?.role !== "deliveryBoy") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">
          This page is only available for shop owners and delivery boys.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header - Mobile Only */}
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Total Sales/Earnings Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <FaInfoCircle size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {userData?.role === "owner" ? "Total Sales" : "Total Earnings"}
            </h2>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            ฿
            {salesData.total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {userData?.role === "owner" ? (
            <>
              <div className="flex flex-wrap gap-4 text-sm mt-4">
                <div className="bg-white px-4 py-2 rounded-xl font-medium text-gray-600 border border-gray-100">
                  Cash:{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--color-primary)" }}>
                    ฿{salesData.cash.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl font-medium text-gray-600 border border-gray-100">
                  E-payment:{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--color-primary)" }}>
                    ฿{salesData.ePayment.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(true)}
                  disabled={walletBalance <= 0}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 text-white font-extrabold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
                  <FaWallet size={18} />
                  <span className="text-sm md:text-base">Request Payout</span>
                </button>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Available wallet balance: ฿{walletBalance.toFixed(2)}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 font-medium">
              From{" "}
              <span className="text-gray-900 font-bold">
                {
                  finalFilteredOrders.filter(
                    (o) => o.shopOrder?.status === "delivered",
                  ).length
                }
              </span>{" "}
              delivered orders
            </div>
          )}
        </Card>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range Selector */}
          <div className="relative group">
            <div
              className="w-full bg-white border border-gray-200 hover:border-orange-200 rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer shadow-sm transition-all"
              onClick={handleOpenDatePicker}>
              <div className="flex items-center gap-3">
                <div className="text-gray-400">
                  <FaFilter size={14} />
                </div>
                <span className="text-gray-700 text-sm font-medium">
                  {formatDateRange()}
                </span>
              </div>
              <span className="text-gray-400 group-hover:text-orange-500 transition-colors">
                ▼
              </span>
            </div>

            {showDateRangePicker && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[320px] bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      onChange={setTempStartDate}
                      value={tempStartDate}
                      format="dd/MM/yyyy"
                      className="w-full border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      End Date
                    </label>
                    <DatePicker
                      onChange={setTempEndDate}
                      value={tempEndDate}
                      format="dd/MM/yyyy"
                      minDate={tempStartDate}
                      className="w-full border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleClearDateRange}
                      className="flex-1 py-2.5 px-4 bg-white text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                      Clear
                    </button>
                    <button
                      onClick={handleApplyDateRange}
                      disabled={!tempStartDate || !tempEndDate}
                      className="flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg theme-button">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-3 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-2 min-w-full">
                {statusOptions.map((option) => {
                  const isActive = statusFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                        isActive
                          ? "bg-black text-white border-black shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FaUtensils className="text-gray-400" />
            {userData?.role === "owner"
              ? "Recent Transactions"
              : "Delivery History"}
          </h3>
          {finalFilteredOrders.length === 0 ? (
            <Card className="py-20">
              <EmptyState
                icon={
                  <HiOutlineClipboardCopy className="text-gray-400 text-2xl" />
                }
                title="No orders found"
                description="Try adjusting your filters"
                className="pt-0"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finalFilteredOrders.map((order) => {
                const orderId = order._id ? order._id : "";
                const customerName = order.user?.fullName || "Customer";
                const amount =
                  userData?.role === "owner"
                    ? order.shopOrder?.subtotal || 0
                    : order.deliveryFee || 0;
                const paymentMethod =
                  order.paymentMethod === "cod" ? "Cash" : "E-payment";
                const orderDate = formatDate(order.createdAt);
                const rawStatus = (order.shopOrder?.status || "").toLowerCase();
                const isCancelled = rawStatus === "cancelled";
                const isNotAccepted =
                  isCancelled &&
                  order.shopOrder?.cancelReason?.includes("Not accepted");
                const isDelivered = rawStatus === "delivered";
                const statusLabel = isNotAccepted
                  ? "Declined"
                  : isCancelled
                    ? "Cancelled"
                    : isDelivered
                      ? "Completed"
                      : "Ongoing";
                const statusClasses = isCancelled
                  ? "bg-red-50 text-red-600"
                  : isDelivered
                    ? "bg-green-50 text-green-600"
                    : "bg-blue-50 text-blue-600";
                const shopName = order.shopOrder?.shop?.name || "Restaurant";
                const deliveryAddress =
                  order.deliveryAddress?.text || "Delivery destination";

                return (
                  <Card
                    key={order._id}
                    onClick={() => navigate(`/order-detail/${order._id}`)}
                    className="p-5 cursor-pointer hover:shadow-lg hover:border-orange-100 transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusClasses}`}>
                          {statusLabel}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {orderDate}
                        </span>
                      </div>

                      <div className="mb-4">
                        {userData?.role === "owner" ? (
                          <>
                            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                              {customerName}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                              #{orderId.slice(-4)}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor:
                                    "var(--color-primary-bg-light)",
                                  color: "var(--color-primary)",
                                }}>
                                <FaUtensils size={10} />
                              </div>
                              <span className="font-bold text-gray-900 text-sm line-clamp-1">
                                {shopName}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor:
                                    "var(--color-primary-bg-light)",
                                  color: "var(--color-primary)",
                                }}>
                                <FaMapMarkerAlt size={10} />
                              </div>
                              <span className="text-xs text-gray-600 line-clamp-2">
                                {deliveryAddress}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {userData?.role === "owner" ? "Total" : "Earnings"}
                        </p>
                        <p
                          className={`text-lg font-extrabold ${
                            isCancelled ? "text-gray-400 line-through" : ""
                          }`}
                          style={
                            !isCancelled
                              ? { color: "var(--color-primary)" }
                              : {}
                          }>
                          ฿{amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Payment
                        </p>
                        <p className="text-[11px] font-semibold text-gray-600 leading-tight">
                          {paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order-detail/${order._id}`);
                        }}
                        className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 hover:border-gray-300 text-gray-800 bg-white shadow-sm">
                        Order Details
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {showStatusFilter && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowStatusFilter(false)}
        />
      )}
      {showDateRangePicker && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowDateRangePicker(false)}
        />
      )}

      {/* Request Payout Modal */}
      {showPayoutModal && userData?.role === "owner" && (
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
                  <div className="rounded-3xl p-5 bg-linear-to-br from-green-600 to-emerald-600 text-white border border-white/10 shadow-lg">
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
                  className="w-full min-h-[52px] rounded-2xl bg-green-600 text-white font-extrabold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
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

export default History;
