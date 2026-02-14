import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { setMyOrders, updateRealtimeOrderStatus } from "../redux/userSlice";
import Card from "../components/ui/Card";
import { toast } from "react-toastify";

function EPaymentAccount() {
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const { myOrders, socket, userData } = useSelector((state) => state.user);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Listen for real-time order status updates to refresh wallet balance
  useEffect(() => {
    if (!socket || !userData?._id) {
      return;
    }

    const refreshOrders = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(response.data));
      } catch (error) {}
    };

    const refreshShopData = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });
        dispatch(setMyShopData(response.data));
      } catch (error) {}
    };

    const handleUpdateStatus = async ({
      orderId,
      shopId,
      status,
      userId,
      ownerId,
    }) => {
      // For owners: update if this is for their shop order
      if (userData.role === "owner" && ownerId === userData._id) {
        // Update Redux state immediately
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));

        // Refresh orders to get latest data (especially important when order is delivered)
        await refreshOrders();

        // If order was delivered, also refresh shop data
        if (status === "delivered") {
          setTimeout(async () => {
            await refreshShopData();
            // Also refresh transactions to show new payout
            try {
              const response = await axios.get(
                `${serverUrl}/api/shop/transactions`,
                {
                  withCredentials: true,
                },
              );
              setTransactions(response.data?.transactions || []);
            } catch (error) {}
          }, 2000);
        }
      }
    };

    socket.on("update-status", handleUpdateStatus);

    return () => {
      socket.off("update-status", handleUpdateStatus);
    };
  }, [socket, userData, dispatch]);

  // Refresh orders when component mounts or when userData/shopData becomes available
  useEffect(() => {
    const refreshOrders = async () => {
      if (!userData?._id || userData?.role !== "owner") {
        return;
      }

      try {
        const response = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });

        dispatch(setMyOrders(response.data));
      } catch (error) {}
    };

    refreshOrders();
  }, [dispatch, userData?._id, userData?.role]);

  // Refresh shop data when component mounts or when userData becomes available
  useEffect(() => {
    const refreshShopData = async () => {
      if (!userData?._id || userData?.role !== "owner") {
        return;
      }

      try {
        const response = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });

        dispatch(setMyShopData(response.data));
      } catch (error) {}
    };

    refreshShopData();
  }, [dispatch, userData?._id, userData?.role]);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setTransactionsLoading(true);
      try {
        const response = await axios.get(`${serverUrl}/api/shop/transactions`, {
          withCredentials: true,
        });

        const transactionsData = response.data?.transactions || [];

        setTransactions(transactionsData);
      } catch (error) {
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    // Fetch on mount only
    fetchTransactions();
  }, []);

  // Calculate today's e-payment sales (before payouts)
  const todaySales = useMemo(() => {
    if (!myOrders || !Array.isArray(myOrders)) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let total = 0;
    let debugCount = 0;

    myOrders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);

      if (orderDate >= today && orderDate < tomorrow) {
        // For owners, find the shop order that belongs to their shop
        let shopOrder = null;
        if (userData?.role === "owner" && myShopData?._id) {
          // Find the shop order that matches this shop
          shopOrder = order.shopOrders?.find((so) => {
            const shopId = so.shop?._id || so.shop;
            return shopId?.toString() === myShopData._id.toString();
          });
        } else {
          // For users or if no shop data, use first shop order
          shopOrder = order.shopOrders?.[0];
        }

        if (shopOrder) {
          const paymentMethod = order.paymentMethod?.toLowerCase()?.trim();
          const status = shopOrder.status?.toLowerCase()?.trim();

          debugCount++;

          // Only count delivered e-payment orders (paymentMethod === "online")
          if (
            shopOrder &&
            status === "delivered" &&
            shopOrder.subtotal &&
            paymentMethod === "online"
          ) {
            const amount = Number(shopOrder.subtotal) || 0;
            total += amount;
          }
        }
      }
    });

    return total;
  }, [myOrders, userData, myShopData]);

  // Calculate wallet balance (sales minus payouts)
  // Only subtract successful/pending payouts from TODAY (not failed or canceled)
  const walletBalance = useMemo(() => {
    // Start with today's sales
    let balance = Number(todaySales) || 0;

    // Only consider payouts from today (matching todaySales logic)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let totalPayouts = 0;
    let todayPayoutsCount = 0;

    if (myShopData?.payouts && Array.isArray(myShopData.payouts)) {
      myShopData.payouts.forEach((payout, index) => {
        // Only subtract payouts from today
        if (!payout.createdAt) {
          return;
        }

        const payoutDate = new Date(payout.createdAt);
        const isToday = payoutDate >= today && payoutDate < tomorrow;

        if (isToday) {
          todayPayoutsCount++;

          // Subtract payouts that are pending, in_transit, or paid
          // Don't subtract failed or canceled payouts
          const validStatuses = ["pending", "in_transit", "paid"];
          const isValidStatus = validStatuses.includes(payout.status);

          if (isValidStatus) {
            const payoutAmount = Number(payout.amount) || 0;
            totalPayouts += payoutAmount;
            balance -= payoutAmount;
          } else {
          }
        } else {
          // Only log first 3 non-today payouts for debugging
          if (index < 3) {
          }
        }
      });
    } else {
    }

    // Ensure balance doesn't go negative
    const finalBalance = Math.max(0, balance);

    return finalBalance;
  }, [todaySales, myShopData?.payouts]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (parseFloat(withdrawAmount) > walletBalance) {
      toast.error(
        `Insufficient balance. Available: ฿${walletBalance.toFixed(2)}`,
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

    setWithdrawLoading(true);
    try {
      // Call backend API which uses Stripe Payouts API
      // Reference: https://docs.stripe.com/api/payouts
      const response = await axios.post(
        `${serverUrl}/api/shop/withdraw-to-bank`,
        {
          amount: parseFloat(withdrawAmount),
        },
        { withCredentials: true },
      );

      // Success - Stripe payout was created successfully
      const { payoutId, status, arrivalDate, method, currency } = response.data;

      // Format arrival date for display
      const arrivalDateFormatted = arrivalDate
        ? new Date(arrivalDate * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A";

      toast.success(
        `Withdrawal processed! Amount: ฿${withdrawAmount} • Status: ${status}`,
      );

      setShowWithdrawModal(false);
      setWithdrawAmount("");

      // Refresh all data to update wallet balance immediately
      // Refresh shop data to get updated payouts array
      if (response.data.shop) {
        dispatch(setMyShopData(response.data.shop));
      } else {
        // Fallback: fetch shop data if not included in response
        try {
          const shopResponse = await axios.get(`${serverUrl}/api/shop/get-my`, {
            withCredentials: true,
          });
          dispatch(setMyShopData(shopResponse.data));
        } catch (error) {}
      }

      // Refresh orders to ensure wallet balance is accurate
      try {
        const ordersResponse = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          {
            withCredentials: true,
          },
        );
        dispatch(setMyOrders(ordersResponse.data));
      } catch (error) {}

      // Refresh transactions to show the new payout
      try {
        const transactionsResponse = await axios.get(
          `${serverUrl}/api/shop/transactions`,
          {
            withCredentials: true,
          },
        );
        setTransactions(transactionsResponse.data.transactions || []);
      } catch (error) {}
    } catch (error) {
      // Handle Stripe-specific errors
      const errorMessage =
        error.response?.data?.message ||
        "Failed to process withdrawal. Please try again.";
      const errorCode = error.response?.data?.errorCode;
      const instructions = error.response?.data?.instructions;

      let alertMessage = errorMessage;

      if (instructions && Array.isArray(instructions)) {
        alertMessage += "\n\nInstructions:\n" + instructions.join("\n");
      }

      if (error.response?.data?.helpUrl) {
        alertMessage += `\n\nFor more help, visit: ${error.response.data.helpUrl}`;
      }

      toast.error(alertMessage);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdrawAll = () => {
    setWithdrawAmount(walletBalance.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Wallet Card */}
        <Card className="p-6 rounded-lg border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Wallet</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                ฿{walletBalance.toFixed(2)}
              </div>
              {/* Debug info - shows today's sales and today's payouts only */}
              {process.env.NODE_ENV === "development" && (
                <>
                  <p className="text-xs text-gray-400 mt-1">
                    Today's sales: ฿{todaySales.toFixed(2)} | Today's payouts: ฿
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      today.setMilliseconds(0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);

                      let todayPayouts = 0;
                      if (
                        myShopData?.payouts &&
                        Array.isArray(myShopData.payouts)
                      ) {
                        myShopData.payouts.forEach((payout) => {
                          const payoutDate = payout.createdAt
                            ? new Date(payout.createdAt)
                            : null;
                          const isToday =
                            payoutDate &&
                            payoutDate >= today &&
                            payoutDate < tomorrow;

                          if (isToday) {
                            if (
                              payout.status === "pending" ||
                              payout.status === "in_transit" ||
                              payout.status === "paid"
                            ) {
                              todayPayouts += payout.amount || 0;
                            }
                          }
                        });
                      }
                      return todayPayouts.toFixed(2);
                    })()}
                  </p>
                  <button
                    onClick={async () => {
                      // Refresh all data
                      try {
                        const [ordersRes, shopRes] = await Promise.all([
                          axios.get(`${serverUrl}/api/order/my-orders`, {
                            withCredentials: true,
                          }),
                          axios.get(`${serverUrl}/api/shop/get-my`, {
                            withCredentials: true,
                          }),
                        ]);
                        dispatch(setMyOrders(ordersRes.data));
                        dispatch(setMyShopData(shopRes.data));
                      } catch (error) {}
                    }}
                    className="mt-2 text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">
                    🔄 Refresh Data
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={walletBalance === 0}
              className="px-4 py-2.5 text-sm font-medium text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Withdraw
            </button>
          </div>
        </Card>

        {/* Transactions Card */}
        <Card className="p-6 rounded-lg border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transactions
          </h2>

          {transactionsLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => {
                const isPayment = transaction.transactionType === "payment";
                const isPayout = transaction.transactionType === "payout";

                const createdDate = transaction.createdAt
                  ? new Date(transaction.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "—";

                // Status colors for payouts
                const getPayoutStatusColor = (status) => {
                  switch (status) {
                    case "paid":
                      return "bg-green-100 text-green-800";
                    case "pending":
                      return "bg-yellow-100 text-yellow-800";
                    case "in_transit":
                      return "bg-blue-100 text-blue-800";
                    case "failed":
                      return "bg-red-100 text-red-800";
                    case "canceled":
                      return "bg-gray-100 text-gray-800";
                    default:
                      return "bg-gray-100 text-gray-800";
                  }
                };

                // Status colors for payments
                const getPaymentStatusColor = (status) => {
                  switch (status) {
                    case "succeeded":
                      return "bg-green-100 text-green-800";
                    case "pending":
                      return "bg-yellow-100 text-yellow-800";
                    case "failed":
                      return "bg-red-100 text-red-800";
                    case "refunded":
                      return "bg-orange-100 text-orange-800";
                    default:
                      return "bg-gray-100 text-gray-800";
                  }
                };

                if (isPayout) {
                  // Payout transaction (outgoing money)
                  const payout = transaction;
                  const arrivalDate = payout.arrivalDate
                    ? new Date(payout.arrivalDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : null;

                  return (
                    <div
                      key={payout.payoutId || `payout-${index}`}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-green-600">
                              ฿{payout.amount?.toFixed(2) || "0.00"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPayoutStatusColor(
                                payout.status,
                              )}`}>
                              {payout.status?.toUpperCase() || "PENDING"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              Payout
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Date:</span>
                              <span>{createdDate}</span>
                            </div>
                            {arrivalDate && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Arrival:</span>
                                <span>{arrivalDate}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Method:</span>
                              <span className="capitalize">
                                {payout.method || "standard"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Type:</span>
                              <span className="capitalize">
                                {payout.type === "automatic" ? (
                                  <span className="text-blue-600">
                                    Automatic
                                  </span>
                                ) : (
                                  <span className="text-gray-600">Manual</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {payout.payoutId && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-mono">
                            ID: {payout.payoutId}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                } else if (isPayment) {
                  // Payment transaction (incoming money)
                  const payment = transaction;

                  return (
                    <div
                      key={payment.chargeId || `payment-${index}`}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-green-600">
                              +฿{payment.amount?.toFixed(2) || "0.00"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                payment.status,
                              )}`}>
                              {payment.status?.toUpperCase() || "SUCCEEDED"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              Payment
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Date:</span>
                              <span>{createdDate}</span>
                            </div>
                            {payment.receiptUrl && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Receipt:</span>
                                <a
                                  href={payment.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline">
                                  View Receipt
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {payment.chargeId && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-mono">
                            Charge ID: {payment.chargeId}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Withdraw Modal - Stripe Checkout Style */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg max-w-5xl w-full shadow-xl overflow-hidden flex flex-col md:flex-row"
            style={{ minHeight: "600px" }}>
            {/* Left Section - Payout Summary */}
            <div className="w-full md:w-2/5 bg-white border-r border-gray-200 p-6 md:p-8 flex flex-col">
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  Payout
                </span>
              </div>

              <div className="flex-1">
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-600 mb-1">
                    Payout amount
                  </h3>
                  {withdrawAmount ? (
                    <div className="text-4xl font-bold text-gray-900 mt-2">
                      ฿{parseFloat(withdrawAmount || 0).toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-gray-400 mt-2">
                      ฿0.00
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Bank account</p>
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-900">
                        {myShopData?.ePaymentAccount?.accountName || "—"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {myShopData?.ePaymentAccount?.bank || "—"}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {myShopData?.ePaymentAccount?.accountNumber || "—"}
                      </p>
                      {myShopData?.ePaymentAccount?.branch && (
                        <p className="text-sm text-gray-600">
                          {myShopData.ePaymentAccount.branch}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      Available balance
                    </p>
                    <p className="text-xl font-semibold text-gray-900">
                      ฿{walletBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Payout method</p>
                    <p className="text-sm font-medium text-gray-900">
                      Standard transfer
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Arrives in 2-7 business days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Payout Form */}
            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
              {/* Header with close button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
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

              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Create payout
                </h2>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (THB)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                      ฿
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={walletBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={handleWithdrawAll}
                    className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium">
                    Use full balance
                  </button>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={
                    withdrawLoading ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > walletBalance
                  }
                  className="w-full py-3.5 bg-green-500 text-white rounded-lg font-medium text-base hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                  {withdrawLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Create payout"
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-6">
                  By creating a payout, you agree to our{" "}
                  <a href="#" className="text-gray-600 hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-gray-600 hover:underline">
                    Privacy
                  </a>
                </p>

                <div className="mt-8 text-center">
                  <p className="text-xs text-gray-400">Powered by Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EPaymentAccount;
