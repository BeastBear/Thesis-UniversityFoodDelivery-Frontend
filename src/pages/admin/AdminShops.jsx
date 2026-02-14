import React, { useEffect, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaSearch,
  FaStore,
  FaEllipsisV,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

import Pagination from "../../components/ui/Pagination";

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all"); // Approved/Pending
  const [statusFilter, setStatusFilter] = useState("all"); // Open/Closed (Admin)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [openMenuShopId, setOpenMenuShopId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/shops`, {
        withCredentials: true,
      });
      setShops(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load restaurants");
      setLoading(false);
    }
  };

  const handleApproveShop = async (shopId, currentStatus) => {
    try {
      await axios.put(
        `${serverUrl}/api/admin/shop/${shopId}/approve`,
        { isApproved: !currentStatus },
        { withCredentials: true },
      );
      toast.success(
        `Restaurant ${!currentStatus ? "approved" : "revoked"} successfully`,
      );
      fetchShops();
    } catch (error) {
      toast.error("Failed to update restaurant status");
    }
  };

  const handleToggleShopClosure = async (shopId, currentClosure) => {
    try {
      await axios.put(
        `${serverUrl}/api/admin/shop/${shopId}/closure`,
        { temporaryClosure: { isClosed: !currentClosure } },
        { withCredentials: true },
      );
      toast.success(
        `Restaurant ${!currentClosure ? "closed" : "opened"} successfully`,
      );
      fetchShops();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      toast.error(message || "Failed to update restaurant closure status");
    }
  };

  const filteredShops = shops.filter((shop) => {
    // Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      shop.name.toLowerCase().includes(searchLower) ||
      shop.owner?.fullName?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Approval Filter
    if (approvalFilter === "approved" && !shop.isApproved) return false;
    if (approvalFilter === "pending" && shop.isApproved) return false;

    // Status Filter (Admin Closure)
    if (statusFilter === "closed" && !shop.temporaryClosure?.isClosed)
      return false;
    if (statusFilter === "open" && shop.temporaryClosure?.isClosed)
      return false;

    return true;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShops = filteredShops.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detailOpen && selectedShop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => setDetailOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close shop details"
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Restaurant Details
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1 truncate">
                  {selectedShop.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedShop.cafeteria}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                  {selectedShop.image ? (
                    <img
                      src={selectedShop.image}
                      alt={selectedShop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FaStore />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">
                    Owner: {selectedShop.owner?.fullName || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 break-all mt-1">
                    ShopId: {selectedShop._id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Approval
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedShop.isApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                      {selectedShop.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Admin Closure
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedShop.temporaryClosure?.isClosed
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                      {selectedShop.temporaryClosure?.isClosed
                        ? "Closed"
                        : "Open"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Approval Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {[
              { key: "all", label: "All" },
              { key: "approved", label: "Approved" },
              { key: "pending", label: "Pending" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setApprovalFilter(t.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  approvalFilter === t.key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {[
              { key: "all", label: "All Status" },
              { key: "open", label: "Open" },
              { key: "closed", label: "Admin Closed" },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStatusFilter(s.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s.key
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-500 hover:bg-white"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 text-gray-400 text-[11px] font-black uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">Restaurant</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Cafeteria</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentShops.map((shop) => (
                <tr
                  key={shop._id}
                  className="hover:bg-white/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">
                        {shop.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {shop.owner?.fullName || "Unknown"}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide">
                      {shop.cafeteria}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          shop.isApproved
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}>
                        {shop.isApproved ? "Approved" : "Pending"}
                      </span>
                      {shop.temporaryClosure?.isClosed === true && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-600">
                          Closed by Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center gap-2">
                      {/* Actions logic remains same, just adjusted button styles slightly if needed */}
                      <button
                        onClick={() =>
                          handleApproveShop(shop._id, shop.isApproved)
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                          shop.isApproved
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}>
                        {shop.isApproved ? (
                          <>
                            <FaTimes size={10} /> Revoke
                          </>
                        ) : (
                          <>
                            <FaCheck size={10} /> Approve
                          </>
                        )}
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuShopId((prev) =>
                              prev === shop._id ? null : shop._id,
                            )
                          }
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                          aria-label="Open shop actions">
                          <FaEllipsisV size={12} />
                        </button>

                        {openMenuShopId === shop._id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedShop(shop);
                                setDetailOpen(true);
                                setOpenMenuShopId(null);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white flex items-center gap-2">
                              <FaStore className="text-gray-400" /> View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuShopId(null);
                                if (
                                  !window.confirm(
                                    `Are you sure you want to ${
                                      shop.temporaryClosure?.isClosed
                                        ? "reopen"
                                        : "force close"
                                    } this restaurant?`,
                                  )
                                )
                                  return;
                                handleToggleShopClosure(
                                  shop._id,
                                  shop.temporaryClosure?.isClosed,
                                );
                              }}
                              className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-red-50 flex items-center gap-2 ${
                                shop.temporaryClosure?.isClosed
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}>
                              {shop.temporaryClosure?.isClosed ? (
                                <FaCheck className="text-green-500" />
                              ) : (
                                <FaTimes className="text-red-500" />
                              )}
                              {shop.temporaryClosure?.isClosed
                                ? "Reopen Restaurant"
                                : "Force Close Restaurant"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShops.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                        <FaSearch className="text-gray-300 text-xl" />
                      </div>
                      <p>No restaurants found.</p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setApprovalFilter("all");
                          setStatusFilter("all");
                        }}
                        className="mt-2 text-purple-600 font-bold hover:underline">
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredShops.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white/30">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredShops.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShops;
