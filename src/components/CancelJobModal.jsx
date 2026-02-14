import React, { useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";

function CancelJobModal({ isOpen, onClose, orderId, shopId, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCancel = async () => {
    setError("");
    setSubmitting(true);

    try {
      await axios.post(
        `${serverUrl}/api/order/cancel-job/${orderId}/${shopId}`,
        {},
        { withCredentials: true }
      );

      toast.success("Job cancelled successfully. The job is now available for other deliverers.");
      onSuccess?.();
      onClose();
    } catch (error) {

      const errorMsg =
        error?.response?.data?.message ||
        "Failed to cancel job. Please try again.";
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
          <h2 className="text-xl font-bold text-gray-900">
            Cancel Job
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to cancel this job? The job will become available for other deliverers to accept. The order itself will not be cancelled.
          </p>

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
              Keep Job
            </button>
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Cancelling..." : "Cancel Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelJobModal;

