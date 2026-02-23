import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import * as turf from "@turf/turf";
import { IoIosArrowRoundBack, IoIosArrowForward } from "react-icons/io";
import { IoLocationSharp, IoSearchOutline } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import {
  MdDeliveryDining,
  MdPayment,
  MdAccessTime,
  MdOutlineLocalOffer,
  MdAttachMoney,
  MdEdit,
} from "react-icons/md";
import {
  FaMotorcycle,
  FaUtensils,
  FaCheckCircle,
  FaExclamationCircle,
  FaHouseUser,
  FaQrcode,
  FaCcVisa,
  FaCcMastercard,
  FaCreditCard,
  FaStore,
  FaMinus,
  FaPlus,
  FaChevronRight,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { DELIVERY_CONFIG, CREDIT_CONFIG } from "../config/constants";
import { setAddress, setLocation } from "../redux/mapSlice";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { serverUrl } from "../App";
import {
  addMyOrder,
  clearCart,
  setShopsInMyCity,
  removeCartItem,
  updateQuantity,
} from "../redux/userSlice";
import { checkBusinessHours } from "../utils/checkBusinessHours";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useHeaderTitle } from "../context/UIContext.jsx";
import useCafeterias from "../hooks/useCafeterias";

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const locationState = useLocation();
  const apikey = import.meta.env.VITE_GEOAPIKEY;

  const isValidObjectId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

  const formatSelectedOptions = (selectedOptions) => {
    if (!selectedOptions || typeof selectedOptions !== "object") return "";

    const parts = [];
    Object.values(selectedOptions).forEach((value) => {
      if (!value) return;

      // New format: single -> { name, price }, multiple -> [{ name, price }]
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

        // Legacy format: { optionName: true/false }
        const names = Object.keys(value).filter((k) => value[k]);
        if (names.length) parts.push(names.join(", "));
        return;
      }
    });

    return parts.filter(Boolean).join(" • ");
  };

  // Redux State
  const { location, address } = useSelector((state) => state.map);
  const { cartItems, totalAmount, userData, shopsInMyCity, currentCafeteria } =
    useSelector((state) => state.user);

  // Local State
  const [addressInput, setAddressInput] = useState("");
  const [currentAddressNote, setCurrentAddressNote] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  const [locationKey, setLocationKey] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [isRetryPayment, setIsRetryPayment] = useState(false);
  const [retryAmount, setRetryAmount] = useState(0);
  const [orderError, setOrderError] = useState("");
  const [deliveryZone, setDeliveryZone] = useState(null);
  const [systemBaseDeliveryFee, setSystemBaseDeliveryFee] = useState(null);
  const [systemPricePerKm, setSystemPricePerKm] = useState(null);

  // Cafeteria data
  const { cafeterias, cafeteriaLocations } = useCafeterias();

  // Set global header title
  useHeaderTitle(isRetryPayment ? "Complete Payment" : "Checkout");

  // --- Effects & Logic from CheckOut ---

  // Handle retry payment from navigation state
  useEffect(() => {
    const state = locationState.state;
    if (state?.retryPayment && state?.orderId) {
      // Retry payment mode activated
      setIsRetryPayment(true);
      setOrderId(state.orderId);
      if (state.totalAmount) {
        setRetryAmount(state.totalAmount);
      }
      setSelectedPaymentMethod("online"); // Default to online for retry
    }
  }, [locationState.state]);

  // 1. Fetch Shops & Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/settings`);
        if (res.data?.deliveryZoneId) {
          setDeliveryZone(res.data.deliveryZoneId);
        }
        if (res.data) {
          if (res.data.baseDeliveryFee !== undefined) {
            const base = Number(res.data.baseDeliveryFee);
            setSystemBaseDeliveryFee(Number.isFinite(base) ? base : 0);
          }
          if (res.data.pricePerKm !== undefined) {
            const rate = Number(res.data.pricePerKm);
            setSystemPricePerKm(Number.isFinite(rate) ? rate : 5);
          }
        }
      } catch (error) {
        // Error fetching settings
      }
    };
    fetchSettings();

    const fetchShopsForCart = async () => {
      if (cartItems && cartItems.length > 0) {
        const uniqueShopIds = [...new Set(cartItems.map((item) => item.shop))];
        const missingShops = uniqueShopIds.filter(
          (shopId) => !shopsInMyCity?.find((s) => s._id === shopId),
        );

        if (missingShops.length > 0) {
          try {
            const shopPromises = missingShops.map((shopId) =>
              axios
                .get(`${serverUrl}/api/shop/get-by-id/${shopId}`, {
                  withCredentials: true,
                })
                .then((res) => res.data)
                .catch(() => null),
            );
            const fetchedShops = (await Promise.all(shopPromises)).filter(
              Boolean,
            );
            if (fetchedShops.length > 0) {
              dispatch(
                setShopsInMyCity([...(shopsInMyCity || []), ...fetchedShops]),
              );
            }
          } catch (error) {
            // Error fetching shops
          }
        }
      }
    };
    fetchShopsForCart();
  }, [cartItems, shopsInMyCity, dispatch]);

  // Validate Delivery Zone

  // 2. Calculate Distance & Fees
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isPeakTime = () => {
    const hours = new Date().getHours();
    return hours >= 11 && hours < 13;
  };

  // Distance from cafeteria origin to user's address
  const cafeteriaDistance = useMemo(() => {
    if (!location?.lat || !location?.lon) return null;

    // Get the first available cafeteria location as origin
    const firstCafeteria = cafeterias?.[0];
    const cafeteriaOrigin = firstCafeteria
      ? cafeteriaLocations[firstCafeteria]
      : null;

    if (!cafeteriaOrigin) return null;

    return calculateDistance(
      cafeteriaOrigin.lat,
      cafeteriaOrigin.lon,
      location.lat,
      location.lon,
    );
  }, [location, locationKey, cafeterias, cafeteriaLocations]);

  const computedDeliveryFee = useMemo(() => {
    if (totalAmount > DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    if (cafeteriaDistance === null || cartItems.length === 0) return 0;

    if (cafeteriaDistance > DELIVERY_CONFIG.MAX_DELIVERY_DISTANCE_KM)
      return null; // Block if delivery distance exceeds max

    // Distance-only calculation (base is configured by admin in settings)
    const fallbackRate = isPeakTime()
      ? DELIVERY_CONFIG.PEAK_HOUR_RATE
      : DELIVERY_CONFIG.NORMAL_HOUR_RATE;

    // Use system setting if available, otherwise fallback to local config
    const rate = systemPricePerKm !== null ? systemPricePerKm : fallbackRate;

    const base = systemBaseDeliveryFee || 0;
    // Formula: Base + (Distance * Rate) -> Rounded Down (Math.floor)
    // No cap on the total fee, as per backend logic.
    // Backend logic: calculatedDeliveryFee = Math.floor(baseDeliveryFee + (distance * pricePerKm));

    return Math.floor(base + cafeteriaDistance * rate);
  }, [
    cafeteriaDistance,
    cartItems,
    totalAmount,
    systemBaseDeliveryFee,
    systemPricePerKm,
  ]);

  // Adjust fee based on Delivery Option
  const finalDeliveryFee = useMemo(() => {
    if (totalAmount > DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;

    if (computedDeliveryFee === null) return 0;
    if (computedDeliveryFee === 0) return 0;

    // Total = Base Delivery Fee (from Settings) + Distance-based fee
    // Total = Distance-based fee (which already includes Base as per updated logic)
    // Note: computedDeliveryFee includes the base fee in its calculation now.
    const totalFee = computedDeliveryFee;
    return Math.round(totalFee * 100) / 100;
  }, [computedDeliveryFee, totalAmount]);

  const subtotal = typeof totalAmount === "number" ? totalAmount : 0;
  const totalPayable = totalAmount + finalDeliveryFee;
  const isDistanceExceeded = computedDeliveryFee === null;

  // Helper to get default card
  const defaultCard = useMemo(() => {
    if (userData?.savedCards?.length > 0) {
      return (
        userData.savedCards.find((c) => c.isDefault) || userData.savedCards[0]
      );
    }
    return null;
  }, [userData]);

  const handleIncreaseQuantity = (cartItemId, quantity) => {
    dispatch(updateQuantity({ cartItemId, quantity: quantity + 1 }));
  };

  const handleDecreaseQuantity = (cartItemId, quantity) => {
    if (quantity > 1) {
      dispatch(updateQuantity({ cartItemId, quantity: quantity - 1 }));
    }
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeCartItem({ cartItemId }));
  };

  // 3. Location Handlers
  const getCurrentLocation = () => {
    if (userData?.location?.coordinates) {
      const [lon, lat] = userData.location.coordinates;
      dispatch(setLocation({ lat, lon }));
      setLocationKey((prev) => prev + 1);
      getAddressByLatLng(lat, lon);
    }
  };

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`,
      );
      const addr = res?.data?.results[0]?.formatted;
      if (addr) {
        dispatch(setAddress(addr));
        setAddressInput(addr);
      }
    } catch (err) {
      // Error geocoding address
    }
  };

  const getLatLngByAddress = async () => {
    if (!addressInput.trim()) return;
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          addressInput,
        )}&apiKey=${apikey}`,
      );
      if (res.data.features?.length > 0) {
        const { lat, lon } = res.data.features[0].properties;
        dispatch(setLocation({ lat, lon }));
        setLocationKey((prev) => prev + 1);
        setAddressInput(res.data.features[0].properties.formatted);
      }
    } catch (err) {
      // Error getting location
    }
  };

  // 4. Order Logic
  const handlePlaceOrder = async () => {
    if (isRetryPayment && orderId) {
      setIsProcessingPayment(true);
      await createPaymentIntent(orderId);
      return;
    }

    // Check shops status
    const uniqueShopIds = [...new Set(cartItems.map((item) => item.shop))];
    for (const shopId of uniqueShopIds) {
      const shop = shopsInMyCity?.find((s) => s._id === shopId);
      if (shop && shop.businessHours) {
        const status = checkBusinessHours(
          shop.businessHours,
          shop.temporaryClosure,
        );
        if (!status.isOpen) {
          toast.error(`Cannot place order. ${shop.name} is closed.`);
          return;
        }
      }
    }

    setIsProcessingPayment(true);
    setOrderError(""); // Clear previous errors
    try {
      const orderData = {
        paymentMethod: selectedPaymentMethod,
        deliveryAddress: {
          text: addressInput,
          latitude: location.lat,
          longitude: location.lon,
        },
        totalAmount: totalPayable,
        deliveryFee: finalDeliveryFee,
        cartItems,
      };

      const res = await axios.post(
        `${serverUrl}/api/order/place-order`,
        orderData,
        { withCredentials: true },
      );

      if (selectedPaymentMethod === "cod") {
        dispatch(addMyOrder(res.data));
        dispatch(clearCart());
        navigate(`/track-order/${res.data._id}`);
      } else {
        setOrderId(res.data._id);
        // Store order ID in localStorage for OrderPlaced page verification
        localStorage.setItem("pendingOrderId", res.data._id);
        await createPaymentIntent(res.data._id);
      }
    } catch (error) {
      // Order failed
      const msg = error.response?.data?.message || "Order failed";
      setOrderError(msg);
      // toast.error(msg); // Removed per user request
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const createPaymentIntent = async (orderId) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/create-payment-intent`,
        { orderId },
        { withCredentials: true },
      );
      if (res.data?.url) window.location.href = res.data.url;
    } catch (error) {
      toast.error("Payment initialization failed");
      setIsProcessingPayment(false);
    }
  };

  // Initialize selected payment method from user preference
  useEffect(() => {
    if (userData?.defaultPaymentMethod) {
      setSelectedPaymentMethod(userData.defaultPaymentMethod);
    }
  }, [userData]);

  // 5. Initial Load
  useEffect(() => {
    if (
      address &&
      !userData?.savedAddresses?.find(
        (a) =>
          a.isDefault &&
          (a.label ? `${a.label} - ${a.address}` : a.address) === addressInput,
      )
    ) {
      setAddressInput(address);
    }

    // Check for payment return
    if (locationState.search.includes("payment=success")) {
      navigate("/order-placed");
    }
  }, [address, locationState.search]);

  // Set default address from user profile
  useEffect(() => {
    if (userData?.savedAddresses?.length > 0) {
      const defaultAddress = userData.savedAddresses.find(
        (addr) => addr.isDefault,
      );
      if (defaultAddress) {
        dispatch(setAddress(defaultAddress.address));
        if (defaultAddress.location) {
          dispatch(
            setLocation({
              lat: defaultAddress.location.lat,
              lon: defaultAddress.location.lon,
            }),
          );
        }
        const displayText = defaultAddress.label
          ? `${defaultAddress.label} - ${defaultAddress.address}`
          : defaultAddress.address;

        setAddressInput(displayText);
        if (defaultAddress.note) {
          setCurrentAddressNote(defaultAddress.note);
        }
      }
    }
  }, [userData, dispatch]);

  if (cartItems.length === 0 && !isRetryPayment) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Card className="p-8 text-center">
            <EmptyState
              icon={<FaUtensils className="text-orange-600 text-4xl" />}
              title="Cart is empty"
              description="Add dishes from a restaurant to start your order."
              className="pt-0"
            />
            <div className="mt-8 flex justify-center">
              <PrimaryButton
                onClick={() => navigate("/")}
                type="button"
                className="w-full sm:w-auto px-10 py-3.5 rounded-2xl hover:translate-y-0 active:translate-y-0">
                Browse restaurants
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-36 lg:pb-8">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT COLUMN: Address & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Retry Payment Warning */}
            {isRetryPayment && (
              <Card className="bg-primary-orange/10 p-4 flex gap-3 items-start">
                <div className="mt-1 text-primary-orange">
                  <MdAttachMoney size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-bold">
                    Pending Amount: ฿{retryAmount}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Please complete payment to confirm your order.
                  </p>
                </div>
              </Card>
            )}

            {isDistanceExceeded && !isRetryPayment && (
              <Card className="bg-red-50 border-none p-4 flex gap-3 items-start text-red-700">
                <div className="mt-0.5 shrink-0">
                  <FaExclamationCircle />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Delivery distance exceeded
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Please reduce items from far restaurants or change your
                    delivery location.
                  </p>
                </div>
              </Card>
            )}

            {/* 1. Address Card */}
            {!isRetryPayment && (
              <Card className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-extrabold text-gray-900 text-base">
                    Deliver to
                  </h2>
                  <button
                    className="text-primary-orange text-sm font-bold bg-primary-orange/10 px-3 py-1 rounded-2xl hover:bg-primary-orange/20 transition-colors"
                    onClick={() => {
                      const defaultAddress = userData?.savedAddresses?.find(
                        (addr) => addr.isDefault,
                      );
                      if (defaultAddress) {
                        navigate("/saved-addresses", {
                          state: { editId: defaultAddress._id },
                        });
                      } else {
                        navigate("/saved-addresses");
                      }
                    }}>
                    Edit
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange shrink-0">
                    <IoLocationSharp size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm mb-0.5 truncate">
                      {addressInput?.split(",")[0] || "Select Address"}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {addressInput}
                    </p>
                  </div>
                </div>

                {currentAddressNote && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-start gap-3">
                    <div className="w-10 flex justify-center text-gray-400">
                      <FaHouseUser size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-700">
                        Driver Instruction
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentAddressNote}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 2. Order Summary */}
            {!isRetryPayment && (
              <Card className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FaStore className="text-gray-400" />
                    <h2 className="font-extrabold text-gray-900 text-base">
                      Order Summary
                    </h2>
                  </div>
                  <button
                    className="text-primary-orange text-xs font-bold bg-primary-orange/10 px-3 py-1 rounded-2xl hover:bg-primary-orange/20 transition-colors"
                    onClick={() => {
                      if (cartItems.length > 0 && cartItems[0].shop) {
                        navigate(`/restaurant/${cartItems[0].shop}`);
                      }
                    }}>
                    Add Items
                  </button>
                </div>

                <div className="space-y-4 mb-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartItemId || item.id}
                      className="flex gap-4 p-4 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaUtensils />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                              {item.selectedOptions &&
                              Object.keys(item.selectedOptions).length > 0
                                ? formatSelectedOptions(item.selectedOptions)
                                : item.description || ""}
                            </p>
                            {item.specialInstructions && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <span className="font-extrabold text-gray-900 text-sm shrink-0">
                            ฿
                            {(
                              Number(item.price) * Number(item.quantity)
                            ).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="w-9 h-9 rounded-full bg-white border-none shadow-sm flex items-center justify-center hover:bg-primary-orange/10 hover:text-primary-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() =>
                                handleDecreaseQuantity(
                                  item.cartItemId,
                                  item.quantity,
                                )
                              }
                              disabled={item.quantity <= 1}>
                              <FaMinus size={12} className="text-gray-700" />
                            </button>
                            <div className="min-w-[34px] text-center font-bold text-gray-900">
                              {item.quantity}
                            </div>
                            <button
                              className="w-9 h-9 rounded-full bg-white border-none shadow-sm flex items-center justify-center hover:bg-primary-orange/10 hover:text-primary-orange transition-colors"
                              onClick={() =>
                                handleIncreaseQuantity(
                                  item.cartItemId || item.id,
                                  item.quantity,
                                )
                              }>
                              <FaPlus size={12} className="text-gray-700" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              className="text-primary-orange text-xs font-bold hover:text-primary-orange/90 transition-colors"
                              onClick={() => {
                                const itemId =
                                  item?.id || item?._id || item?.itemId;
                                if (!isValidObjectId(itemId)) {
                                  toast.error("Item not available");
                                  return;
                                }
                                navigate(`/item/${itemId}`);
                              }}>
                              Edit
                            </button>
                            <button
                              className="text-red-600 text-xs font-bold"
                              onClick={() =>
                                handleRemoveItem(item.cartItemId || item.id)
                              }>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Error Display (Desktop/Tablet placement) */}
            {orderError && (
              <Card className="bg-red-50 border-none p-4 flex gap-3 text-red-600">
                <FaExclamationCircle className="mt-0.5 shrink-0" />
                <p className="text-sm font-medium leading-tight">
                  {orderError}
                </p>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Payment & Totals */}
          <div className="lg:col-span-1 space-y-6">
            {/* 3. Payment Method */}
            <Card
              className="p-5 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => navigate("/payment-methods")}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="flex items-center gap-3">
                {selectedPaymentMethod === "cod" ? (
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <MdAttachMoney size={20} />
                  </div>
                ) : selectedPaymentMethod === "promptpay" ? (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <FaQrcode size={18} />
                  </div>
                ) : defaultCard ? (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    {defaultCard.cardType === "visa" ? (
                      <FaCcVisa size={24} className="text-[#1A1F71]" />
                    ) : defaultCard.cardType === "mastercard" ? (
                      <FaCcMastercard size={24} className="text-[#EB001B]" />
                    ) : (
                      <FaCreditCard size={20} className="text-gray-600" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <MdPayment size={20} />
                  </div>
                )}

                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {selectedPaymentMethod === "cod" ? (
                      "Cash on Delivery"
                    ) : selectedPaymentMethod === "promptpay" ? (
                      "Scan QR Code"
                    ) : defaultCard ? (
                      <span className="capitalize">
                        {defaultCard.cardType} •••• {defaultCard.last4}
                      </span>
                    ) : (
                      "Credit / Debit Card"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedPaymentMethod === "cod"
                      ? "Pay when you receive"
                      : "Secure payment"}
                  </p>
                </div>
                <IoIosArrowForward className="text-gray-300" />
              </div>
            </Card>

            {/* Totals & Sticky Button Wrapper */}
            <Card className="p-5 lg:sticky lg:top-24">
              {/* Totals */}
              <div className="border-b border-dashed border-gray-200 pb-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">฿{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-bold">
                    {isDistanceExceeded
                      ? "N/A"
                      : `฿${finalDeliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                  <span className="font-extrabold text-gray-900 text-lg">
                    Total
                  </span>
                  <span className="font-extrabold text-orange-600 text-lg">
                    ฿{totalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Desktop/Tablet Button */}
              <button
                className="w-full bg-primary-orange text-white font-bold py-4 rounded-2xl justify-between items-center px-6 shadow-lg shadow-primary-orange/20 hover:bg-primary-orange/90 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 hidden lg:flex"
                onClick={handlePlaceOrder}
                disabled={
                  isProcessingPayment || isDistanceExceeded || !!orderError
                }>
                <div className="flex items-center gap-3">
                  {/* <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-sm font-bold">
                        {isRetryPayment
                          ? 1
                          : cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    </div> */}
                  {isProcessingPayment && (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  )}
                  <span className="text-base">
                    {isProcessingPayment
                      ? "Processing..."
                      : isRetryPayment
                        ? "Retry Payment"
                        : "Place Order"}
                  </span>
                </div>
                <span className="text-base">
                  ฿
                  {isRetryPayment
                    ? retryAmount.toFixed(2)
                    : totalPayable.toFixed(2)}
                </span>
              </button>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-gray-100 p-4 z-60 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            className="w-full bg-primary-orange text-white font-bold py-4 rounded-2xl flex justify-between items-center px-6 shadow-lg shadow-primary-orange/20 hover:bg-primary-orange/90 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
            onClick={handlePlaceOrder}
            disabled={
              isProcessingPayment || isDistanceExceeded || !!orderError
            }>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-sm font-bold">
                  {isRetryPayment
                    ? 1
                    : cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <span className="text-lg">
                {isProcessingPayment
                  ? "Processing..."
                  : isRetryPayment
                    ? "Retry Payment"
                    : "Place Order"}
              </span>
            </div>
            <span className="text-lg">
              ฿
              {isRetryPayment
                ? retryAmount.toFixed(2)
                : totalPayable.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
