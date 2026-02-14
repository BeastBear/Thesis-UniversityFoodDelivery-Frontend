import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import {
  FaTruck,
  FaInfoCircle,
  FaClipboardList,
  FaStore,
  FaClock,
  FaCheckCircle,
  FaBoxOpen, // Added FaBoxOpen
  FaTimesCircle, // Added FaTimesCircle
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom"; // Added Link
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination"; // Import Pagination
import {
  addMyOrder,
  setMyOrders,
  updateRealtimeOrderStatus,
  updateOrderStatus,
} from "../redux/userSlice";
import axios from "axios";
import { serverUrl } from "../App";
import { io } from "socket.io-client"; // Added io import
import { useHeaderTitle } from "../context/UIContext.jsx";

function MyOrders() {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useHeaderTitle("My Orders");

  // Owner activeTab state
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("myOrdersActiveTab");
    return savedTab || "preparing";
  });

  // User activeTab state
  const [activeUserTab, setActiveUserTab] = useState(() => {
    const savedTab = localStorage.getItem("myOrdersUserActiveTab");
    return savedTab || "ongoing";
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("myOrdersActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("myOrdersUserActiveTab", activeUserTab);
  }, [activeUserTab]);

  useEffect(() => {
    if (!socket || !userData?._id) return;

    const handleNewOrder = async (data) => {
      const shopOrders = Array.isArray(data.shopOrders)
        ? data.shopOrders
        : [data.shopOrders];
      const relevantShopOrder = shopOrders.find((shopOrder) => {
        const ownerId = shopOrder?.owner?._id || shopOrder?.owner;
        return (
          ownerId &&
          (ownerId.toString() === userData._id.toString() ||
            ownerId === userData._id)
        );
      });

      if (relevantShopOrder) {
        const autoAccept = localStorage.getItem("autoAcceptOrders") === "true";
        if (autoAccept && relevantShopOrder.status === "pending") {
          try {
            const shopId =
              relevantShopOrder.shop?._id || relevantShopOrder.shop;
            await axios.post(
              `${serverUrl}/api/order/update-status/${data._id}/${shopId}`,
              { status: "preparing" },
              { withCredentials: true },
            );

            const updatedShopOrders = shopOrders.map((so) => {
              if (
                (so._id &&
                  so._id.toString() === relevantShopOrder._id?.toString()) ||
                (so.owner?._id === userData._id && so.status === "pending")
              ) {
                return { ...so, status: "preparing" };
              }
              return so;
            });
            dispatch(addMyOrder({ ...data, shopOrders: updatedShopOrders }));
            return;
          } catch (error) {}
        }
        dispatch(addMyOrder({ ...data, shopOrders }));
      }
    };

    const handleUpdateStatus = async ({
      orderId,
      shopId,
      status,
      userId,
      ownerId,
    }) => {
      if (userData.role === "owner" && ownerId === userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
        try {
          const response = await axios.get(`${serverUrl}/api/order/my-orders`, {
            withCredentials: true,
          });
          dispatch(setMyOrders(response.data));
        } catch (error) {}
      } else if (userData.role === "user" && userId === userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
        try {
          const response = await axios.get(`${serverUrl}/api/order/my-orders`, {
            withCredentials: true,
          });
          dispatch(setMyOrders(response.data));
        } catch (error) {}
      }
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("update-status", handleUpdateStatus);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("update-status", handleUpdateStatus);
    };
  }, [socket, dispatch, userData?._id, userData?.role]);

  // Auto-accept pending orders logic (kept same as original)
  useEffect(() => {
    const autoAcceptPendingOrders = async () => {
      if (!userData || userData.role !== "owner" || !myOrders) return;
      const autoAccept = localStorage.getItem("autoAcceptOrders") === "true";
      if (!autoAccept) return;

      const pendingOrders = [];
      myOrders.forEach((order) => {
        if (order.shopOrders && Array.isArray(order.shopOrders)) {
          order.shopOrders.forEach((shopOrder) => {
            const orderDate = new Date(order.createdAt);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const ownerId = shopOrder.owner?._id || shopOrder.owner;
            if (
              ownerId &&
              (ownerId.toString() === userData._id.toString() ||
                ownerId === userData._id) &&
              shopOrder.status === "pending" &&
              orderDate >= today &&
              orderDate < tomorrow
            ) {
              pendingOrders.push({ order, shopOrder });
            }
          });
        }
      });

      for (const { order, shopOrder } of pendingOrders) {
        try {
          const shopId = shopOrder.shop?._id || shopOrder.shop;
          await axios.post(
            `${serverUrl}/api/order/update-status/${order._id}/${shopId}`,
            { status: "preparing" },
            { withCredentials: true },
          );
          dispatch(
            updateOrderStatus({
              orderId: order._id,
              shopId,
              status: "preparing",
            }),
          );
        } catch (error) {}
      }
    };
    autoAcceptPendingOrders();
  }, [myOrders, userData, dispatch]);

  // Filter orders by status and today's date
  const getFilteredOrders = () => {
    if (!myOrders) return [];

    let filtered = myOrders.filter((order) => order && order._id);

    // Filter by today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    filtered = filtered.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });

    if (userData.role === "owner") {
      const statusMap = {
        new: "pending",
        preparing: "preparing",
        delivering: "out of delivery",
        completed: "delivered",
      };
      const targetStatus = statusMap[activeTab];
      if (targetStatus) {
        filtered = filtered.filter((order) => {
          const shopOrder = order.shopOrders?.[0];
          return shopOrder?.status === targetStatus;
        });
      }
    }
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // --- USER DASHBOARD ---
  if (userData?.role === "user") {
    const userTabs = [
      { id: "ongoing", label: "Ongoing" },
      { id: "completed", label: "Completed" },
      { id: "cancelled", label: "Cancelled" },
    ];

    const getOrderBucket = (order) => {
      const statuses = (order?.shopOrders || [])
        .map((so) => (so?.status || "").toLowerCase())
        .filter(Boolean);

      if (statuses.length === 0) return "ongoing";

      const isCancelled = (s) =>
        s === "cancelled" ||
        s === "canceled" ||
        s === "rejected" ||
        s === "cancel";
      const isCompleted = (s) => s === "delivered" || s === "completed";

      if (statuses.every(isCancelled)) return "cancelled";
      if (statuses.every(isCompleted)) return "completed";
      return "ongoing";
    };

    const getOrderDate = (order) =>
      new Date(order?.createdAt || order?.updatedAt || 0).getTime();

    const sortedOrders = [...(myOrders || [])]
      .filter((o) => o && o._id)
      .sort((a, b) => getOrderDate(b) - getOrderDate(a));

    const userFilteredOrders = sortedOrders.filter(
      (order) => getOrderBucket(order) === activeUserTab,
    );

    return (
      <div className="min-h-screen bg-white pb-28 lg:pb-12">
        <div className="px-4 lg:px-8 pt-4 max-w-7xl mx-auto">
          {/* Sticky header & tabs on mobile */}
          <div className="sticky top-16 lg:top-6 z-30 bg-white/95 backdrop-blur border border-gray-100 rounded-3xl p-3 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3"></div>
            <div className="pb-2">
              <div className="flex gap-2 justify-between flex-nowrap w-full">
                {userTabs.map((tab) => {
                  const isActive = activeUserTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveUserTab(tab.id);
                        // setCurrentPage(1); // Reset page on tab change if pagination enabled
                      }}
                      className={`flex-1 min-w-0 px-3 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap text-center ${
                        isActive
                          ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/20"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <FaClipboardList className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">
                No orders yet
              </h3>
              <p className="text-gray-500 max-w-xs mt-2 mb-8 leading-relaxed">
                Looks like you haven't placed any orders yet. <br /> Start
                exploring restaurants and satisfy your cravings!
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-primary-orange text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-primary-orange/30 hover:bg-primary-orange/90 transition-all transform hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto">
                Start Ordering
              </button>
            </div>
          ) : userFilteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                <FaClipboardList className="text-gray-300 text-3xl" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                No orders in this section
              </h3>
              <p className="text-gray-500 max-w-xs mt-2 leading-relaxed">
                Try another tab to view more orders.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userFilteredOrders
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((order, index) => (
                    <UserOrderCard data={order} key={order._id || index} />
                  ))}
              </div>

              {/* Pagination */}
              {userFilteredOrders.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={userFilteredOrders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- OWNER DASHBOARD ---
  const tabs = [
    { id: "new", label: "New", shortLabel: "New", icon: <FaStore /> },
    {
      id: "preparing",
      label: "Preparing",
      shortLabel: "Prep",
      icon: <FaClock />,
    },
    {
      id: "delivering",
      label: "Delivery",
      shortLabel: "Deliv",
      icon: <FaTruck />,
    },
    {
      id: "completed",
      label: "Done",
      shortLabel: "Done",
      icon: <FaCheckCircle />,
    },
  ];

  const getOwnerTodayOrders = () => {
    if (!myOrders) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (myOrders || [])
      .filter((order) => order && order._id)
      .filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
      });
  };

  const getOwnerTabCounts = () => {
    const statusMap = {
      new: "pending",
      preparing: "preparing",
      delivering: "out of delivery",
      completed: "delivered",
    };

    const base = {
      new: 0,
      preparing: 0,
      delivering: 0,
      completed: 0,
    };

    return getOwnerTodayOrders().reduce((acc, order) => {
      const shopOrder = order.shopOrders?.[0];
      const s = (shopOrder?.status || "").toLowerCase();

      if (s === statusMap.new) acc.new += 1;
      else if (s === statusMap.preparing) acc.preparing += 1;
      else if (s === statusMap.delivering) acc.delivering += 1;
      else if (s === statusMap.completed) acc.completed += 1;
      return acc;
    }, base);
  };

  const ownerTabCounts = getOwnerTabCounts();

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <Card className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = ownerTabCounts?.[tab.id] ?? 0;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1); // Reset page on tab change
                  }}
                  className={`w-full h-[44px] rounded-2xl border-none px-2 transition-all font-extrabold text-[11px] leading-none flex items-center justify-center gap-1.5 shadow-sm ${
                    isActive
                      ? "text-white bg-primary-green"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}>
                  <span
                    className={`hidden sm:inline shrink-0 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}>
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="sm:hidden">
                      {tab.shortLabel || tab.label}
                    </span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                  <span
                    className={`ml-0.5 shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-gray-700 border-none shadow-sm"
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {filteredOrders.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={<FaClipboardList className="text-gray-300 text-3xl" />}
              title="No orders here yet"
              description="Check other tabs or wait for new orders."
              className="pt-10"
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredOrders
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage,
                )
                .map((order, index) => (
                  <OwnerOrderCard
                    data={order}
                    key={order._id || index}
                    activeTab={activeTab}
                  />
                ))}
            </div>

            {/* Pagination */}
            {filteredOrders.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
