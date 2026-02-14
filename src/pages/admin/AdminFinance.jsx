import React, { useEffect, useState } from "react";
import {
  FaWallet,
  FaMoneyBillWave,
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaBan,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

const AdminFinance = () => {
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/finance`, {
        withCredentials: true,
      });
      setFinancials(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load financial data");
      setLoading(false);
    }
  };

  const handleProcessPayout = async (payoutId, status) => {
    try {
      await axios.put(
        `${serverUrl}/api/admin/payout/${payoutId}/process`,
        { status },
        { withCredentials: true },
      );
      toast.success(`Payout ${status}`);
      fetchFinancials();
    } catch (error) {
      toast.error("Failed to process payout");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalGMV = financials?.totalGMV ?? 0;
  const platformNetIncome = financials?.totalRevenue ?? 0;
  const pendingPayouts = financials?.pendingPayouts ?? [];
  const payoutHistory = financials?.payoutHistory ?? [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Financial Overview
        </h2>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg shadow-purple-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FaWallet size={24} />
            </div>
            <span className="font-bold text-lg opacity-80">
              Total Sales Value (Gross)
            </span>
          </div>
          <h3 className="text-4xl font-extrabold">
            ฿{Number(totalGMV || 0).toLocaleString()}
          </h3>
          <p className="text-sm opacity-60 mt-2">
            Total value of delivered orders (GMV)
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <FaMoneyBillWave size={24} />
            </div>
            <span className="font-bold text-gray-500 uppercase tracking-wider text-sm">
              Platform Net Income
            </span>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900">
            ฿{Number(platformNetIncome || 0).toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Commission/fees earned by platform
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-gray-900">
            Pending Payout Requests
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
            {pendingPayouts.length}
          </span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-extrabold text-gray-900 mb-6">
          Pending Payout Requests
        </h3>
        <div className="space-y-4">
          {pendingPayouts.map((payout) => (
            <div
              key={payout._id}
              className="p-4 rounded-2xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50 transition-all flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">
                  {payout.requesterType === "shop" && payout.shop?.name
                    ? payout.shop.name
                    : payout.user?.fullName || "Unknown User"}
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">
                  {payout.requesterType === "shop"
                    ? "Shop"
                    : payout.requesterType === "deliverer"
                      ? "Deliverer"
                      : payout.user?.role || "User"}
                </p>
                {payout.requesterType === "shop" && payout.user?.fullName && (
                  <p className="text-xs text-gray-400 mt-1">
                    Owner: {payout.user.fullName}
                  </p>
                )}
                <p className="font-mono text-xs text-gray-400 mt-1">
                  Bank: {payout.bankInfo}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-extrabold text-lg text-gray-900">
                  ฿{payout.amount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProcessPayout(payout._id, "paid")}
                    className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                    title="Mark as Completed (Paid)">
                    <FaCheck size={10} />
                    Complete
                  </button>
                  <button
                    onClick={() => handleProcessPayout(payout._id, "rejected")}
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                    title="Reject">
                    <FaBan size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingPayouts.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              No pending payouts.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-extrabold text-gray-900 mb-6">
          Completed Payout History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payoutHistory.map((payout) => (
                <tr
                  key={payout._id}
                  className="hover:bg-white transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">
                      {payout.requesterType === "shop" && payout.shop?.name
                        ? payout.shop.name
                        : payout.user?.fullName || "Unknown"}
                    </div>
                    {payout.requesterType === "shop" &&
                      payout.user?.fullName && (
                        <div className="text-xs text-gray-400">
                          Owner: {payout.user.fullName}
                        </div>
                      )}
                    <div className="text-xs text-gray-400 font-mono">
                      {payout._id?.slice(-6)}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {payout.requesterType === "shop"
                      ? "Shop"
                      : payout.requesterType === "deliverer"
                        ? "Deliverer"
                        : payout.user?.role || "-"}
                  </td>
                  <td className="p-4 font-extrabold text-gray-900">
                    ฿{Number(payout.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        payout.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : payout.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : payout.status === "approved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                      }`}>
                      {payout.status === "paid" ? "Completed" : payout.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(
                      payout.updatedAt || payout.createdAt,
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
              {payoutHistory.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-gray-400 font-medium">
                    No payout history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
