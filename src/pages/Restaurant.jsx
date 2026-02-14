import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { serverUrl } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  FaUtensils,
  FaStar,
  FaMotorcycle,
  FaTicketAlt,
  FaShare,
  FaFire,
  FaInfoCircle,
  FaChevronRight,
  FaChevronLeft,
  FaClock,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import FoodCard from "../components/FoodCard";
import FoodSkeleton from "../components/FoodSkeleton";
import { checkBusinessHours } from "../utils/checkBusinessHours";
import { useBackNavigation } from "../hooks/useBackNavigation";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useHeaderTitle } from "../context/UIContext.jsx";

function Restaurant() {
  const { shopId } = useParams();
  const [items, setItems] = useState([]);
  const [shop, setShop] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isClosingSoon, setIsClosingSoon] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { cartItems } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { handleBack } = useBackNavigation();
  const searchInputRef = useRef(null);

  useHeaderTitle(shop?.name, { loading, loadingText: "Loading..." });

  const getCategoryDomId = (category) =>
    `category-${encodeURIComponent(category)}`;

  const isValidObjectId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

  // ... (keep intervening code if accessible via replace, but here I'm replacing big chunk so I need to be careful.
  // Actually, I should use smaller chunks.

  // Filter cart items for current shop
  const currentShopCartItems = cartItems.filter((item) => item.shop === shopId);
  const totalQuantity = currentShopCartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalPrice = currentShopCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const filteredItemsForTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return (items || []).filter((it) => {
      if (it?.isAvailable === false) return false;
      const name = (it?.name || "").toLowerCase();
      const category = (it?.category || "").toLowerCase();
      const desc = (it?.description || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q);
    });
  }, [items, searchQuery]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    filteredItemsForTabs.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [filteredItemsForTabs]);

  // Create a map of category IDs to names from available items
  const categoryIdToNameMap = useMemo(() => {
    const map = {};
    (items || []).forEach((item) => {
      if (item.category && typeof item.category === "object") {
        map[item.category._id] = item.category.name;
      }
      // Also check if categories array has objects (though usually it's IDs)
      if (Array.isArray(item.categories)) {
        item.categories.forEach((c) => {
          if (typeof c === "object" && c._id && c.name) {
            map[c._id] = c.name;
          }
        });
      }
    });
    return map;
  }, [items]);

  // Group items for display
  const groupedDisplayItems = filteredItemsForTabs.reduce((acc, item) => {
    if (item.isAvailable !== false) {
      // Use item.categories (array) if available and populated
      let categoriesToUse = [];
      if (
        item.categories &&
        Array.isArray(item.categories) &&
        item.categories.length > 0
      ) {
        categoriesToUse = item.categories.map((c) => {
          // If it's an object, use name. If string (ID), try to lookup name.
          if (typeof c === "object") return c.name;
          return categoryIdToNameMap[c] || c; // Fallback to ID if name not found
        });
      } else if (item.category) {
        categoriesToUse = [
          typeof item.category === "object"
            ? item.category.name
            : categoryIdToNameMap[item.category] || item.category,
        ];
      } else {
        categoriesToUse = ["Other"];
      }

      categoriesToUse.forEach((categoryName) => {
        // If we still have an ID (24 hex chars) and couldn't resolve it, try one last check or skip?
        // Ideally we shouldn't show raw IDs. But for now let's keep it robust.
        if (!categoryName) return;

        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        // Avoid duplicates within the same category
        if (!acc[categoryName].some((i) => i._id === item._id)) {
          acc[categoryName].push(item);
        }
      });
    }
    return acc;
  }, {});

  const hasAnyResults = filteredItemsForTabs.some(
    (it) => it?.isAvailable !== false,
  );

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    if (category === "Recommended") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(getCategoryDomId(category));
    if (element) {
      // Offset for sticky header
      const yOffset = -200;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleShop = async () => {
    setLoading(true);
    try {
      const result = await axios.get(
        `${serverUrl}/api/item/get-by-shop/${shopId}`,
        { withCredentials: true },
      );
      setShop(result.data.shop);
      const normalizedItems = Array.isArray(result.data.items)
        ? result.data.items
            .filter(Boolean)
            .map((it) => {
              const id = it?._id || it?.id || it?.itemId;
              return id ? { ...it, _id: id } : it;
            })
            .filter((it) => isValidObjectId(it?._id))
        : [];
      setItems(normalizedItems);
      if (result.data.shop?.businessHours) {
        const status = checkBusinessHours(
          result.data.shop.businessHours,
          result.data.shop.temporaryClosure,
        );
        setIsOpen(status.isOpen);
        setIsClosingSoon(status.isClosingSoon);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load shop menu";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleShop();
  }, [shopId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/restaurant/${shopId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shop?.name || "Restaurant",
          text: shop?.name
            ? `Check out ${shop.name}`
            : "Check out this restaurant",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (e) {
      toast.error("Couldn't share right now");
    }
  };

  const promoBadges = [];
  const hasOnlineDiscount = (items || []).some(
    (i) =>
      i?.isAvailable !== false &&
      typeof i?.onlinePrice === "number" &&
      typeof i?.price === "number" &&
      i.onlinePrice > 0 &&
      i.onlinePrice < i.price,
  );
  if (hasOnlineDiscount) {
    promoBadges.push({
      icon: <FaFire className="text-orange-600" />,
      text: "Deals available",
    });
  }
  if (shop?.note) {
    promoBadges.push({
      icon: <FaTicketAlt className="text-orange-600" />,
      text: shop.note,
    });
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* 1. Full Width Hero Section */}
      <div className="relative w-full h-[280px] sm:h-[320px] md:h-[350px]">
        {shop?.image ? (
          <img
            src={shop.image}
            alt={shop.name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10"></div>

        {/* Floating Back Button - Hidden on mobile, visible on desktop */}
        <button
          onClick={handleBack}
          className="hidden md:flex absolute top-6 left-6 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all shadow-lg">
          <FaChevronLeft size={18} />
        </button>

        {/* Hero Content (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-6 md:p-10">
          <div className="w-full px-4 md:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-white">
              <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-md">
                {shop?.name || ""}
              </h1>
              <div className="flex items-center flex-wrap gap-3 text-sm font-medium opacity-95">
                {/* Restaurant Category */}
                {shop?.category?.name && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className="font-bold">{shop.category.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  <FaStar className="text-yellow-400" />
                  <span className="font-bold">
                    {shop?.rating?.average
                      ? Number(shop.rating.average).toFixed(1)
                      : "New"}
                  </span>
                  <span className="text-xs opacity-70 font-normal">
                    ({shop?.rating?.count || 0})
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <FaClock className="opacity-80" />
                  {isOpen
                    ? isClosingSoon
                      ? "Closing Soon"
                      : "Open Now"
                    : "Closed"}
                </span>
                <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <FaMotorcycle className="opacity-80" />
                  Delivery
                </span>
                <button
                  onClick={() => navigate(`/restaurant/${shopId}/detail`)}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs transition-colors border border-white/20 flex items-center gap-1">
                  Info <FaChevronRight size={10} />
                </button>
              </div>

              {shop?.description && (
                <p className="text-white/80 mt-2 max-w-2xl text-base font-medium leading-relaxed line-clamp-1">
                  {shop.description}
                </p>
              )}
            </div>

            {/* Contextual Actions (Like Share/Reviews) */}
          </div>
        </div>
      </div>

      {/* 2. Content Container - Fluid Width */}
      <div className="w-full px-4 sm:px-6 md:px-10 pt-6 pb-8 max-w-5xl mx-auto">
        {/* Promo Section */}
        {promoBadges.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {promoBadges.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 border border-orange-100 bg-orange-50/50 px-3 py-1.5 rounded-full">
                {p.icon}
                <span className="text-xs font-bold text-orange-700">
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Sticky Tabs & Search */}
        <div className="sticky top-16 sm:top-20 md:top-6 bg-white/95 backdrop-blur-xl z-30 pt-2 pb-4 mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-50 shadow-sm">
          <div className="w-full">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative max-w-lg mx-auto">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={14}
                />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full bg-gray-100/50 border-none focus:bg-white shadow-sm focus:shadow-md focus:ring-1 focus:ring-primary-orange/20 rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-gray-800 placeholder-gray-400 transition-all"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors">
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Tabs - Clean & Tight */}
            <div className="flex justify-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("menu");
                  handleCategoryClick("Recommended");
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  activeTab === "menu" &&
                  (activeCategory === "Recommended" || !activeCategory)
                    ? "bg-black text-white border-black shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300"
                }`}>
                Recommended
              </button>
              {uniqueCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => {
                    setActiveTab("menu");
                    handleCategoryClick(category);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    activeTab === "menu" && activeCategory === category
                      ? "bg-black text-white border-black shadow-md transform scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300"
                  }`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Menu Grid */}
        <div className="pb-10">
          {!loading && searchQuery.trim().length > 0 && !hasAnyResults && (
            <div className="max-w-xs mx-auto py-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                <FaSearch />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No results
              </h3>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm font-bold text-gray-600 underline">
                Clear Search
              </button>
            </div>
          )}

          {/* Recommended Section (Always Visible if not searching) */}
          {searchQuery.trim().length === 0 &&
            (loading ||
              (items &&
                items.some(
                  (i) => i.isAvailable !== false && i.isRecommended === true,
                ))) && (
              <div className="mb-12 animate-fade-in" id="recommended-section">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <FaFire className="text-orange-500" /> Recommended
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {loading
                    ? [...Array(4)].map((_, i) => (
                        <div key={i} className="h-full">
                          <FoodSkeleton />
                        </div>
                      ))
                    : items
                        .filter(
                          (item) =>
                            item.isAvailable !== false &&
                            item.isRecommended === true,
                        )
                        .map((item, index) => (
                          <div key={item._id} className="h-full">
                            <FoodCard data={item} />
                          </div>
                        ))}
                </div>
              </div>
            )}

          {/* Categories */}
          {!(searchQuery.trim().length > 0 && !hasAnyResults) && (
            <div className="flex flex-col gap-12">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-full">
                      <FoodSkeleton />
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedDisplayItems).length > 0 ? (
                Object.keys(groupedDisplayItems).map((category) => (
                  <div
                    key={category}
                    id={getCategoryDomId(category)}
                    className="animate-fade-in scroll-mt-32">
                    <div className="flex items-end gap-3 mb-5">
                      <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                        {category}
                      </h2>
                      <span className="text-xs font-bold text-gray-400 mb-1.5">
                        ({groupedDisplayItems[category].length})
                      </span>
                      <div className="h-px flex-1 bg-gray-100 mb-2"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
                      {groupedDisplayItems[category].map((item) => (
                        <div key={item._id} className="h-full">
                          <FoodCard data={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
                    <FaUtensils className="text-gray-300 text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Menu Empty
                  </h3>
                  <p className="text-gray-500">
                    This restaurant hasn't added any items yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Restaurant;
