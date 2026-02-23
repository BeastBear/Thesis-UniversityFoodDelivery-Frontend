import React from "react";
import { FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const formatSelectedOptions = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== "object") return "";

  const parts = [];
  Object.values(selectedOptions).forEach((value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      const names = value
        .map((v) => (typeof v === "string" ? v : v?.name))
        .filter(Boolean);
      if (names.length) parts.push(names.join(", "));
      return;
    }

    if (typeof value === "object") {
      if (typeof value.name === "string") {
        parts.push(value.name);
        return;
      }

      const names = Object.keys(value).filter((k) => value[k]);
      if (names.length) parts.push(names.join(", "));
      return;
    }

    if (typeof value === "string") {
      parts.push(value);
      return;
    }
  });

  return parts.filter(Boolean).join(" • ");
};

const ActiveOrderPanel = ({
  order,
  status, // 'traveling_to_restaurant', 'at_restaurant', 'traveling_to_customer'
  onAction, // Action handler (Arrived, Picked Up, Delivered)
  actionLabel,
  actionDisabled = false,
  actionHint,
  role = "deliveryBoy",
  absolute = true,
}) => {
  if (!order) return null;

  const shopName =
    order.shopOrder?.shop?.name || order.shopOrder?.shopName || "Shop";
  const customerName = order.user?.fullName || "Customer";
  const customerPhone =
    order.user?.mobile || order.user?.phoneNumber || order.user?.phone || "N/A";
  const ownerPhone =
    order.shopOrder?.owner?.mobile ||
    order.shopOrder?.owner?.phoneNumber ||
    order.shopOrder?.owner?.phone ||
    order.shopOrder?.shop?.owner?.mobile ||
    order.shopOrder?.shop?.owner?.phoneNumber ||
    order.shopOrder?.shop?.owner?.phone ||
    "";
  const shopPhone =
    order.shopOrder?.shop?.mobile ||
    order.shopOrder?.shop?.phoneNumber ||
    order.shopOrder?.shop?.phone ||
    order.shopOrder?.shop?.shopNumber ||
    order.shopOrder?.shopPhone ||
    order.shopOrder?.shopMobile ||
    "";
  const shopAddress =
    order.shopOrder?.shop?.address || order.shopOrder?.shopAddress || "";
  const shippingAddress =
    order.deliveryAddress?.text ||
    order.shippingAddress?.address ||
    order.shippingAddress?.fullAddress ||
    "";
  const items = order.shopOrder?.items || [];
  const orderItems = Array.isArray(order.shopOrder?.shopOrderItems)
    ? order.shopOrder.shopOrderItems
    : [];
  const displayItems = orderItems.length > 0 ? orderItems : items;

  // Determine content based on status
  const isPickupPhase =
    status === "traveling_to_restaurant" || status === "at_restaurant";

  const isConfirmDelivery = status === "confirming_delivery";
  const isCompleted = status === "completed";

  const showLocation = status !== "at_restaurant";
  const orderId =
    typeof order?._id === "string" || typeof order?._id === "number"
      ? String(order._id)
      : "";
  const orderIdShort = orderId ? orderId.slice(-6).toUpperCase() : "";

  const subtotal = Number(order?.shopOrder?.subtotal ?? 0);
  const payRestaurant =
    String(order?.paymentMethod || "").toLowerCase() === "cod" ? subtotal : 0;

  const callTarget = isPickupPhase ? ownerPhone || shopPhone : customerPhone;
  const normalizedPhone = String(callTarget || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");
  const canCall = normalizedPhone.length >= 6;

  return (
    <div
      className={`${
        absolute ? "absolute bottom-0 left-0 right-0" : "relative"
      } bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(15,23,42,0.12)] z-20 transition-transform duration-300`}>
      <div className="w-12 h-1.5  rounded-full mx-auto mt-3 mb-1"></div>

      <div className="p-4 sm:p-6 pt-2">
        {/* Status Header */}
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {isPickupPhase
              ? "Pick up Order #" + orderIdShort
              : isCompleted
                ? "Order Completed"
                : isConfirmDelivery
                  ? "Complete Delivery"
                  : "Deliver Order"}
          </h2>
          <p className="text-sm text-gray-500">
            {isPickupPhase
              ? "Go to the restaurant"
              : isCompleted
                ? "Great job. Ready for the next one?"
                : isConfirmDelivery
                  ? "Confirm payment and finish this job"
                  : "Go to the customer"}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-slate-50 rounded-3xl p-4 border-none shadow-lg mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">
                {isPickupPhase ? shopName : customerName}
              </h3>
            </div>
            <a
              href={canCall ? `tel:${normalizedPhone}` : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!canCall) e.preventDefault();
              }}
              aria-disabled={!canCall}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${
                canCall
                  ? "bg-primary-blue/10 text-primary-blue border-primary-blue/20 hover:bg-primary-blue/20"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}>
              <FaPhone />
            </a>
          </div>

          {showLocation && (
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-primary-blue mt-1" />
              <p className="text-sm text-gray-700 leading-snug">
                {isPickupPhase
                  ? shopAddress || "Restaurant location"
                  : shippingAddress || "Customer location"}
              </p>
            </div>
          )}

          {isConfirmDelivery && (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
                PAYMENT COLLECTION
              </div>

              <div
                className={`flex justify-between items-center p-4 rounded-3xl border-none shadow-lg ${
                  String(order?.paymentMethod || "").toLowerCase() === "cod"
                    ? "bg-primary-blue/10"
                    : "bg-slate-50"
                }`}>
                <div className="flex flex-col">
                  <span
                    className={`font-extrabold ${
                      String(order?.paymentMethod || "").toLowerCase() === "cod"
                        ? "text-primary-blue"
                        : "text-slate-800"
                    }`}>
                    {String(order?.paymentMethod || "").toLowerCase() === "cod"
                      ? "Collect Cash"
                      : "Already Paid"}
                  </span>
                  <span className="text-xs text-slate-500 uppercase font-semibold mt-1">
                    {String(order?.paymentMethod || "").toUpperCase()}
                  </span>
                </div>

                <span
                  className={`text-2xl font-extrabold ${
                    String(order?.paymentMethod || "").toLowerCase() === "cod"
                      ? "text-primary-blue"
                      : "text-slate-700"
                  }`}>
                  ฿
                  {Number(
                    String(order?.paymentMethod || "").toLowerCase() === "cod"
                      ? order?.totalAmount
                      : 0,
                  ).toFixed(2)}
                </span>
              </div>

              <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
                ORDER SUMMARY
              </div>
              <div className="space-y-2">
                {(displayItems || []).slice(0, 8).map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0 text-gray-700 flex-1">
                      <div className="truncate">
                        {Number(it?.quantity || it?.qty || 0) || 1}x{" "}
                        {it?.name || "Item"}
                      </div>
                      {/* Selected Options */}
                      {it?.selectedOptions &&
                        Object.keys(it.selectedOptions).length > 0 &&
                        formatSelectedOptions(it.selectedOptions) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {formatSelectedOptions(it.selectedOptions)}
                          </div>
                        )}
                      {it?.specialInstructions && (
                        <div className="mt-1 text-xs text-gray-500 italic">
                          Note: {it.specialInstructions}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 font-extrabold text-gray-900">
                      ฿{Number(it?.price || 0).toFixed(0)}
                    </div>
                  </div>
                ))}
                {(displayItems || []).length === 0 && (
                  <div className="text-sm text-gray-500 font-semibold">—</div>
                )}
              </div>
            </div>
          )}

          {status === "at_restaurant" && (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
                  ITEMS
                </div>
                <div className="mt-2 space-y-2">
                  {(displayItems || []).slice(0, 8).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0 text-gray-700 flex-1">
                        <div className="truncate">
                          {Number(it?.quantity || it?.qty || 0) || 1}x{" "}
                          {it?.name || "Item"}
                        </div>
                        {/* Selected Options */}
                        {it?.selectedOptions &&
                          Object.keys(it.selectedOptions).length > 0 &&
                          formatSelectedOptions(it.selectedOptions) && (
                            <div className="mt-1 text-xs text-gray-500">
                              {formatSelectedOptions(it.selectedOptions)}
                            </div>
                          )}
                        {it?.specialInstructions && (
                          <div className="mt-1 text-xs text-gray-500 italic">
                            Note: {it.specialInstructions}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 font-extrabold text-gray-900">
                        ฿{Number(it?.price || 0).toFixed(0)}
                      </div>
                    </div>
                  ))}
                  {(displayItems || []).length === 0 && (
                    <div className="text-sm text-gray-500 font-semibold">—</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
                  SUBTOTAL
                </div>
                <div className="text-base font-extrabold text-gray-900">
                  ฿{subtotal.toFixed(0)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
                  PAY RESTAURANT
                </div>
                <div className="text-base font-extrabold text-gray-900">
                  ฿{Number(payRestaurant).toFixed(0)}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {String(order?.paymentMethod || "").toLowerCase() === "cod"
                  ? "Use your credit to pay the restaurant, then collect from customer."
                  : "No payment at restaurant."}
              </div>
            </div>
          )}
        </div>

        {isCompleted && (
          <div className="bg-slate-50 rounded-3xl p-5 border-none shadow-lg mb-6">
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-gray-500">
              YOU EARNED
            </div>
            <div className="mt-2 text-4xl font-extrabold text-primary-blue">
              ฿{Number(order?.deliveryFee || 0).toFixed(2)}
            </div>
          </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={() => onAction(status)}
          disabled={actionDisabled}
          className={`w-full min-h-[48px] py-4 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
            actionDisabled
              ? "bg-slate-300 text-slate-600 shadow-none cursor-not-allowed"
              : "bg-primary-blue shadow-primary-blue/20 hover:bg-primary-blue/90 active:scale-[0.98]"
          }`}>
          {actionLabel}
        </button>

        {actionHint && (
          <div className="mt-3 text-sm font-semibold text-slate-500 text-center">
            {actionHint}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveOrderPanel;
