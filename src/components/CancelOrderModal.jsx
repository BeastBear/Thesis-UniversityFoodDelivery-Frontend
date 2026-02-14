import React, { useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";

function CancelOrderModal({ isOpen, onClose, orderId, shopId, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const predefinedReasons = [
    { id: "customer_request", label: "Customer requested cancellation" },
    { id: "delivery_issue", label: "Delivery issue" },
    { id: "restaurant_issue", label: "Restaurant issue" },
    { id: "other", label: "Other reason" },
  ];

  if (!isOpen) return null;

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    setCustomReason("");
  };

  const handleCancel = async () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      setError("Please specify a reason");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const cancelReason =
        selectedReason === "other"
          ? customReason.trim()
          : predefinedReasons.find((r) => r.id === selectedReason)?.label || "";

      await axios.post(
        `${serverUrl}/api/order/cancel-order/${orderId}/${shopId}`,
        { reason: cancelReason },
        { withCredentials: true },
      );

      toast.success("Order cancelled successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        "Failed to cancel order. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-lg border-none overflow-hidden max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Cancel Order</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-6">
            Please provide a reason for cancelling this order.
          </p>

          {/* Reason Options */}
          <div className="space-y-3 mb-6">
            {predefinedReasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                className={`w-full py-3 px-4 rounded-2xl text-left transition-colors font-medium ${
                  selectedReason === reason.id
                    ? "bg-primary-orange/10 text-primary-orange border-2 border-primary-orange"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}>
                {reason.label}
              </button>
            ))}

            {/* Custom Reason Option */}
            {selectedReason === "other" && (
              <div className="mt-4">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify the reason..."
                  className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-orange resize-none"
                  rows="3"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleCancel}
              disabled={submitting || !selectedReason}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
