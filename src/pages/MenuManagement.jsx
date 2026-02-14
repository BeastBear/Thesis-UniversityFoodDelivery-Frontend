import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import {
  FaSearch,
  FaFire,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";
import { toast } from "react-toastify";

function MenuManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { myShopData } = useSelector((state) => state.owner);
  const [items, setItems] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedOptions, setExpandedOptions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("menu");
  const [optionTemplates, setOptionTemplates] = useState([]);
  const [isEditingOrder, setIsEditingOrder] = useState({});
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!myShopData) {
      navigate("/");
      return;
    }
    fetchData();
  }, [myShopData, location.pathname]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes, optionsRes] = await Promise.all([
        axios.get(`${serverUrl}/api/item/get-by-category`, {
          withCredentials: true,
        }),
        axios.get(`${serverUrl}/api/category`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/option-template`, {
          withCredentials: true,
        }),
      ]);

      setItems(itemsRes.data.items);
      setItemsByCategory(itemsRes.data.itemsByCategory);
      setCategories(categoriesRes.data.sort((a, b) => a.order - b.order));
      setOptionTemplates(optionsRes.data);

      // Expand all categories by default (but not special sections)
      const expanded = {};
      Object.keys(itemsRes.data.itemsByCategory).forEach((cat) => {
        expanded[cat] = true;
      });
      setExpandedCategories(expanded);

      // Expand all options by default
      const expandedOpts = {};
      optionsRes.data.forEach((opt) => {
        expandedOpts[opt._id] = true;
      });
      setExpandedOptions(expandedOpts);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const toggleOption = (optionId) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const toggleEditOrder = (categoryName) => {
    setIsEditingOrder((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleReorderItem = async (
    categoryName,
    itemId,
    direction,
    categoryItems,
  ) => {
    const itemIndex = categoryItems.findIndex((item) => item._id === itemId);
    if (itemIndex === -1) return;

    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= categoryItems.length) return;

    // Reorder locally
    const updatedItems = [...categoryItems];
    const [movedItem] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(newIndex, 0, movedItem);

    // Update state
    if (categoryName === "recommended" || categoryName === "topPicks") {
      // For special sections, update items array
      setItems((prev) => {
        const itemMap = new Map(prev.map((item) => [item._id, item]));
        updatedItems.forEach((item) => itemMap.set(item._id, item));
        return Array.from(itemMap.values());
      });
    } else {
      setItemsByCategory((prev) => ({
        ...prev,
        [categoryName]: updatedItems,
      }));
    }

    // TODO: Save order to backend if needed
  };

  const renderMenuItem = (item, categoryName, index, categoryItems = []) => {
    const itemName = item.nameThai || item.nameEnglish || item.name || "";
    const description = item.descriptionThai || item.descriptionEnglish || "";
    const onlinePrice = item.onlinePrice || item.price || 0;
    const inStorePrice = item.inStorePrice || item.price || 0;
    const hasDifferentPrices =
      item.onlinePrice &&
      item.inStorePrice &&
      item.onlinePrice !== item.inStorePrice;
    const isAvailable = item.isAvailable !== false;
    const editingOrder = isEditingOrder[categoryName];

    return (
      <div
        key={item._id}
        className="p-4 cursor-pointer hover:bg-white transition-colors"
        onClick={(e) => {
          // Don't navigate if clicking on toggle or its container
          if (
            e.target.closest(".toggle-container") ||
            e.target.closest("label") ||
            e.target.closest('input[type="checkbox"]')
          ) {
            return;
          }
          if (!editingOrder) {
            navigate(`/add-item?edit=${item._id}`);
          }
        }}>
        <div className="flex items-start gap-4">
          {/* Item Image */}
          <img
            src={item.image}
            alt={itemName}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{itemName}</h3>

            {/* Price */}
            <div className="mb-2">
              {hasDifferentPrices ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-900 font-medium">
                    ฿{onlinePrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    (In-store ฿{inStorePrice.toFixed(2)})
                  </span>
                </div>
              ) : (
                <span className="text-gray-900 font-medium">
                  ฿{onlinePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Optional Description (kept empty if not provided) */}
            {description ? (
              <p className="text-xs text-gray-500 line-clamp-2">
                {description}
              </p>
            ) : null}
          </div>

          {/* Right-side Actions: Reorder buttons (when editing) + Availability toggle */}
          <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
            {editingOrder && categoryItems.length > 0 ? (
              <div className="flex flex-col gap-1 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorderItem(
                      categoryName,
                      item._id,
                      "up",
                      categoryItems,
                    );
                  }}
                  disabled={index === 0}
                  className={`p-1 rounded ${index === 0 ? "opacity-30" : "hover:bg-gray-100"}`}>
                  <FaArrowUp size={12} className="text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorderItem(
                      categoryName,
                      item._id,
                      "down",
                      categoryItems,
                    );
                  }}
                  disabled={index === categoryItems.length - 1}
                  className={`p-1 rounded ${index === categoryItems.length - 1 ? "opacity-30" : "hover:bg-gray-100"}`}>
                  <FaArrowDown size={12} className="text-gray-600" />
                </button>
              </div>
            ) : (
              <div />
            )}

            <div
              className="toggle-container flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}>
              <span
                className={`text-xs font-semibold ${isAvailable ? "text-gray-600" : "text-gray-400"}`}>
                {isAvailable
                  ? "Available"
                  : item.unavailabilityReason === "outOfStockToday"
                    ? "Out of Stock Today"
                    : "Unavailable"}
              </span>
              <label
                className="relative inline-flex items-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAvailable) {
                    toggleItemAvailability(item._id, true, null);
                  } else {
                    setSelectedItem(item);
                    setShowUnavailableModal(true);
                  }
                }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isAvailable) {
                      toggleItemAvailability(item._id, true, null);
                    } else {
                      setSelectedItem(item);
                      setShowUnavailableModal(true);
                    }
                  }}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green) peer-focus:ring-4 peer-focus:ring-green-100"
                  style={{
                    "--tw-ring-color": "var(--color-primary-shadow-light)",
                  }}></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const toggleChoiceAvailability = async (
    templateId,
    choiceName,
    currentStatus,
  ) => {
    try {
      const template = optionTemplates.find((t) => t._id === templateId);
      if (!template) return;

      const updatedChoices = template.choices.map((choice) =>
        choice.name === choiceName
          ? { ...choice, isAvailable: !currentStatus }
          : choice,
      );

      await axios.put(
        `${serverUrl}/api/option-template/${templateId}`,
        {
          nameThai: template.nameThai,
          nameEnglish: template.nameEnglish,
          isRequired: template.isRequired,
          isMultiple: template.isMultiple,
          choices: updatedChoices,
        },
        { withCredentials: true },
      );

      setOptionTemplates((prev) =>
        prev.map((t) =>
          t._id === templateId ? { ...t, choices: updatedChoices } : t,
        ),
      );
    } catch (error) {}
  };

  const toggleItemAvailability = async (
    itemId,
    isAvailable,
    unavailabilityReason,
  ) => {
    try {
      const res = await axios.put(
        `${serverUrl}/api/item/toggle-availability/${itemId}`,
        { isAvailable, unavailabilityReason },
        { withCredentials: true },
      );

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? {
                ...item,
                isAvailable: res.data.isAvailable,
                unavailabilityReason: res.data.unavailabilityReason,
                outOfStockDate: res.data.outOfStockDate,
              }
            : item,
        ),
      );

      // Update itemsByCategory
      const updatedItemsByCategory = { ...itemsByCategory };
      Object.keys(updatedItemsByCategory).forEach((cat) => {
        updatedItemsByCategory[cat] = updatedItemsByCategory[cat].map((item) =>
          item._id === itemId
            ? {
                ...item,
                isAvailable: res.data.isAvailable,
                unavailabilityReason: res.data.unavailabilityReason,
                outOfStockDate: res.data.outOfStockDate,
              }
            : item,
        );
      });
      setItemsByCategory(updatedItemsByCategory);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update item availability",
      );
    }
  };

  const handleUnavailableReason = (reason) => {
    if (selectedItem) {
      toggleItemAvailability(selectedItem._id, false, reason);
      setShowUnavailableModal(false);
      setSelectedItem(null);
    }
  };

  // Filter items for search
  const filterItemsBySearch = (itemList) => {
    if (!searchQuery) return itemList;
    return itemList.filter((item) =>
      (item.nameThai || item.nameEnglish || item.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery) return true;
    const categoryItems = itemsByCategory[cat.name] || [];
    return (
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryItems.some((item) =>
        (item.nameThai || item.nameEnglish || item.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    );
  });

  const filteredItemsByCategory = {};
  filteredCategories.forEach((cat) => {
    const categoryItems = itemsByCategory[cat.name] || [];
    if (searchQuery) {
      filteredItemsByCategory[cat.name] = categoryItems.filter((item) =>
        (item.nameThai || item.nameEnglish || item.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
    } else {
      filteredItemsByCategory[cat.name] = categoryItems;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="md:hidden">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex px-4 gap-2 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className={`flex-1 py-3 text-center font-bold rounded-2xl transition-all ${
                activeTab === "menu"
                  ? "text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={
                activeTab === "menu"
                  ? {
                      backgroundColor: "var(--color-primary)",
                      boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                    }
                  : {}
              }>
              Food Menu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("options")}
              className={`flex-1 py-3 text-center font-bold rounded-2xl transition-all ${
                activeTab === "options"
                  ? "text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={
                activeTab === "options"
                  ? {
                      backgroundColor: "var(--color-primary)",
                      boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                    }
                  : {}
              }>
              Options
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
              {searchQuery?.trim()?.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1 w-full max-w-[420px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className={`flex-1 py-2.5 text-center font-bold rounded-xl transition-all ${
                    activeTab === "menu"
                      ? "text-white shadow-lg"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    activeTab === "menu"
                      ? {
                          backgroundColor: "var(--color-primary)",
                          boxShadow:
                            "0 10px 25px -5px var(--color-primary-shadow)",
                        }
                      : {}
                  }>
                  Food Menu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("options")}
                  className={`flex-1 py-2.5 text-center font-bold rounded-xl transition-all ${
                    activeTab === "options"
                      ? "text-white shadow-lg"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    activeTab === "options"
                      ? {
                          backgroundColor: "var(--color-primary)",
                          boxShadow:
                            "0 10px 25px -5px var(--color-primary-shadow)",
                        }
                      : {}
                  }>
                  Options
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/manage-categories")}
                className="h-10 px-5 bg-white rounded-full text-sm font-bold text-gray-800 hover:bg-white border border-gray-200 shadow-sm transition-colors whitespace-nowrap">
                Manage categories
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="relative">
                <FaSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
                {searchQuery?.trim()?.length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {activeTab === "menu" ? (
          <div className="space-y-3">
            {/* Get recommended and top picks items */}
            {(() => {
              const recommendedItems = items.filter(
                (item) =>
                  item.isAvailable !== false && item.isRecommended === true,
              );
              const topPicksItems = items
                .filter((item) => item.isAvailable !== false)
                .sort((a, b) => {
                  const aCount = a.rating?.count || 0;
                  const bCount = b.rating?.count || 0;
                  if (bCount !== aCount) return bCount - aCount;
                  return (b.rating?.average || 0) - (a.rating?.average || 0);
                })
                .slice(0, 10);

              const filteredRecommendedItems =
                filterItemsBySearch(recommendedItems);
              const filteredTopPicksItems = filterItemsBySearch(topPicksItems);

              return (
                <>
                  {/* Recommended Section */}
                  <Card className="overflow-hidden">
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer"
                      onClick={() => toggleCategory("recommended")}>
                      <div className="flex items-center gap-2">
                        <FaStar
                          style={{ color: "var(--color-primary)" }}
                          size={18}
                        />
                        <span className="text-lg font-semibold text-gray-900">
                          Recommended
                        </span>
                      </div>
                      {expandedCategories["recommended"] ? (
                        <IoIosArrowUp size={20} className="text-gray-500" />
                      ) : (
                        <IoIosArrowDown size={20} className="text-gray-500" />
                      )}
                    </div>
                    {expandedCategories["recommended"] && (
                      <div className="border-t border-gray-100">
                        {filteredRecommendedItems.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {filteredRecommendedItems.map((item, index) =>
                              renderMenuItem(
                                item,
                                "recommended",
                                index,
                                filteredRecommendedItems,
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="p-6">
                            <EmptyState
                              title="No items available"
                              description="Mark items as recommended to show them here."
                              className="pt-0"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </>
              );
            })()}

            {/* Regular Categories */}
            {filteredCategories.length === 0 ? (
              <Card className="py-12">
                <EmptyState
                  title="No categories"
                  description="Create a category to start organizing your menu."
                  className="pt-0"
                />
                <div className="mt-4 flex justify-center">
                  <PrimaryButton
                    type="button"
                    onClick={() => navigate("/manage-categories")}
                    className="px-4 py-2 rounded-lg shadow-none hover:-translate-y-0 active:translate-y-0">
                    Add Category
                  </PrimaryButton>
                </div>
              </Card>
            ) : (
              filteredCategories.map((category) => {
                const categoryItems =
                  filteredItemsByCategory[category.name] || [];
                const isExpanded = expandedCategories[category.name];
                const editingOrder = isEditingOrder[category.name];

                return (
                  <Card key={category._id} className="overflow-hidden">
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer"
                      onClick={() => toggleCategory(category.name)}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </span>
                      </div>
                      {isExpanded ? (
                        <IoIosArrowUp size={20} className="text-gray-500" />
                      ) : (
                        <IoIosArrowDown size={20} className="text-gray-500" />
                      )}
                    </div>

                    {/* Category Items */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {categoryItems.length === 0 ? (
                          <div className="p-6">
                            <EmptyState
                              title="No items in this category"
                              description="Add items to start selling."
                              className="pt-0"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                              <div className="text-xs font-bold text-gray-500">
                                {categoryItems.length} items
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/add-item?category=${category._id}`,
                                  );
                                }}
                                className="text-sm font-medium flex items-center gap-1 hover:text-gray-900 transition-colors"
                                style={{ color: "var(--color-primary)" }}>
                                <FaPlus size={10} />
                                <span>Add Item</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEditOrder(category.name);
                                }}
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: "var(--color-primary)" }}>
                                <span className="flex items-center">
                                  <FaArrowUp size={10} />
                                  <FaArrowDown size={10} className="-mt-1" />
                                </span>
                                <span>Edit Order</span>
                              </button>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {categoryItems.map((item, index) =>
                                renderMenuItem(
                                  item,
                                  category.name,
                                  index,
                                  categoryItems,
                                ),
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {optionTemplates.length === 0 ? (
              <Card className="py-12">
                <EmptyState
                  title="No options created yet"
                  description="Create option templates for add-ons and modifiers."
                  className="pt-0"
                />
                <div className="mt-4 flex justify-center">
                  <PrimaryButton
                    type="button"
                    onClick={() => navigate("/add-option")}
                    className="px-4 py-2 rounded-lg shadow-none hover:-translate-y-0 active:translate-y-0">
                    Create Option
                  </PrimaryButton>
                </div>
              </Card>
            ) : (
              optionTemplates.map((template) => {
                const isExpanded = expandedOptions[template._id];
                const sortedChoices = [...(template.choices || [])].sort(
                  (a, b) => a.order - b.order,
                );

                return (
                  <Card key={template._id} className="overflow-hidden">
                    {/* Option Header */}
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer"
                      onClick={() => toggleOption(template._id)}>
                      <h3 className="font-semibold text-gray-900">
                        {template.nameThai
                          ? template.nameEnglish
                            ? `${template.nameThai} (${template.nameEnglish})`
                            : template.nameThai
                          : template.nameEnglish || "Untitled Option"}
                      </h3>
                      {isExpanded ? (
                        <IoIosArrowUp size={20} className="text-gray-500" />
                      ) : (
                        <IoIosArrowDown size={20} className="text-gray-500" />
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {/* Menu in use and Edit buttons */}
                        <div className="px-5 py-3 flex items-center gap-4 border-b border-gray-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/manage-option-items?template=${template._id}`,
                              );
                            }}
                            className="text-sm font-medium"
                            style={{ color: "var(--color-primary)" }}>
                            Menu in use
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/add-option?edit=${template._id}`);
                            }}
                            className="text-sm font-medium"
                            style={{ color: "var(--color-primary)" }}>
                            Edit
                          </button>
                        </div>

                        {/* Choices List */}
                        <div className="p-5 space-y-3">
                          {sortedChoices.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                              No choices
                            </p>
                          ) : (
                            sortedChoices.map((choice, idx) => {
                              const isAvailable = choice.isAvailable !== false;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="text-gray-900 font-medium">
                                      {choice.name}
                                    </span>
                                    {choice.priceType === "increase" && (
                                      <span className="text-sm text-green-600">
                                        +฿{choice.price.toFixed(2)}
                                      </span>
                                    )}
                                    {choice.priceType === "decrease" && (
                                      <span className="text-sm text-red-600">
                                        -฿{choice.price.toFixed(2)}
                                      </span>
                                    )}
                                    {choice.priceType === "noChange" && (
                                      <span className="text-sm text-gray-600">
                                        ฿0.00
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`text-sm ${isAvailable ? "text-gray-500" : "text-gray-400"}`}>
                                      {isAvailable
                                        ? "Available"
                                        : "Not Available"}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isAvailable}
                                        onChange={() =>
                                          toggleChoiceAvailability(
                                            template._id,
                                            choice.name,
                                            isAvailable,
                                          )
                                        }
                                        className="sr-only peer"
                                      />
                                      <div
                                        className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green) peer-focus:ring-4 peer-focus:ring-green-100"
                                        style={{
                                          "--tw-ring-color":
                                            "var(--color-primary-shadow-light)",
                                        }}></div>
                                    </label>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Unavailable Reason Modal */}
      {showUnavailableModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowUnavailableModal(false);
            setSelectedItem(null);
          }}>
          <Card
            className="max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Reason for Unavailability
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select why this menu item is unavailable:
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleUnavailableReason("outOfStockToday")}
                className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:border-primary-orange hover:bg-orange-50 transition-colors">
                <div className="font-medium text-gray-900 mb-1">
                  Out of Stock Today
                </div>
                <div className="text-sm text-gray-600">
                  Will automatically change to "Available" tomorrow
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUnavailableReason("temporarilyUnavailable")
                }
                className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:border-primary-orange hover:bg-orange-50 transition-colors">
                <div className="font-medium text-gray-900 mb-1">
                  Temporarily Unavailable
                </div>
                <div className="text-sm text-gray-600">
                  Menu will not be shown until manually fixed
                </div>
              </button>
            </div>
            <div className="mt-4">
              <PrimaryButton
                type="button"
                onClick={() => {
                  setShowUnavailableModal(false);
                  setSelectedItem(null);
                }}
                className="w-full">
                Cancel
              </PrimaryButton>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
