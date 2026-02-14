import React, { useEffect, useMemo, useState } from "react";

import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { MdRoute } from "react-icons/md";
import { serverUrl } from "../App";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";

function DeliveryOrderDetail() {
  const { orderId } = useParams();
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/get-order-by-id/${orderId}`,
          {
            withCredentials: true,
          },
        );
        setOrder(res?.data || null);
      } catch (e) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const myShopOrder = useMemo(() => {
    const shopOrders = Array.isArray(order?.shopOrders) ? order.shopOrders : [];
    const myId = userData?._id?.toString();
    const mine = shopOrders.find((so) => {
      const assigned = so?.assignedDeliveryBoy;
      const assignedId =
        typeof assigned === "object"
          ? assigned?._id?.toString()
          : assigned?.toString();
      return assignedId && myId && assignedId === myId;
    });
    return mine || shopOrders[0] || null;
  }, [order?.shopOrders, userData?._id]);

  const shortId = useMemo(() => {
    const raw = order?._id?.toString() || "";
    return raw ? raw.slice(-4) : "";
  }, [order?._id]);

  const shopName = myShopOrder?.shop?.name || "Restaurant";
  const shopAddress = myShopOrder?.shop?.address || "";
  const customerName = order?.user?.fullName || "Customer";
  const deliveryAddress = order?.deliveryAddress?.text || "";

  const deliveryFee = Number(order?.deliveryFee || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <DeliveryLayout>
        <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
          <DeliveryPageHero
            eyebrow="ORDER"
            title="Order not found"
            description="We couldn't load this order."
            icon={<MdRoute size={22} />}
            onBack={() => navigate(-1)}
          />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-slate-700 font-bold">
            Please go back and try again.
          </div>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="ORDER"
          title={`Order #${shortId}`}
          description="Review the route and income details."
          icon={<MdRoute size={22} />}
          onBack={() => navigate(-1)}
        />

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
            ROUTE
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
            Delivery Steps
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-lg">1</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black tracking-[0.14em] text-blue-600">
                  Go to the restaurant
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {shopName}
                </div>
                {shopAddress && (
                  <div className="mt-1 text-xs text-slate-600">
                    {shopAddress}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-lg">2</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black tracking-[0.14em] text-red-600">
                  Deliver to customer
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {customerName}
                </div>
                {deliveryAddress && (
                  <div className="mt-1 text-xs text-slate-600">
                    {deliveryAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
            INCOME
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
            Income Details
          </div>

          <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between bg-white px-4 py-3">
              <div className="text-sm font-bold text-slate-700">
                Delivery Fee (Wallet)
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                ฿{deliveryFee.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
              <div className="text-sm font-extrabold text-slate-900">
                Net Income
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                ฿{deliveryFee.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}

export default DeliveryOrderDetail;
