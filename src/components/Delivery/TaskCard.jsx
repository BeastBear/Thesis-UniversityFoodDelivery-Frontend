import React, { useMemo, useState, useEffect } from "react";
import { FaStore } from "react-icons/fa";

const TaskCard = ({
  assignment,
  onAccept,
  isAccepting = false,
  delivererLocation = null,
  onTimeout,
}) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds countdown
  const [isVisible, setIsVisible] = useState(true);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsVisible(false);
      onTimeout?.(assignment.assignmentId);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, assignment.assignmentId, onTimeout]);

  // Reset timer when assignment changes
  useEffect(() => {
    setTimeLeft(30);
    setIsVisible(true);
  }, [assignment.assignmentId]);

  if (!isVisible) {
    return null; // Don't render if timed out
  }
  const shopName = assignment.shopName || "Unknown Shop";
  const distance = useMemo(() => {
    const explicit = Number(
      assignment?.distanceKm ?? assignment?.distanceToShop,
    );
    if (Number.isFinite(explicit) && explicit > 0) return explicit.toFixed(1);

    const pickupLat =
      assignment?.pickupLocation?.latitude ??
      assignment?.shopLocation?.latitude;
    const pickupLon =
      assignment?.pickupLocation?.longitude ??
      assignment?.shopLocation?.longitude;
    const delivererLat = delivererLocation?.lat;
    const delivererLon = delivererLocation?.lon;

    const destLat =
      assignment?.deliveryAddress?.latitude ??
      assignment?.deliveryAddress?.lat ??
      assignment?.deliveryAddress?.lng;
    const destLon =
      assignment?.deliveryAddress?.longitude ??
      assignment?.deliveryAddress?.lon ??
      assignment?.deliveryAddress?.lng;

    const hasPickup =
      Number.isFinite(Number(pickupLat)) && Number.isFinite(Number(pickupLon));
    const hasDeliverer =
      Number.isFinite(Number(delivererLat)) &&
      Number.isFinite(Number(delivererLon));
    const hasDest =
      Number.isFinite(Number(destLat)) && Number.isFinite(Number(destLon));

    // Prefer deliverer -> pickup distance. If deliverer location not available, fallback to pickup -> customer.
    const fromLat = hasDeliverer
      ? Number(delivererLat)
      : hasPickup
        ? Number(pickupLat)
        : null;
    const fromLon = hasDeliverer
      ? Number(delivererLon)
      : hasPickup
        ? Number(pickupLon)
        : null;
    const toLat = hasDeliverer
      ? hasPickup
        ? Number(pickupLat)
        : null
      : hasDest
        ? Number(destLat)
        : null;
    const toLon = hasDeliverer
      ? hasPickup
        ? Number(pickupLon)
        : null
      : hasDest
        ? Number(destLon)
        : null;

    if (
      !Number.isFinite(fromLat) ||
      !Number.isFinite(fromLon) ||
      !Number.isFinite(toLat) ||
      !Number.isFinite(toLon)
    ) {
      return "?.?";
    }

    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(Number(toLat) - Number(fromLat));
    const dLon = toRad(Number(toLon) - Number(fromLon));
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(Number(fromLat))) *
        Math.cos(toRad(Number(toLat))) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    return Number.isFinite(km) ? km.toFixed(1) : "?.?";
  }, [
    assignment?.distanceKm,
    assignment?.distanceToShop,
    assignment?.pickupLocation,
    assignment?.shopLocation,
    delivererLocation?.lat,
    delivererLocation?.lon,
  ]);
  const fee = assignment.deliveryFee || 0;
  const itemsCount = assignment.totalItems || 1;
  const displayOrderId =
    assignment?.readableOrderId || assignment?.orderId || "";

  // Mock location names for display if not provided
  const deliveryLocation =
    assignment?.deliveryAddress?.text ||
    assignment?.deliveryAddressText ||
    assignment?.deliveryAddress?.address ||
    assignment?.deliveryAddress?.fullAddress ||
    assignment?.shippingAddress?.address ||
    "Customer Location";

  return (
    <div className="bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-primary-blue/10 text-primary-blue border border-primary-blue/20 flex items-center justify-center shrink-0">
            <FaStore />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 truncate">{shopName}</h3>
              {/* Countdown timer */}
              <div
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  timeLeft <= 10
                    ? "bg-red-100 text-red-700 animate-pulse"
                    : timeLeft <= 20
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}>
                {timeLeft}s
              </div>
            </div>
            <div className="text-sm text-gray-500 truncate">
              To: {deliveryLocation}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Est. {distance} km • {itemsCount} items • Order #
              {String(displayOrderId).slice(-4)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-left sm:text-right">
            <div className="text-lg font-extrabold text-gray-900">
              ฿{fee.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Payout</div>
          </div>
          <button
            onClick={() => onAccept(assignment.assignmentId)}
            disabled={isAccepting}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-2xl bg-primary-blue text-white font-extrabold shadow-lg shadow-primary-blue/20 hover:bg-primary-blue/90 disabled:bg-gray-300 disabled:text-gray-600 disabled:hover:bg-gray-300 transition-colors">
            {isAccepting ? "Accepting..." : "Accept Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
