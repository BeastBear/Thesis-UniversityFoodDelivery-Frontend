import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import {
  IoIosArrowRoundBack,
  IoIosCall,
  IoMdTime,
  IoMdCheckmarkCircle,
} from "react-icons/io";
import {
  FaStore,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaUtensils,
  FaMoneyBillWave,
  FaCreditCard,
  FaRegHeart,
  FaChevronRight,
  FaPhoneAlt,
  FaComments,
} from "react-icons/fa";
import DelivererTracking from "../components/DeliveryBoyTracking";
import ReviewDelivery from "./ReviewDelivery";
import { useSelector } from "react-redux";
import Card from "../components/ui/Card";
import CancelOrderModal from "../components/CancelOrderModal";
import OrderTimeline from "../components/OrderTimeline";

function TrackOrderPage() {
  const { orderId } = useParams();
  const [currentOrder, setCurrentOrder] = useState();
  const [reviewingShopOrderId, setReviewingShopOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelShopOrderId, setCancelShopOrderId] = useState(null);
  const navigate = useNavigate();
  const { socket } = useSelector((state) => state.user);

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
    });

    return parts.filter(Boolean).join(" • ");
  };

  const handleGetOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load order tracking";
      toast.error(msg);
    }
  };

  const handleCancelSuccess = () => {
    // Navigate immediately to order detail after cancellation
    if (currentOrder && cancelShopOrderId) {
      const shopOrder = currentOrder.shopOrders.find((so) => {
        const shopId = so.shop?._id || so.shop;
        return shopId?.toString() === cancelShopOrderId?.toString();
      });
      if (shopOrder) {
        navigate(
          `/order-detail/${currentOrder._id}?shopOrderId=${shopOrder._id}`,
          {
            replace: true,
          },
        );
      } else {
        navigate(`/order-detail/${currentOrder._id}`, { replace: true });
      }
    }
  };

  const canCancelOrder = (shopOrder) => {
    const status = shopOrder.status?.toLowerCase();
    // Don't show cancel button if already cancelled or delivered
    if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "delivered"
    ) {
      return false;
    }
    return (
      status === "pending" ||
      status === "preparing" ||
      status === "out of delivery" ||
      status === "out_for_delivery"
    );
  };

  useEffect(() => {
    handleGetOrder();
  }, [orderId]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const joinRoom = () => {
      socket.emit("join_order_room", { orderId });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    const handleOrderStatusUpdated = (updatedOrder) => {
      if (!updatedOrder?._id || updatedOrder._id.toString() !== orderId) return;
      setCurrentOrder(updatedOrder);
    };

    socket.on("order_status_updated", handleOrderStatusUpdated);

    return () => {
      socket.off("order_status_updated", handleOrderStatusUpdated);
      socket.off("connect", joinRoom);
      if (socket.connected) {
        socket.emit("leave_order_room", { orderId });
      }
    };
  }, [socket, orderId]);

  useEffect(() => {
    if (currentOrder && !reviewingShopOrderId) {
      // Check if any shop order is delivered
      const deliveredShopOrder = currentOrder.shopOrders.find(
        (so) => so.status === "delivered",
      );

      if (deliveredShopOrder) {
        // Check if reviews are already completed for this delivered order
        const isDriverReviewed = deliveredShopOrder.isDriverReviewed || false;
        const isRestaurantReviewed =
          deliveredShopOrder.isRestaurantReviewed || false;

        // If both reviews are done, navigate to order detail
        if (isDriverReviewed && isRestaurantReviewed) {
          navigate(`/order-detail/${orderId}`, { replace: true });
          return;
        }

        // If reviews are not complete, show review modal
        setReviewingShopOrderId(deliveredShopOrder._id);
        return;
      }

      // Check if any shop order is cancelled - navigate immediately
      const cancelledShopOrder = currentOrder.shopOrders.find(
        (so) => so.status === "cancelled" || so.status === "canceled",
      );
      if (cancelledShopOrder) {
        // Navigate immediately to order detail
        navigate(
          `/order-detail/${orderId}?shopOrderId=${cancelledShopOrder._id}`,
          {
            replace: true,
          },
        );
      }
    }
  }, [currentOrder, reviewingShopOrderId, orderId, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = ({
      orderId: updatedOrderId,
      shopOrderId,
      location,
      deliverer,
      address,
    }) => {
      setCurrentOrder((prev) => {
        if (!prev || prev._id !== updatedOrderId) return prev;

        const updatedShopOrders = prev.shopOrders.map((shopOrder) => {
          const currentShopOrderId =
            typeof shopOrder._id === "string"
              ? shopOrder._id
              : shopOrder._id?.toString();
          if (currentShopOrderId === shopOrderId) {
            const existingDeliverer = shopOrder.assignedDeliveryBoy || {};
            return {
              ...shopOrder,
              assignedDeliveryBoy: {
                ...existingDeliverer,
                ...deliverer,
                location: {
                  type: "Point",
                  coordinates: [location.lon, location.lat],
                },
                currentAddress:
                  deliverer?.currentAddress ||
                  address ||
                  existingDeliverer.currentAddress,
              },
            };
          }
          return shopOrder;
        });

        return { ...prev, shopOrders: updatedShopOrders };
      });
    };

    socket.on("delivery-location-update", handleLocationUpdate);

    // Listen for status updates
    const handleStatusUpdate = ({
      orderId: updatedOrderId,
      shopOrderId,
      shopId,
      status,
    }) => {
      setCurrentOrder((prev) => {
        if (!prev || prev._id.toString() !== updatedOrderId.toString())
          return prev;

        const updatedShopOrders = prev.shopOrders.map((shopOrder) => {
          const currentShopOrderId =
            typeof shopOrder._id === "string"
              ? shopOrder._id
              : shopOrder._id?.toString();

          const currentShopId = shopOrder.shop?._id
            ? typeof shopOrder.shop._id === "string"
              ? shopOrder.shop._id
              : shopOrder.shop._id.toString()
            : typeof shopOrder.shop === "string"
              ? shopOrder.shop
              : null;

          // Match by shopOrderId (if provided) or shopId (fallback)
          if (
            (shopOrderId && currentShopOrderId === shopOrderId) ||
            (!shopOrderId && shopId && currentShopId === shopId)
          ) {
            // If status changed to delivered, show review page only if not already reviewed
            if (status === "delivered") {
              // Check if driver is already reviewed for this shop order
              const shopOrder = currentOrder.shopOrders.find(
                (so) => so._id === currentShopOrderId,
              );

              if (shopOrder && shopOrder.assignedDeliveryBoy) {
                const isDriverReviewed = shopOrder.isDriverReviewed || false;
                const isRestaurantReviewed =
                  shopOrder.isRestaurantReviewed || false;

                // Only show review modal if there's something to review
                if (!isDriverReviewed || !isRestaurantReviewed) {
                  setReviewingShopOrderId(currentShopOrderId);
                } else {
                  // Both reviews already done, navigate to order detail
                  navigate(`/order-detail/${orderId}`, { replace: true });
                }
              } else {
                // No driver assigned or other issue, show review modal anyway
                setReviewingShopOrderId(currentShopOrderId);
              }
            }

            // If status changed to cancelled, navigate to order detail immediately
            if (status === "cancelled" || status === "canceled") {
              // Update the status first, then navigate
              const updatedShopOrder = { ...shopOrder, status: status };
              // Navigate immediately after state update
              setTimeout(() => {
                navigate(
                  `/order-detail/${updatedOrderId}?shopOrderId=${currentShopOrderId}`,
                  {
                    replace: true,
                  },
                );
              }, 0);
              return updatedShopOrder;
            }

            return { ...shopOrder, status: status };
          }
          return shopOrder;
        });

        return { ...prev, shopOrders: updatedShopOrders };
      });
    };

    const handleDriverArrived = ({
      orderId: updatedOrderId,
      shopOrderId,
      arrivedAt,
    }) => {
      setCurrentOrder((prev) => {
        if (!prev || prev._id.toString() !== updatedOrderId.toString())
          return prev;

        const updatedShopOrders = prev.shopOrders.map((shopOrder) => {
          const currentShopOrderId =
            typeof shopOrder._id === "string"
              ? shopOrder._id
              : shopOrder._id?.toString();

          if (currentShopOrderId === shopOrderId) {
            return { ...shopOrder, arrivedAtCustomerAt: arrivedAt };
          }
          return shopOrder;
        });

        return { ...prev, shopOrders: updatedShopOrders };
      });
    };

    socket.on("update-status", handleStatusUpdate);
    socket.on("driver-arrived", handleDriverArrived);

    return () => {
      socket.off("delivery-location-update", handleLocationUpdate);
      socket.off("update-status", handleStatusUpdate);
      socket.off("driver-arrived", handleDriverArrived);
    };
  }, [socket, currentOrder?._id]);

  // Check if order is cancelled - redirect immediately
  useEffect(() => {
    if (currentOrder) {
      const isCancelled = currentOrder.shopOrders?.some(
        (so) => so.status === "cancelled" || so.status === "canceled",
      );
      if (isCancelled && !reviewingShopOrderId) {
        const cancelledShopOrder = currentOrder.shopOrders.find(
          (so) => so.status === "cancelled" || so.status === "canceled",
        );
        navigate(
          `/order-detail/${orderId}${cancelledShopOrder?._id ? `?shopOrderId=${cancelledShopOrder._id}` : ""}`,
          { replace: true },
        );
      }
    }
  }, [currentOrder, orderId, navigate, reviewingShopOrderId]);

  if (!currentOrder) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  // Don't render if order is cancelled - will redirect
  const isCancelled = currentOrder.shopOrders?.some(
    (so) => so.status === "cancelled" || so.status === "canceled",
  );
  if (isCancelled) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  // Helper to determine active step in progress bar
  const getStatusStep = (shopOrder) => {
    const status = shopOrder.status;

    // If cancelled, return 0 (no progress)
    if (status === "cancelled" || status === "canceled") return 0;

    // If arrived at customer or delivered, step 4
    if (shopOrder.arrivedAtCustomerAt || status === "delivered") return 4;

    switch (status) {
      case "placed":
      case "pending":
        return 1; // Order Placed (Restaurant)
      case "confirmed":
      case "preparing":
      case "ready_for_delivery":
        return 2; // Prep
      case "out of delivery":
      case "out_for_delivery": // Handle both legacy and new status
        if (!shopOrder.assignedDeliveryBoy) return 2;
        return 3; // Deliverer
      case "delivered":
        return 4; // Delivered
      default:
        return 1;
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const getStatusContent = (shopOrder, currentOrder) => {
    const status = shopOrder.status;
    const isDelivererAssigned = !!shopOrder.assignedDeliveryBoy;
    const isPickedUp = !!shopOrder.pickedUpAt;
    const isArrived = !!shopOrder.arrivedAtCustomerAt;

    if (status === "cancelled" || status === "canceled") {
      return {
        title: "Order Cancelled",
        subtext: shopOrder.cancelReason || "This order has been cancelled",
        icon: <IoMdCheckmarkCircle className="text-red-500 text-3xl" />,
      };
    }

    if (status === "delivered") {
      return {
        title: "Order Delivered",
        subtext: "Enjoy your meal!",
        icon: <IoMdCheckmarkCircle className="text-green-500 text-3xl" />,
      };
    }

    if (isArrived) {
      return {
        title: "Hooray! Your order is here",
        subtext: `Arrived at ${new Date(
          shopOrder.arrivedAtCustomerAt,
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`,
        icon: <FaMapMarkerAlt className="text-primary-orange text-3xl" />,
      };
    }

    if (status === "out of delivery" || status === "out_for_delivery") {
      if (!isDelivererAssigned) {
        return {
          title: "Your order is ready",
          subtext: "Finding a deliverer, please wait...",
          icon: <FaMapMarkerAlt className="text-orange-400 text-3xl" />,
        };
      } else if (!isPickedUp) {
        return {
          title: "Picking up your order",
          subtext: `Arriving in ~${30} mins`, // simplified for UI cleanliness
          icon: <FaMotorcycle className="text-primary-orange text-3xl" />,
        };
      } else {
        const distance = calculateDistance(
          shopOrder.assignedDeliveryBoy.location?.coordinates?.[1],
          shopOrder.assignedDeliveryBoy.location?.coordinates?.[0],
          currentOrder.deliveryAddress?.latitude,
          currentOrder.deliveryAddress?.longitude,
        );

        if (distance <= 0.1) {
          return {
            title: "Arriving now",
            subtext: "Deliverer is approaching your location",
            icon: <FaMotorcycle className="text-primary-orange text-3xl" />,
          };
        }

        return {
          title: "Heading your way",
          subtext: `Arriving in ~${Math.max(10, Math.ceil(distance * 5))} mins`, // Rough estimate
          icon: <FaMotorcycle className="text-primary-orange text-3xl" />,
        };
      }
    }

    if (status === "preparing" || status === "confirmed") {
      return {
        title: "Preparing your order",
        subtext: "Kitchen is preparing your food",
        icon: <FaUtensils className="text-orange-400 text-3xl" />,
      };
    }

    return {
      title: "Order Received",
      subtext: "Waiting for restaurant to confirm",
      icon: <FaStore className="text-orange-400 text-3xl" />,
    };
  };

  const getPaymentIcon = (method) => {
    if (method === "card" || method === "online")
      return <FaCreditCard className="text-[#1A1F71]" size={20} />;
    if (method === "promptpay")
      return <FaMoneyBillWave className="text-[#0056FF]" size={20} />;
    return <FaMoneyBillWave className="text-[#10b981]" size={20} />; // COD
  };

  if (reviewingShopOrderId && currentOrder) {
    const shopOrderToReview = currentOrder.shopOrders.find(
      (so) =>
        so._id === reviewingShopOrderId ||
        so._id?.toString() === reviewingShopOrderId,
    );

    if (shopOrderToReview) {
      const handleReviewModalClose = async () => {
        setReviewingShopOrderId(null);
        // Navigate to order details after skipping or completing review
        navigate(`/order-detail/${orderId}`, { replace: true });
      };

      return (
        <ReviewDelivery
          order={currentOrder}
          shopOrder={shopOrderToReview}
          onClose={handleReviewModalClose}
        />
      );
    }
  }

  const containerClass = "w-full max-w-5xl mx-auto px-4 lg:px-6";

  return (
    <div className="min-h-screen bg-white pb-32 lg:pb-24">
      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-40 px-4 py-3 flex items-center gap-3 lg:hidden shadow-sm border-b border-gray-100">
        <button
          onClick={() => navigate("/my-orders")}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800">
          <IoIosArrowRoundBack size={28} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-gray-900 leading-tight">
            Order Status
          </h1>
          <p className="text-xs text-gray-500">Track your delivery</p>
        </div>
      </div>

      {/* Desktop Header Title */}
      <div className="hidden lg:block bg-white py-6 mb-6">
        <div className={`${containerClass} flex items-center gap-4`}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800"
            aria-label="Go back">
            <IoIosArrowRoundBack size={28} />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-2xl text-gray-900 leading-tight">
              Order # {orderId?.slice(-4)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Live tracking and status updates
            </p>
          </div>
        </div>
      </div>

      <div className={`${containerClass} space-y-6`}>
        {currentOrder.shopOrders?.map((shopOrder, index) => {
          const step = getStatusStep(shopOrder);
          const isPaid =
            currentOrder.payment === true ||
            currentOrder.paymentMethod !== "cod";

          const statusContent = getStatusContent(shopOrder, currentOrder);

          // Calculate distance for map display
          const delivererLat =
            shopOrder.assignedDeliveryBoy?.location?.coordinates?.[1];
          const delivererLon =
            shopOrder.assignedDeliveryBoy?.location?.coordinates?.[0];
          const userLat = currentOrder.deliveryAddress?.latitude;
          const userLon = currentOrder.deliveryAddress?.longitude;

          const distance = calculateDistance(
            delivererLat,
            delivererLon,
            userLat,
            userLon,
          );
          // Show map if distance is <= 0.1 km (100m) OR if arrived at customer
          // Also show map if deliverer is assigned and out for delivery, even if far, so users can see where they are
          const showMap =
            shopOrder.assignedDeliveryBoy &&
            (shopOrder.status === "out_for_delivery" ||
              shopOrder.status === "out of delivery" ||
              shopOrder.status === "arrived_at_customer") &&
            shopOrder.status !== "delivered";

          const layoutClass = showMap
            ? "lg:grid lg:grid-cols-2 lg:gap-8 flex flex-col gap-6"
            : "flex flex-col gap-6";

          return (
            <div key={index} className={layoutClass}>
              {/* LEFT COLUMN (Desktop): Map & Deliverer Info */}
              <div className="lg:order-1 order-1 space-y-6">
                {showMap && (
                  <Card className="overflow-hidden h-[320px] sm:h-[360px] lg:h-[400px] lg:sticky lg:top-24">
                    <DeliveryBoyTracking
                      data={{
                        delivererLocation: {
                          lat: delivererLat,
                          lon: delivererLon,
                        },
                        customerLocation: {
                          lat: userLat,
                          lon: userLon,
                        },
                      }}
                    />
                    {/* Overlay for professionalism */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl z-1000">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-gray-800">
                          Live Tracking
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* RIGHT COLUMN (Desktop): Status & Order Summary */}
              <div className="lg:order-2 order-2 space-y-6">
                {/* 1. Main Status Card */}
                <Card className="p-6 flex flex-col items-center justify-center gap-6 relative overflow-hidden border-none shadow-none">
                  {/* Background Decor */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary-orange/10 rounded-full flex items-center justify-center text-primary-orange text-2xl mb-4 shadow-sm">
                      {statusContent.icon}
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                      {statusContent.title}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                      {statusContent.subtext}
                    </p>
                  </div>

                  {/* Timeline Component */}
                  <div className="w-full flex justify-center">
                    <OrderTimeline
                      currentStep={step}
                      steps={[
                        {
                          label: "Order Placed",
                          description: "Restaurant received",
                          icon: <FaStore size={14} />,
                        },
                        {
                          label: "Preparing",
                          description: "Kitchen is cooking",
                          icon: <FaUtensils size={14} />,
                        },
                        {
                          label: "On the Way",
                          description: "Deliverer assigned",
                          icon: <FaMotorcycle size={14} />,
                        },
                        {
                          label: "Delivered",
                          description: "Enjoy your meal!",
                          icon: <FaMapMarkerAlt size={14} />,
                        },
                      ]}
                    />
                  </div>
                </Card>

                {/* Deliverer / Address Info */}
                <Card className="p-5 border-none shadow-none">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                      {shopOrder.assignedDeliveryBoy ? (
                        shopOrder.assignedDeliveryBoy.profileImage ? (
                          <img
                            src={shopOrder.assignedDeliveryBoy.profileImage}
                            alt="Deliverer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-primary-orange">
                            {shopOrder.assignedDeliveryBoy.fullName?.charAt(0)}
                          </span>
                        )
                      ) : (
                        <FaMotorcycle className="text-gray-300" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {shopOrder.assignedDeliveryBoy?.fullName ||
                          "Finding Deliverer..."}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {shopOrder.assignedDeliveryBoy
                          ? "Your delivery partner"
                          : "We are looking for a deliverer"}
                      </p>
                    </div>
                    {shopOrder.assignedDeliveryBoy && (
                      <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-green-50 text-[#10b981] flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm">
                          <FaPhoneAlt size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200 grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange shrink-0">
                        <FaStore size={12} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Restaurant
                        </p>
                        <p className="font-bold text-gray-900 text-sm line-clamp-1">
                          {shopOrder.shop.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary-bg-light)",
                          color: "var(--color-primary)",
                        }}>
                        <FaMapMarkerAlt size={12} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Delivery to
                        </p>
                        <p className="font-bold text-gray-900 text-sm line-clamp-2">
                          {currentOrder.deliveryAddress?.text || "Home"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Order Details & Summary */}
                <Card className="p-5 border-none shadow-none">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Order Summary</h3>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg">
                      <span className="text-xs font-bold text-gray-600">
                        {currentOrder.shopOrders.length} Items
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {shopOrder.shopOrderItems?.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-start text-sm">
                        <div className="min-w-0">
                          <div className="text-gray-700 font-medium">
                            {item.quantity}x {item.name}
                          </div>
                          {item?.selectedOptions &&
                          Object.keys(item.selectedOptions).length > 0 ? (
                            <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                              {formatSelectedOptions(item.selectedOptions)}
                            </div>
                          ) : null}
                        </div>
                        <span className="text-gray-900 font-bold">
                          ฿{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full border-t border-gray-100 my-4"></div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        ฿{shopOrder.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-gray-900">
                        ฿{currentOrder.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    {currentOrder.paymentFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium text-gray-900">
                          ฿{currentOrder.paymentFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900">
                          Total
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          {getPaymentIcon(currentOrder.paymentMethod)}
                          <span>
                            {currentOrder.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Paid Online"}
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-primary-orange text-lg">
                        ฿{currentOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-5">
                    {canCancelOrder(shopOrder) && (
                      <button
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 border-none shadow-sm"
                        onClick={() => {
                          setCancelShopOrderId(
                            shopOrder.shop?._id || shopOrder.shop,
                          );
                          setShowCancelModal(true);
                        }}>
                        Cancel Order
                      </button>
                    )}
                    <button
                      className="w-full bg-white hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 border-none shadow-sm"
                      onClick={() =>
                        navigate(
                          `/order-detail/${currentOrder._id}?shopOrderId=${shopOrder._id}`,
                        )
                      }>
                      View Full Invoice <FaChevronRight size={10} />
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && cancelShopOrderId && (
        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancelShopOrderId(null);
          }}
          orderId={currentOrder._id}
          shopId={cancelShopOrderId}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

export default TrackOrderPage;
