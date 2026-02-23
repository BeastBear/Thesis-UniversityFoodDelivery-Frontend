import React, { useEffect, useState } from "react";
import { FaClipboardList, FaSearch, FaTruck, FaEdit } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("live");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/orders`, {
        withCredentials: true,
      });
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load orders");
      setLoading(false);
    }
  };

  const normalizeStatus = (status) =>
    String(status || "")
      .trim()
      .toLowerCase();

  const formatOptionValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number")
      return String(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value))
      return value
        .map((v) => formatOptionValue(v))
        .filter(Boolean)
        .join(" / ");
    if (typeof value === "object") {
      if (typeof value.label === "string") return value.label;
      if (typeof value.name === "string") return value.name;
      if (typeof value.title === "string") return value.title;
      if (
        value.value !== undefined &&
        (typeof value.value === "string" ||
          typeof value.value === "number" ||
          typeof value.value === "boolean")
      )
        return String(value.value);
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const formatSelectedOptions = (selectedOptions) => {
    if (!selectedOptions || typeof selectedOptions !== "object") return "";
    return Object.entries(selectedOptions)
      .map(([k, v]) => {
        const formatted = formatOptionValue(v);
        return formatted ? `${k}: ${formatted}` : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  const getTabForStatus = (status) => {
    const s = normalizeStatus(status);
    if (["delivered"].includes(s)) return "completed";
    if (["cancelled", "canceled"].includes(s)) return "cancelled";
    return "live";
  };

  const handleUpdateOrderStatus = (orderId, shopOrderId, newStatus) => {
    setPendingStatusUpdate({ orderId, shopOrderId, newStatus });
    setConfirmOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;
    const { orderId, shopOrderId, newStatus } = pendingStatusUpdate;

    try {
      setConfirmLoading(true);
      await axios.put(
        `${serverUrl}/api/admin/order/${orderId}/status/${shopOrderId}`,
        { status: newStatus },
        { withCredentials: true },
      );
      toast.success("Order status updated");
      setConfirmOpen(false);
      setPendingStatusUpdate(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReassignDeliverer = async (orderId, shopOrderId) => {
    const newDelivererId = window.prompt(
      "Enter Deliverer userId to assign (get it from Admin > Users, role=deliveryBoy). Leave empty to unassign:",
    );
    if (newDelivererId === null) return;

    try {
      await axios.put(
        `${serverUrl}/api/admin/order/${orderId}/reassign/${shopOrderId}`,
        { newDelivererId: newDelivererId.trim() || null },
        { withCredentials: true },
      );
      toast.success("Deliverer reassigned successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to reassign deliverer");
    }
  };

  // Flatten orders for display (since orders have shopOrders inside)
  const flattenedOrders = orders
    .flatMap((order) =>
      order.shopOrders.map((shopOrder) => ({
        ...shopOrder,
        parentOrderId:
          typeof order.orderId === "string" && order.orderId.startsWith("LMF-")
            ? order._id
            : order.orderId || order._id,
        user: order.user,
        fullOrderId: order._id,
        createdAt: order.createdAt,
      })),
    )
    .filter(
      (item) =>
        String(item.parentOrderId || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const visibleOrders = flattenedOrders.filter(
    (item) => getTabForStatus(item.status) === statusTab,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => {
              if (confirmLoading) return;
              setConfirmOpen(false);
              setPendingStatusUpdate(null);
            }}
            className="fixed inset-0 bg-black/40"
            aria-label="Close confirmation"
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Confirm Action
              </div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">
                Update Order Status
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Are you sure you want to update status to
                <span className="font-extrabold text-gray-900">
                  {" "}
                  {pendingStatusUpdate?.newStatus}
                </span>
                ?
              </div>
            </div>

            <div className="p-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => {
                  if (confirmLoading) return;
                  setConfirmOpen(false);
                  setPendingStatusUpdate(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={confirmStatusUpdate}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:active:scale-100">
                {confirmLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => setDetailOpen(false)}
            className="fixed inset-0 bg-black/40"
            aria-label="Close order details"
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Order Details
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  #{String(selectedOrder.parentOrderId || "").slice(-4)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString()
                    : ""}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-700">
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Amount
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-gray-900">
                    ฿
                    {typeof selectedOrder.subtotal === "number"
                      ? selectedOrder.subtotal
                      : typeof selectedOrder.totalAmount === "number"
                        ? selectedOrder.totalAmount
                        : 0}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Restaurant
                </div>
                <div className="mt-2 text-sm font-bold text-gray-900">
                  {selectedOrder.shop?.name || ""}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Customer
                </div>
                <div className="mt-2 text-sm font-bold text-gray-900">
                  {selectedOrder.user?.fullName || ""}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Deliverer
                </div>
                <div className="mt-2 text-sm font-bold text-gray-900">
                  {selectedOrder.assignedDeliveryBoy
                    ? typeof selectedOrder.assignedDeliveryBoy === "object"
                      ? selectedOrder.assignedDeliveryBoy.fullName || "Assigned"
                      : "Assigned"
                    : "Unassigned"}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Items
                </div>
                {Array.isArray(selectedOrder.shopOrderItems) &&
                selectedOrder.shopOrderItems.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {selectedOrder.shopOrderItems.map((it, idx) => (
                      <div
                        key={it?._id || `${it?.item || "item"}-${idx}`}
                        className="flex items-start justify-between gap-4 border border-gray-100 bg-white rounded-2xl p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 truncate">
                            {it?.name || "Item"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Qty:{" "}
                            <span className="font-bold">
                              {it?.quantity || 0}
                            </span>
                          </div>
                          {it?.specialInstructions ? (
                            <div className="text-xs text-gray-500 mt-1">
                              Note:{" "}
                              <span className="font-bold">
                                {it.specialInstructions}
                              </span>
                            </div>
                          ) : null}
                          {it?.selectedOptions &&
                          typeof it.selectedOptions === "object" &&
                          Object.keys(it.selectedOptions).length > 0 ? (
                            <div className="text-xs text-gray-500 mt-1 warp-break-words">
                              Options:{" "}
                              <span className="font-bold">
                                {formatSelectedOptions(it.selectedOptions) ||
                                  "-"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-gray-500 font-bold uppercase">
                            Price
                          </div>
                          <div className="text-sm font-extrabold text-gray-900 mt-1">
                            ฿{typeof it?.price === "number" ? it.price : 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">
                    No items found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Order Management
        </h2>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setStatusTab("live")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              statusTab === "live"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-white"
            }`}>
            Live/Active
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("completed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              statusTab === "completed"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-white"
            }`}>
            Completed
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("cancelled")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              statusTab === "cancelled"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-white"
            }`}>
            Cancelled
          </button>
        </div>
        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Order ID, User, or Restaurant..."
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-6">Order ID</th>
                <th className="p-6">Details</th>
                <th className="p-6">Status</th>
                <th className="p-6">Deliverer</th>
                <th className="p-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleOrders.map((item) => (
                <tr key={item._id} className="hover:bg-white transition-colors">
                  <td className="p-6">
                    <span className="font-mono font-bold text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                      #{String(item.parentOrderId || "").slice(-4)}
                    </span>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold text-gray-900">
                        {item.shop?.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        Cust: {item.user?.fullName}
                      </div>
                      <div className="text-xs font-bold text-purple-600 mt-1">
                        ฿
                        {typeof item.subtotal === "number"
                          ? item.subtotal
                          : typeof item.totalAmount === "number"
                            ? item.totalAmount
                            : 0}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                 ${
                                   item.status === "delivered"
                                     ? "bg-green-100 text-green-700"
                                     : item.status === "cancelled"
                                       ? "bg-red-100 text-red-700"
                                       : item.status === "preparing"
                                         ? "bg-orange-100 text-orange-700"
                                         : "bg-blue-100 text-blue-700"
                                 }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-gray-600">
                    {item.assignedDeliveryBoy ? (
                      <div className="flex items-center gap-2">
                        <FaTruck className="text-green-500" />
                        <span>
                          {typeof item.assignedDeliveryBoy === "object"
                            ? item.assignedDeliveryBoy.fullName || "Assigned"
                            : "Assigned"}
                        </span>
                        <span className="text-gray-400 text-xs">
                          (
                          {typeof item.assignedDeliveryBoy === "object" &&
                          item.assignedDeliveryBoy._id
                            ? item.assignedDeliveryBoy._id.slice(-4)
                            : String(item.assignedDeliveryBoy || "").slice(-4)}
                          )
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const s = normalizeStatus(item.status);
                        const isAssigned = !!item.assignedDeliveryBoy;

                        if (s === "pending") {
                          return (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    item.fullOrderId,
                                    item._id,
                                    "preparing",
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors">
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    item.fullOrderId,
                                    item._id,
                                    "cancelled",
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors">
                                Reject
                              </button>
                            </div>
                          );
                        }

                        if (["preparing", "cooking"].includes(s)) {
                          return (
                            <div className="flex flex-col gap-2">
                              {!isAssigned && (
                                <button
                                  onClick={() =>
                                    handleReassignDeliverer(
                                      item.fullOrderId,
                                      item._id,
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all active:scale-95">
                                  Assign Deliverer
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  (() => {
                                    setSelectedOrder(item);
                                    setDetailOpen(true);
                                  })()
                                }
                                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors">
                                View Details
                              </button>
                            </div>
                          );
                        }

                        if (
                          ["delivered", "cancelled", "canceled"].includes(s)
                        ) {
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                (() => {
                                  setSelectedOrder(item);
                                  setDetailOpen(true);
                                })()
                              }
                              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors">
                              View Details
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() =>
                              (() => {
                                setSelectedOrder(item);
                                setDetailOpen(true);
                              })()
                            }
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors">
                            View Details
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-gray-400 font-medium">
                    No orders found.
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

export default AdminOrders;
