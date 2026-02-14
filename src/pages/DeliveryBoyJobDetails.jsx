import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { FaHome, FaUtensils, FaWalking } from "react-icons/fa";
import { MdRoute } from "react-icons/md";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";

// Calculate distance between two coordinates using Haversine formula (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

function DeliveryBoyJobDetails() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-current-order?t=${Date.now()}`,
        {
          withCredentials: true,
        },
      );
      if (result.data) {
        setCurrentOrder(result.data);
      } else {
        navigate("/");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error?.response?.status === 404 || !error?.response?.data) {
        navigate("/");
      }
    }
  };

  useEffect(() => {
    if (userData?._id) {
      getCurrentOrder();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <DeliveryLayout>
        <div className="w-full max-w-[900px] mx-auto px-4 py-10 sm:py-14 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
            <FaWalking size={28} />
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-blue-600 mb-2">
              NO ACTIVE JOB
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
              You're off the road right now
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              When a new delivery assignment is available, it will appear here.
              You can also check the History or Notifications tabs for updates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            <FaHome className="text-lg" />
            <span>Back to Home</span>
          </button>
        </div>
      </DeliveryLayout>
    );
  }

  const shopLat = currentOrder?.shopOrder?.shop?.location?.latitude;
  const shopLon = currentOrder?.shopOrder?.shop?.location?.longitude;
  const customerLat = currentOrder?.deliveryAddress?.latitude;
  const customerLon = currentOrder?.deliveryAddress?.longitude;

  // Calculate distances
  const totalDistance =
    shopLat && shopLon && customerLat && customerLon
      ? calculateDistance(shopLat, shopLon, customerLat, customerLon)
      : 0;

  const deliveryBoyLat = userData?.location?.coordinates?.[1];
  const deliveryBoyLon = userData?.location?.coordinates?.[0];
  const distanceToRestaurant =
    deliveryBoyLat && deliveryBoyLon && shopLat && shopLon
      ? calculateDistance(deliveryBoyLat, deliveryBoyLon, shopLat, shopLon)
      : 0;

  const subtotal = currentOrder?.shopOrder?.subtotal || 0;
  const deliveryFee = currentOrder?.deliveryFee || 0;

  return (
    <DeliveryLayout>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER JOB"
          title="Job Details"
          description="Review the route and delivery steps for your active job."
          icon={<MdRoute size={22} />}
          onBack={() => navigate(-1)}
          right={
            <button
              type="button"
              className="min-h-[44px] px-4 rounded-2xl text-sm font-extrabold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">
              Report
            </button>
          }
        />

        {/* Route Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                ROUTE
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-extrabold">
                  <FaUtensils size={12} />
                  Restaurant
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-extrabold">
                  <FaWalking size={12} />
                  Destination
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                DISTANCE
              </div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">
                {totalDistance > 0 ? `${totalDistance.toFixed(2)} km` : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                To restaurant:{" "}
                {distanceToRestaurant > 0
                  ? `${distanceToRestaurant.toFixed(2)} km`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                RESTAURANT
              </div>
              <div className="mt-2 text-sm font-extrabold text-slate-900">
                {currentOrder?.paymentMethod === "cod"
                  ? `Pay ฿${Number(subtotal).toFixed(0)}`
                  : "No payment"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {currentOrder?.paymentMethod === "cod"
                  ? "You pay the restaurant first"
                  : "Paid online"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                CUSTOMER
              </div>
              <div className="mt-2 text-sm font-extrabold text-slate-900">
                {currentOrder?.paymentMethod === "cod"
                  ? "Collect cash"
                  : "No cash"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {currentOrder?.paymentMethod === "cod"
                  ? "Receive cash at delivery"
                  : "Nothing to collect"}
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-blue-700">
                EARNINGS
              </div>
              <div className="mt-2 text-2xl font-extrabold text-blue-700">
                ฿{deliveryFee.toFixed(0)}
              </div>
              <div className="mt-1 text-xs text-blue-700/80">Delivery fee</div>
            </div>
          </div>
        </div>

        {/* Detailed Job Steps */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          {/* Step 1: Go to Restaurant */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-lg">1</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black tracking-[0.14em] text-blue-600 mb-1">
                Go to the restaurant
              </p>
              <p className="text-sm font-extrabold text-slate-900 mb-1">
                {currentOrder?.shopOrder?.shop?.name || "Restaurant"}
              </p>
              {currentOrder?.shopOrder?.shop?.address && (
                <p className="text-xs text-slate-600">
                  {currentOrder.shopOrder.shop.address}
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Deliver to Customer */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-lg">2</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black tracking-[0.14em] text-red-600 mb-1">
                Deliver to customer
              </p>
              <p className="text-sm font-extrabold text-slate-900 mb-1">
                {currentOrder?.user?.fullName || "Customer"}
              </p>
              {currentOrder?.deliveryAddress?.text && (
                <p className="text-xs text-slate-600">
                  {currentOrder.deliveryAddress.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}

export default DeliveryBoyJobDetails;
