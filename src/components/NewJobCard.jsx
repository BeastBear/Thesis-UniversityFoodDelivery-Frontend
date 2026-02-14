import React from "react";
import {
  FaMotorcycle,
  FaClock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const NewJobCard = ({ assignment, onAccept, onDismiss }) => {
  const earnings = Number(assignment?.deliveryFee || 0).toFixed(2);
  const shopName = assignment?.shopName || "Restaurant";
  const distance = assignment?.distance
    ? `${assignment.distance.toFixed(1)} km`
    : "Unknown";
  const createdAt = assignment?.createdAt
    ? new Date(assignment.createdAt).toLocaleString()
    : "Just now";
  const orderId =
    assignment?.readableOrderId || assignment?.orderId?.slice(-6) || "N/A";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaMotorcycle className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">New Job Available</h3>
            <p className="text-xs text-gray-500">{createdAt}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Dismiss notification">
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

      {/* Job Details */}
      <div className="space-y-3">
        {/* Shop Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{shopName}</p>
            <p className="text-sm text-gray-500">Order ID: #{orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">฿{earnings}</p>
            <p className="text-xs text-gray-500">Delivery Fee</p>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <FaMapMarkerAlt className="text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">Distance</p>
            <p className="text-sm font-bold text-gray-900">{distance}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <FaClock className="text-orange-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">Status</p>
            <p className="text-sm font-bold text-gray-900 capitalize">
              {assignment?.status || "Preparing"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <FaMoneyBillWave className="text-green-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">Items</p>
            <p className="text-sm font-bold text-gray-900">
              {assignment?.items?.length || 0} items
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        {assignment?.deliveryAddress?.text && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-blue-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Delivery Address
                </p>
                <p className="text-sm text-gray-900">
                  {assignment.deliveryAddress.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
            Dismiss
          </button>
          <button
            onClick={() => onAccept(assignment.assignmentId)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Accept Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewJobCard;
