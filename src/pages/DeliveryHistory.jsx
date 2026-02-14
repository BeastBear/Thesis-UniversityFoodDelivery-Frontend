import React, { useEffect, useMemo, useState } from "react";

import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdHistory } from "react-icons/md";
import { serverUrl } from "../App";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";

function DeliveryHistory() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);

  const formatHistoryDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (userData?.role !== "deliveryBoy") return;
    if (!userData?._id) return;

    let cancelled = false;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders?t=${Date.now()}`,
          {
            withCredentials: true,
          },
        );

        const orders = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.orders)
            ? res.data.orders
            : [];

        const myId = userData?._id?.toString();
        const mine = orders.filter((order) => {
          const shopOrders = Array.isArray(order?.shopOrders)
            ? order.shopOrders
            : [];
          return shopOrders.some((so) => {
            const assigned = so?.assignedDeliveryBoy;
            const assignedId =
              typeof assigned === "object"
                ? assigned?._id?.toString()
                : assigned?.toString();
            return assignedId && myId && assignedId === myId;
          });
        });

        if (cancelled) return;
        setHistoryOrders(mine);
      } catch (err) {
        if (cancelled) return;
        setHistoryOrders([]);
      } finally {
        if (cancelled) return;
        setHistoryLoading(false);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [userData?._id, userData?.role]);

  const filteredHistoryOrders = useMemo(() => {
    return [...historyOrders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [historyOrders]);

  const historyEarnings = useMemo(() => {
    return filteredHistoryOrders.reduce(
      (sum, order) => sum + (order.deliveryFee || 0),
      0,
    );
  }, [filteredHistoryOrders]);

  return (
    <DeliveryLayout>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER HISTORY"
          title="Delivery History"
          description="Review your completed deliveries and earnings."
          icon={<MdHistory size={22} />}
          onBack={() => navigate(-1)}
        />

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
          {historyLoading ? (
            <div className="text-center py-10 text-gray-400">
              <p>Loading history...</p>
              <div className="mt-4 h-6 w-6 mx-auto rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
            </div>
          ) : filteredHistoryOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-700 font-bold">No deliveries found</p>
              <p className="text-sm text-gray-500 mt-1">
                Your completed deliveries will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black tracking-[0.14em] text-blue-700">
                    TOTAL EARNINGS
                  </div>
                  <div className="mt-1 text-xs font-bold text-blue-700/80">
                    Delivered orders
                  </div>
                </div>
                <div className="text-lg font-extrabold text-blue-700">
                  ฿{historyEarnings.toFixed(2)}
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistoryOrders.map((order) => (
                  <div
                    key={order._id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/delivery-order-detail/${order._id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/delivery-order-detail/${order._id}`);
                      }
                    }}
                    className="border border-slate-100 p-4 rounded-2xl flex justify-between items-center bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        #{order._id.slice(-4)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatHistoryDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="font-extrabold text-blue-600">
                      ฿{order.deliveryFee?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DeliveryLayout>
  );
}

export default DeliveryHistory;
