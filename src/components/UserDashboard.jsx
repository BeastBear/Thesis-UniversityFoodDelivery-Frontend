import React, { useEffect, useState } from "react";
import RestaurantListingCard from "./RestaurantListingCard";
import Footer from "./Footer";
import RestaurantSkeleton from "./RestaurantSkeleton";
import {
  FaArrowRight,
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaFilter,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { categories } from "../../category.js";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import useCafeterias from "../hooks/useCafeterias";
import {
  IoSparkles,
  IoLocationSharp,
  IoTimeOutline,
  IoRestaurant,
} from "react-icons/io5";
import { MdLocalFireDepartment, MdDeliveryDining } from "react-icons/md";
import { toast } from "react-toastify";
import { DELIVERY_CONFIG } from "../config/constants";

function UserDashboard() {
  const { shopsInMyCity, allShops, userData, isShopLoading } = useSelector(
    (state) => state.user,
  );
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const {
    cafeterias,
    cafeteriaLocations,
    cafeteriaImages,
    baseDeliveryFee,
    pricePerKm,
  } = useCafeterias();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [globalCategories, setGlobalCategories] = useState([]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const itemsInMyCity = useSelector((state) => state.user.itemsInMyCity);

  const isValidObjectId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

  const allAvailableShops = (allShops || shopsInMyCity || []).filter(Boolean);

  const matchedShops = normalizedQuery
    ? allAvailableShops.filter((s) => {
        const name = (s?.name || "").toLowerCase();
        const categoryText = s?.category?.name
          ? s.category.name.toLowerCase()
          : "";
        return (
          name.includes(normalizedQuery) ||
          categoryText.includes(normalizedQuery)
        );
      })
    : [];

  const matchedItems = normalizedQuery
    ? (itemsInMyCity || [])
        .filter((i) => i?.isAvailable !== false)
        .filter((i) => {
          const name = (i?.name || "").toLowerCase();
          const desc = (i?.description || "").toLowerCase();
          const category = (i?.category || "").toLowerCase();
          return (
            name.includes(normalizedQuery) ||
            desc.includes(normalizedQuery) ||
            category.includes(normalizedQuery)
          );
        })
        .slice(0, 8)
    : [];

  const showSearchResults = normalizedQuery.length > 0;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let alive = true;
    const loadGlobalCategories = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/global-categories`);
        if (!alive) return;
        setGlobalCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!alive) return;
        setGlobalCategories([]);
      }
    };
    loadGlobalCategories();
    return () => {
      alive = false;
    };
  }, []);

  const categoryCards =
    Array.isArray(globalCategories) && globalCategories.length > 0
      ? globalCategories
          .filter((c) => c?.isActive !== false)
          .sort((a, b) => (a?.order || 0) - (b?.order || 0))
          .map((c) => ({
            category: c?.name || "",
            image: c?.image || "",
          }))
          .filter((c) => !!c.category)
      : categories;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    document
      .getElementById("search-results")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      {/* 1. Minimalist Hero Section (Centered) */}
      <div className="w-full relative py-6 sm:py-10 md:py-14 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center gap-8 max-w-4xl mx-auto z-10">
          {/* Greeting & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              Good Morning, <br className="lg:hidden" />
              <span className="text-primary-orange">
                {userData?.fullName?.split(" ")[0] || "Guest"}!
              </span>
            </h1>
            <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-lg leading-relaxed">
              Hungry? Let's find delicious food around campus.
            </p>
          </div>

          {/* Search Bar - Mobile Only */}
          <div className="relative max-w-full md:hidden">
            <div className="relative group">
              <FaSearch
                className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-orange transition-colors z-10"
                size={20}
              />
              <input
                type="text"
                placeholder="Search for restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full bg-white border border-gray-100 focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/10 rounded-2xl py-4 pl-14 pr-20 text-gray-800 placeholder-gray-400 font-medium transition-all shadow-sm"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-orange hover:bg-primary-orange/90 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95">
                Search
              </button>
            </div>
          </div>

          {/* Desktop Actions (Grouped) */}
          <div className="hidden md:flex flex-wrap justify-center gap-4 w-full">
            <button
              onClick={() =>
                document
                  .getElementById("categories-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-primary-orange hover:bg-primary-orange/90 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 group flex-1 sm:flex-none justify-center">
              Explore Restaurants
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("categories-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-white border-2 border-gray-100 hover:border-primary-orange/30 hover:bg-white text-gray-700 hover:text-primary-orange px-6 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2 justify-center">
              <FaFilter size={16} />
              Browse Categories
            </button>
          </div>

          {/* Quick Stats / Trust Signals (Centered) */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-400 text-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {allShops?.length || "20+"} Restaurants
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-orange"></div>
              Fast Delivery
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div id="search-results" className="flex flex-col gap-5">
          <div className="flex justify-between items-end px-1">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Search results
              </h2>
              <p className="text-gray-500 text-sm">
                for "{searchQuery.trim()}"
              </p>
            </div>
          </div>

          {matchedShops.length === 0 && matchedItems.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-600 font-bold">No results found</p>
              <p className="text-gray-400 text-sm mt-1">Try another keyword</p>
            </div>
          ) : (
            <>
              {matchedShops.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-extrabold text-gray-900 px-1">
                    Restaurants
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {matchedShops.slice(0, 8).map((shop) => (
                      <RestaurantListingCard
                        key={shop._id}
                        data={shop}
                        onClick={() => navigate(`/restaurant/${shop._id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {matchedItems.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-extrabold text-gray-900 px-1">
                    Dishes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {matchedItems.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          const itemId = item?._id || item?.id || item?.itemId;
                          if (!isValidObjectId(itemId)) {
                            toast.error("Item not available");
                            return;
                          }
                          navigate(`/item/${itemId}`);
                        }}
                        className="w-full bg-white rounded-3xl p-4 border-none shadow-lg hover:shadow-xl transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.category || "Food"}
                            </p>
                          </div>
                          <div className="font-extrabold text-primary-orange">
                            ฿{Math.ceil(item.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cafeteria Section */}
      {cafeterias?.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-1">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Cafeterias
              </h2>
              <p className="text-gray-500 text-sm">
                Pick a cafeteria to browse restaurants
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cafeterias.map((name) => (
              <div
                key={name}
                onClick={() =>
                  navigate(`/cafeteria/${encodeURIComponent(name)}`)
                }
                className="w-full bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group p-0 duration-300">
                {/* Image Section - matching RestaurantListingCard */}
                <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
                  {cafeteriaImages?.[name] ? (
                    <img
                      src={cafeteriaImages[name]}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-50 to-orange-100">
                      <IoRestaurant className="text-4xl text-primary-orange/40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/35 to-transparent" />
                </div>
                {/* Content Section - matching RestaurantListingCard */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-gray-900 font-bold text-lg truncate flex-1 group-hover:text-primary-orange transition-colors">
                      {name}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm truncate">
                    Browse restaurants
                  </p>
                  <div className="flex items-center gap-2 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Premium Categories Section */}
      <div id="categories-section" className="flex flex-col gap-6">
        <div className="flex justify-between items-end px-1">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Explore by Category
            </h2>
            <p className="text-gray-500 text-sm">
              Choose from hundreds of options
            </p>
          </div>
          <button className="text-primary-orange hover:text-primary-orange/90 text-sm font-bold hover:underline transition-colors flex items-center gap-1">
            View All
            <FaArrowRight size={12} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            onClick={() => {
              navigate("/category/all");
            }}
            className="min-w-[100px] snap-start flex flex-col items-center gap-3 cursor-pointer group transition-all">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg border transition-all group-hover:shadow-xl group-hover:-translate-y-1 group-hover:rotate-1 bg-linear-to-br from-gray-50 to-gray-100 border-gray-200">
              <IoRestaurant className="text-2xl sm:text-3xl text-gray-600 group-hover:text-primary-orange transition-colors" />
            </div>
            <span className="font-semibold text-sm transition-colors whitespace-nowrap text-center text-gray-700 group-hover:text-primary-orange">
              All
            </span>
          </div>
          {categoryCards.map((cate, index) => {
            // Find the category ID from globalCategories
            const categoryData = globalCategories.find(
              (gc) => gc.name === cate.category,
            );
            const categoryId = categoryData?._id;
            return (
              <div
                key={index}
                onClick={() => {
                  if (categoryId) {
                    navigate(`/category/${categoryId}`);
                  }
                }}
                className="min-w-[100px] snap-start flex flex-col items-center gap-3 cursor-pointer group transition-all">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg border transition-all group-hover:shadow-xl group-hover:-translate-y-1 group-hover:rotate-1 ${
                    index % 3 === 0
                      ? "bg-linear-to-br from-primary-orange/10 to-primary-orange/20 border-none shadow-md"
                      : index % 3 === 1
                        ? "bg-linear-to-br from-blue-50 to-blue-100 border-blue-200"
                        : "bg-linear-to-br from-green-50 to-green-100 border-green-200"
                  }`}>
                  <img
                    src={cate.image}
                    alt={cate.category}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110"
                  />
                </div>
                <span className="font-semibold text-sm transition-colors whitespace-nowrap text-center text-gray-700 group-hover:text-primary-orange">
                  {cate.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Trending Shops Section */}
      <div id="trending-section" className="flex flex-col gap-6">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <MdLocalFireDepartment className="text-primary-orange" />
              Recommended For You
            </h2>
            <p className="text-gray-500 text-sm">
              Based on your taste and location
            </p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border-none shadow-sm flex items-center justify-center text-gray-400 hover:bg-white hover:text-primary-orange transition-all hover:scale-105">
              <FaArrowRight className="rotate-180" size={14} />
            </button>
            <button className="w-10 h-10 rounded-full border-none shadow-sm flex items-center justify-center text-gray-400 hover:bg-white hover:text-primary-orange transition-all hover:scale-105">
              <FaArrowRight size={14} />
            </button>
          </div>
        </div>

        {isShopLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <RestaurantSkeleton key={i} />
            ))}
          </div>
        ) : (allShops || shopsInMyCity)?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(allShops || shopsInMyCity).map((shop) => {
              // Distance from central cafeteria to user
              // Priority: Default Address -> First Saved Address -> GPS
              const savedAddresses = userData?.savedAddresses || [];
              const defaultAddress = savedAddresses.find((a) => a.isDefault);
              const targetAddress = defaultAddress || savedAddresses[0];

              const userLat =
                targetAddress?.location?.lat ||
                userData?.location?.coordinates?.[1];
              const userLon =
                targetAddress?.location?.lon ||
                userData?.location?.coordinates?.[0];
              // Get the first available cafeteria location as origin
              const firstCafeteria = cafeterias?.[0];
              const cafeteriaOrigin = firstCafeteria
                ? cafeteriaLocations[firstCafeteria]
                : null;

              if (!cafeteriaOrigin) return null;

              const distance = calculateDistance(
                cafeteriaOrigin.lat,
                cafeteriaOrigin.lon,
                userLat,
                userLon,
              );
              const duration = distance ? Math.round(distance * 2 + 10) : null;
              const deliveryFee = (() => {
                if (
                  !distance ||
                  distance > DELIVERY_CONFIG.MAX_DELIVERY_DISTANCE_KM
                )
                  return null;
                const rate =
                  pricePerKm !== undefined && pricePerKm !== null
                    ? pricePerKm
                    : DELIVERY_CONFIG.NORMAL_HOUR_RATE;
                const base = baseDeliveryFee || 0;
                return Math.floor(base + distance * rate);
              })();

              return (
                <RestaurantListingCard
                  key={shop._id}
                  data={shop}
                  distance={distance}
                  duration={duration}
                  deliveryFee={deliveryFee}
                  onClick={() => navigate(`/restaurant/${shop._id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-linear-to-br from-gray-50 to-gray-100 rounded-3xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoLocationSharp className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 font-bold text-lg mb-2">
              No restaurants found near you
            </p>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Try adjusting your location or browse all restaurants
            </p>
            <button className="bg-primary-orange hover:bg-primary-orange/90 text-white font-bold px-8 py-3 rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-primary-orange/20">
              Change Location
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default UserDashboard;
