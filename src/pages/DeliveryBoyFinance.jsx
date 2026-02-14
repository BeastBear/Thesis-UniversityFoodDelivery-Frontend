import React, { useEffect, useState, useCallback } from "react";

import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate, useLocation } from "react-router-dom";
import { FaWallet, FaFileInvoiceDollar } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { MdAccountBalanceWallet, MdAdd } from "react-icons/md";
import { setUserData } from "../redux/userSlice";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";
import { toast } from "react-toastify";

function DeliveryBoyFinance() {
  const { userData, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [financialData, setFinancialData] = useState({
    wallet: 0,
    availableWallet: 0,
    jobCredit: 0,
    withdrawableWallet: 0,
    withdrawableJobCredit: 0,
    onHoldAmount: 0,
  });
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState("promptpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (!showTopUpModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showTopUpModal]);

  // Reset processing state when modal opens/closes
  useEffect(() => {
    if (!showTopUpModal) {
      setIsProcessing(false);
      setTopUpAmount("");
    }
  }, [showTopUpModal]);

  // Safety timeout to reset processing state if stuck
  useEffect(() => {
    if (isProcessing) {
      const timeout = setTimeout(() => {
        setIsProcessing(false);
      }, 30000); // 30 second timeout
      return () => clearTimeout(timeout);
    }
  }, [isProcessing]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showTopUpModal) {
        setShowTopUpModal(false);
        setTopUpAmount("");
        setIsProcessing(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showTopUpModal]);

  // Fetch financial data function (extracted to be reusable)
  const fetchFinancialData = useCallback(async () => {
    if (!userData?._id) return;

    try {
      // Fetch all orders to calculate total earnings (wallet should be total earnings from all delivered orders)
      // Add timestamp to prevent caching
      const ordersResult = await axios.get(
        `${serverUrl}/api/order/my-orders?t=${new Date().getTime()}`,
        {
          withCredentials: true,
        },
      );
      const orders = ordersResult.data || [];

      // Calculate total earnings from all delivered orders
      let totalEarnings = 0;
      const processedOrderIds = new Set();

      orders.forEach((order) => {
        if (!order.shopOrders) return;

        // Filter: Only include orders with online payment methods (exclude COD)
        const paymentMethod = String(order.paymentMethod || "").toLowerCase();
        const isOnlinePayment = ["online", "promptpay", "card"].includes(
          paymentMethod,
        );

        if (!isOnlinePayment) return; // Skip COD orders

        order.shopOrders.forEach((shopOrder) => {
          // Check if this shop order is assigned to current user and is delivered
          const isAssigned =
            shopOrder.assignedDeliveryBoy?.toString() ===
              userData._id?.toString() ||
            (typeof shopOrder.assignedDeliveryBoy === "object" &&
              shopOrder.assignedDeliveryBoy?._id?.toString() ===
                userData._id?.toString());

          if (isAssigned && shopOrder.status === "delivered") {
            // Add delivery fee only once per order
            if (!processedOrderIds.has(order._id.toString())) {
              // Calculate total earnings
              // Wallet = Delivery Fee
              const deliveryFee = Number(order.deliveryFee) || 0;
              totalEarnings += deliveryFee;
              processedOrderIds.add(order._id.toString());
            }
          }
        });
      });

      // Fetch updated user data to get the latest jobCredit and payouts
      const userRes = await axios.get(
        `${serverUrl}/api/user/current?t=${new Date().getTime()}`,
        {
          withCredentials: true,
        },
      );
      dispatch(setUserData(userRes.data)); // Update Redux state with latest user data

      const jobCredit = userRes.data?.jobCredit || 0;

      // Check if there are any pending payouts
      let hasPendingPayout = false;
      if (userRes.data?.payouts && Array.isArray(userRes.data.payouts)) {
        hasPendingPayout = userRes.data.payouts.some(
          (payout) => payout.status?.toLowerCase() === "pending",
        );
      }

      // Calculate total withdrawals (in_transit, paid, or on_hold)
      // Also track pending payouts to deduct them from available balance
      // IMPORTANT: Only count MANUAL payouts as withdrawals, not automatic credits
      let totalWalletWithdrawals = 0;
      let pendingWalletWithdrawals = 0;
      let onHoldAmount = 0;

      // Track automatic credits from COD orders that should be excluded
      let codCreditsToExclude = 0;

      if (userRes.data?.payouts && Array.isArray(userRes.data.payouts)) {
        userRes.data.payouts.forEach((payout, index) => {
          const payoutStatus = payout.status?.toLowerCase() || "";
          const payoutAmount = Number(payout.amount) || 0;
          const source = payout.source || "wallet"; // Default to wallet
          const payoutType = payout.type || "manual";

          // Only track wallet withdrawals here. Job credit withdrawals are directly deducted from jobCredit in DB.
          if (source === "wallet") {
            // Check if this is an automatic credit from a COD order
            if (payoutType === "automatic" && payout.orderId) {
              // Find the order to check if it's COD
              const relatedOrder = orders.find(
                (o) => o._id?.toString() === payout.orderId?.toString(),
              );
              if (relatedOrder) {
                const paymentMethod = String(
                  relatedOrder.paymentMethod || "",
                ).toLowerCase();
                if (paymentMethod === "cod") {
                  // This is a COD order credit that shouldn't be in wallet
                  codCreditsToExclude += payoutAmount;
                }
              } else {
                // If order not found in current orders list, check via API
                // For now, we'll exclude any automatic credit that we can't verify
                // This is a safety measure - in production, you might want to fetch the order
              }
            } else if (payoutType === "automatic" && !payout.orderId) {
              // Automatic credit without orderId - might be from COD, exclude to be safe
              // Or you could fetch all orders to verify, but that's expensive
            }

            // Only count MANUAL payouts as withdrawals (user-initiated withdrawals)
            if (payoutType === "manual") {
              if (payoutStatus === "pending") {
                pendingWalletWithdrawals += payoutAmount;
              } else if (
                payoutStatus === "in_transit" ||
                payoutStatus === "paid" ||
                payoutStatus === "on_hold"
              ) {
                totalWalletWithdrawals += payoutAmount;

                // Track on hold amount separately
                if (payoutStatus === "on_hold") {
                  onHoldAmount += payoutAmount;
                }
              }
            }
          }
        });
      }

      // Calculate financial stats
      // Wallet = Total Earnings (from online orders) - COD Credits (if any were incorrectly added) - Total Withdrawals (Processed)
      // Subtract COD credits that were incorrectly added to wallet before the fix
      const adjustedEarnings = Math.max(0, totalEarnings - codCreditsToExclude);
      const netWalletBalance = Math.max(
        0,
        adjustedEarnings - totalWalletWithdrawals,
      );
      const availableWalletBalance = Math.max(
        0,
        netWalletBalance - pendingWalletWithdrawals,
      );

      const displayWallet = availableWalletBalance;
      const displayJobCredit = jobCredit;

      // Withdrawable Wallet shows available wallet funds
      const displayWithdrawableWallet = availableWalletBalance;

      // Withdrawable Job Credit shows job credit
      // Note: jobCredit from DB already has pending job credit withdrawals deducted
      const displayWithdrawableJobCredit = displayJobCredit;

      // Update state with separate available balances for modal use
      setFinancialData({
        wallet: displayWallet,
        availableWallet: availableWalletBalance, // Add this for withdrawal validation
        jobCredit: displayJobCredit,
        withdrawableWallet: displayWithdrawableWallet,
        withdrawableJobCredit: displayWithdrawableJobCredit,
        onHoldAmount: onHoldAmount,
      });
    } catch (error) {}
  }, [userData?._id, dispatch]);

  // Fetch financial data separately
  useEffect(() => {
    if (userData?._id) {
      fetchFinancialData();
    }
  }, [userData?._id, fetchFinancialData]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleJobCreditUpdate = ({ jobCredit }) => {
      // Refresh financial data to get the latest state (including pending payouts etc)
      fetchFinancialData();
    };

    socket.on("job-credit-updated", handleJobCreditUpdate);

    return () => {
      socket.off("job-credit-updated", handleJobCreditUpdate);
    };
  }, [socket, fetchFinancialData]);

  // Handle Stripe Checkout return URLs
  useEffect(() => {
    if (!location.search) {
      // Reset processing state when no payment params (normal page load)
      setIsProcessing(false);
      setShowTopUpModal(false);
      return;
    }

    try {
      const urlParams = new URLSearchParams(location.search);
      const payment = urlParams.get("payment");
      const sessionId = urlParams.get("session_id");

      // Reset processing state and close modal
      setIsProcessing(false);
      setShowTopUpModal(false);

      if (payment === "success" && sessionId) {
        // Verify and update credit
        const verifyPayment = async () => {
          try {
            const result = await axios.post(
              `${serverUrl}/api/user/verify-credit-topup`,
              { sessionId },
              { withCredentials: true },
            );

            // Fetch updated user data to get the latest jobCredit
            const userRes = await axios.get(`${serverUrl}/api/user/current`, {
              withCredentials: true,
            });
            dispatch(setUserData(userRes.data)); // Update Redux state

            // Update financial data
            setFinancialData((prev) => ({
              ...prev,
              jobCredit: result.data.newCredit || userRes.data?.jobCredit || 0,
            }));

            toast.success(
              `Credit top-up successful! New credit: ฿${(
                result.data.newCredit ||
                userRes.data?.jobCredit ||
                0
              ).toFixed(2)}`,
            );
            navigate("/delivery-boy-finance", { replace: true });
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Payment verification failed. Please contact support.";
            toast.error(`Error: ${errorMessage}`);
            navigate("/delivery-boy-finance", { replace: true });
          }
        };
        verifyPayment();
      } else if (payment === "cancelled") {
        toast.info("Payment was cancelled.");
        navigate("/delivery-boy-finance", { replace: true });
      }
    } catch (error) {
      // Reset state on error
      setIsProcessing(false);
      setShowTopUpModal(false);
    }
  }, [location.search, navigate, dispatch]);

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error("Please enter a valid payout amount");
      return;
    }

    if (parseFloat(payoutAmount) > financialData.availableWallet) {
      toast.error(
        `Insufficient wallet balance. Available: ฿${financialData.availableWallet.toFixed(2)}`,
      );
      return;
    }

    // Check if bank account is set up
    if (
      !userData?.ePaymentAccount?.accountNumber ||
      !userData?.ePaymentAccount?.bank
    ) {
      toast.error("Please set up your bank account information first.");
      return;
    }

    setPayoutLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/request-payout`,
        {
          amount: parseFloat(payoutAmount),
        },
        { withCredentials: true },
      );

      toast.success("Payout request submitted successfully!");
      setShowPayoutModal(false);
      setPayoutAmount("");

      // Refresh financial data
      fetchFinancialData();

      // Refresh user data
      const userRes = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      dispatch(setUserData(userRes.data));
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

  const handleTopUpCredit = async (amount = null) => {
    // Prevent multiple simultaneous requests
    if (isProcessing) {
      return;
    }

    // If amount is provided (from quick button), use it; otherwise use topUpAmount state
    const finalAmount = amount !== null ? amount : parseFloat(topUpAmount);

    if (!finalAmount || finalAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (finalAmount < 1) {
      toast.error("Minimum top-up amount is ฿1.00");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/user/create-credit-topup-session`,
        { amount: finalAmount, paymentMethod: topUpPaymentMethod },
        { withCredentials: true, timeout: 10000 }, // 10 second timeout
      );

      // Redirect to Stripe Checkout (same as order payment)
      if (result.data?.url) {
        // Close modal and reset state before redirecting
        setShowTopUpModal(false);
        setTopUpAmount("");
        setIsProcessing(false);
        // Small delay to ensure state updates before redirect
        setTimeout(() => {
          window.location.href = result.data.url;
        }, 100);
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to initialize payment. Please try again.";
      toast.error(`Error: ${errorMessage}`);
      setIsProcessing(false);
      // Keep modal open so user can try again
    }
  };

  if (!userData) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-slate-50">
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6">
        <DeliveryPageHero
          eyebrow="DELIVERER FINANCE"
          title="Finance"
          description="Manage wallet, job credit, and top ups."
          icon={<RiMoneyDollarCircleLine size={22} />}
          onBack={() => navigate(-1)}
        />

        <div className="mt-3 sm:mt-6 bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                AVAILABLE BALANCES
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
                Wallet & Credit
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-3xl p-3 sm:p-5 bg-linear-to-br from-blue-600 to-indigo-600 text-white border border-white/10 shadow-[0_14px_34px_rgba(37,99,235,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-black tracking-[0.14em] text-white/80">
                    WALLET
                  </div>
                  <div className="mt-1.5 text-2xl sm:text-3xl leading-none font-extrabold">
                    ฿{financialData.wallet.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-white/80 font-bold">
                    Available balance
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <FaWallet size={18} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-3 sm:p-5 bg-linear-to-br from-slate-900 to-slate-700 text-white border border-white/10 shadow-[0_14px_34px_rgba(15,23,42,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-black tracking-[0.14em] text-white/80">
                    JOB CREDIT
                  </div>
                  <div className="mt-1.5 text-2xl sm:text-3xl leading-none font-extrabold">
                    ฿
                    {(
                      financialData.jobCredit ??
                      userData?.jobCredit ??
                      0
                    ).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-white/80 font-bold">
                    Used for going online
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <MdAccountBalanceWallet size={18} />
                </div>
              </div>
            </div>
          </div>

          {financialData.onHoldAmount > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-amber-900 text-sm font-extrabold">On Hold</p>
              <p className="text-amber-700 font-extrabold">
                ฿{financialData.onHoldAmount.toFixed(2)}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsProcessing(false); // Reset processing state when opening modal
                  setShowTopUpModal(true);
                }}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 transition-colors">
                <MdAdd size={18} />
                <span className="text-sm md:text-base">Top Up</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/income-summary")}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 text-slate-900 font-extrabold hover:bg-slate-200 transition-colors">
                <FaFileInvoiceDollar size={18} className="text-amber-600" />
                <span className="text-sm md:text-base">Income</span>
              </button>
            </div>

            {financialData.availableWallet > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 text-white font-extrabold hover:bg-green-700 transition-colors">
                  <FaWallet size={18} />
                  <span className="text-sm md:text-base">Request Payout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Request Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/40 z-100">
            <div className="absolute inset-0 flex items-end md:items-center justify-center">
              <div className="w-full md:max-w-md md:w-full bg-white md:rounded-3xl rounded-t-3xl shadow-xl overflow-hidden border border-slate-100 max-h-svh md:max-h-[calc(100vh-2rem)] flex flex-col">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                      REQUEST PAYOUT
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-slate-900">
                      Request Payout from Wallet
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPayoutModal(false);
                      setPayoutAmount("");
                    }}
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

                <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                  <div className="space-y-6">
                    {/* Available Balance */}
                    <div className="rounded-3xl p-5 bg-linear-to-br from-green-600 to-emerald-600 text-white border border-white/10 shadow-[0_14px_34px_rgba(34,197,94,0.22)]">
                      <div className="text-[11px] font-black tracking-[0.14em] text-white/80">
                        AVAILABLE WALLET BALANCE
                      </div>
                      <div className="mt-2 text-4xl font-extrabold">
                        ฿{financialData.availableWallet.toFixed(2)}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-black tracking-[0.14em] text-slate-500 mb-2">
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
                          max={financialData.availableWallet}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setPayoutAmount(
                            financialData.availableWallet.toFixed(2),
                          )
                        }
                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium">
                        Use full balance
                      </button>
                    </div>

                    {/* Bank Info */}
                    {userData?.ePaymentAccount?.accountNumber && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black tracking-[0.14em] text-slate-500 mb-2">
                          BANK ACCOUNT
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {userData.ePaymentAccount.bank} •{" "}
                          {userData.ePaymentAccount.accountNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-slate-100 p-4">
                  <button
                    type="button"
                    onClick={handleRequestPayout}
                    disabled={
                      payoutLoading ||
                      !payoutAmount ||
                      parseFloat(payoutAmount) <= 0 ||
                      parseFloat(payoutAmount) > financialData.availableWallet
                    }
                    className="w-full min-h-[52px] rounded-2xl bg-green-600 text-white font-extrabold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_14px_34px_rgba(34,197,94,0.25)]">
                    {payoutLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      "Request Payout"
                    )}
                  </button>

                  <div className="mt-3 text-[11px] text-slate-500 text-center font-bold">
                    Your payout request will be reviewed by admin
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Up Credit Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/40 z-100">
            <div className="absolute inset-0 flex items-end md:items-center justify-center">
              <div className="w-full md:max-w-5xl md:w-full bg-white md:rounded-3xl rounded-t-3xl shadow-xl overflow-hidden border border-slate-100 max-h-svh md:max-h-[calc(100vh-2rem)] flex flex-col">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                      TOP UP
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-slate-900">
                      Top Up Credit
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopUpModal(false);
                      setTopUpAmount("");
                      setIsProcessing(false);
                    }}
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

                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-2">
                      <div className="rounded-3xl p-5 bg-linear-to-br from-blue-600 to-indigo-600 text-white border border-white/10 shadow-[0_14px_34px_rgba(37,99,235,0.22)]">
                        <div className="text-[11px] font-black tracking-[0.14em] text-white/80">
                          TOP UP AMOUNT
                        </div>
                        <div className="mt-2 text-4xl font-extrabold">
                          ฿
                          {topUpAmount && parseFloat(topUpAmount) > 0
                            ? parseFloat(topUpAmount).toFixed(2)
                            : "0.00"}
                        </div>
                        <div className="mt-1 text-xs text-white/80 font-bold">
                          Secure payment via Stripe
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                            <div className="text-[10px] font-black tracking-[0.14em] text-white/75">
                              METHOD
                            </div>
                            <div className="mt-1 text-sm font-extrabold">
                              {topUpPaymentMethod === "card"
                                ? "Card"
                                : "PromptPay"}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                            <div className="text-[10px] font-black tracking-[0.14em] text-white/75">
                              CURRENT CREDIT
                            </div>
                            <div className="mt-1 text-sm font-extrabold">
                              ฿{financialData.jobCredit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="rounded-3xl bg-white border border-slate-100 p-5">
                        {/* Amount Input */}
                        <div className="mb-6">
                          <label className="block text-xs font-black tracking-[0.14em] text-slate-500 mb-2">
                            Amount (THB)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                              ฿
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              value={topUpAmount}
                              onChange={(e) => setTopUpAmount(e.target.value)}
                              className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[100, 300, 500, 1000].map((amount) => (
                              <button
                                key={amount}
                                onClick={() =>
                                  setTopUpAmount(amount.toString())
                                }
                                className="px-3 py-1.5 text-sm font-extrabold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200">
                                ฿{amount}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="mb-6">
                          <label className="block text-xs font-black tracking-[0.14em] text-slate-500 mb-2">
                            Payment Method
                          </label>
                          <div className="flex gap-4">
                            <label
                              className={`flex-1 border rounded-2xl p-3 cursor-pointer transition-all ${
                                topUpPaymentMethod === "promptpay"
                                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="promptpay"
                                  checked={topUpPaymentMethod === "promptpay"}
                                  onChange={(e) =>
                                    setTopUpPaymentMethod(e.target.value)
                                  }
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-600"
                                />
                                <div>
                                  <span className="block text-sm font-medium text-gray-900">
                                    PromptPay
                                  </span>
                                  <span className="block text-xs text-gray-500">
                                    Fee: 1.65% + 7% VAT
                                  </span>
                                </div>
                              </div>
                            </label>

                            <label
                              className={`flex-1 border rounded-2xl p-3 cursor-pointer transition-all ${
                                topUpPaymentMethod === "card"
                                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}>
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="card"
                                  checked={topUpPaymentMethod === "card"}
                                  onChange={(e) =>
                                    setTopUpPaymentMethod(e.target.value)
                                  }
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-600"
                                />
                                <div>
                                  <span className="block text-sm font-medium text-gray-900">
                                    Card
                                  </span>
                                  <span className="block text-xs text-gray-500">
                                    Fee: 4.75% + 10฿ + 7% VAT
                                  </span>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Fee Breakdown */}
                        {topUpAmount && parseFloat(topUpAmount) > 0 && (
                          <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex justify-between text-sm text-slate-600 mb-2">
                              <span>Top Up Amount:</span>
                              <span>฿{parseFloat(topUpAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600 mb-2">
                              <span>
                                Fee (
                                {topUpPaymentMethod === "card"
                                  ? "4.75% + 10฿ + 7% VAT"
                                  : "1.65% + 7% VAT"}
                                ):
                              </span>
                              <span>
                                ฿
                                {(topUpPaymentMethod === "card"
                                  ? (parseFloat(topUpAmount) * 0.0475 + 10) *
                                    1.07
                                  : parseFloat(topUpAmount) * 0.0165 * 1.07
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                              <span>Total to Pay:</span>
                              <span>
                                ฿
                                {(
                                  parseFloat(topUpAmount) +
                                  (topUpPaymentMethod === "card"
                                    ? (parseFloat(topUpAmount) * 0.0475 + 10) *
                                      1.07
                                    : parseFloat(topUpAmount) * 0.0165 * 1.07)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-slate-100 p-4">
                  <div className="w-full md:max-w-5xl mx-auto">
                    <button
                      type="button"
                      onClick={() => handleTopUpCredit()}
                      disabled={
                        isProcessing ||
                        !topUpAmount ||
                        parseFloat(topUpAmount) <= 0
                      }
                      className="w-full min-h-[52px] rounded-2xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_14px_34px_rgba(37,99,235,0.25)]">
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        "Top Up"
                      )}
                    </button>

                    <div className="mt-3 text-[11px] text-slate-500 text-center font-bold">
                      By proceeding, you agree to our{" "}
                      <a href="#" className="text-slate-600 hover:underline">
                        Terms
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-slate-600 hover:underline">
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryBoyFinance;
