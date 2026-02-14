import { useState, useEffect } from "react";
import {
  IoIosArrowRoundBack,
  IoIosArrowUp,
  IoIosArrowDown,
} from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import EmptyState from "../components/ui/EmptyState";

function ManageOptionItems() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const { myShopData } = useSelector((state) => state.owner);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [optionTemplate, setOptionTemplate] = useState(null);
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (!templateId) {
      navigate(-1);
      return;
    }
    fetchData();
  }, [templateId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [templateRes, itemsRes, categoriesRes] = await Promise.all([
        axios.get(`${serverUrl}/api/option-template/${templateId}`, {
          withCredentials: true,
        }),
        axios.get(`${serverUrl}/api/item/get-by-category`, {
          withCredentials: true,
        }),
        axios.get(`${serverUrl}/api/category`, { withCredentials: true }),
      ]);

      const template = templateRes.data;
      setOptionTemplate(template);

      // Get items that currently use this option template
      const itemsUsingTemplate = itemsRes.data.items.filter((item) => {
        if (
          !item.selectedOptionTemplates ||
          !Array.isArray(item.selectedOptionTemplates)
        )
          return false;
        return item.selectedOptionTemplates.some(
          (id) =>
            id.toString() === templateId ||
            (typeof id === "object" &&
              id._id &&
              id._id.toString() === templateId),
        );
      });
      setSelectedItems(itemsUsingTemplate.map((item) => item._id));

      // Group items by category
      const sortedCategories = categoriesRes.data.sort(
        (a, b) => a.order - b.order,
      );
      setCategories(sortedCategories);

      const grouped = {};
      sortedCategories.forEach((cat) => {
        const categoryItems = (
          itemsRes.data.itemsByCategory[cat.name] || []
        ).filter((item) => item.isAvailable !== false);
        if (categoryItems.length > 0) {
          grouped[cat.name] = categoryItems;
        }
      });
      setItemsByCategory(grouped);

      // Expand all categories by default
      const expanded = {};
      Object.keys(grouped).forEach((cat) => {
        expanded[cat] = true;
      });
      setExpandedCategories(expanded);
    } catch (error) {
      toast.error("Error loading data");
      navigate(-1);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleCategorySelectAll = (categoryName) => {
    const categoryItems = itemsByCategory[categoryName] || [];
    const allSelected = categoryItems.every((item) =>
      selectedItems.includes(item._id),
    );

    if (allSelected) {
      // Deselect all items in this category
      setSelectedItems((prev) =>
        prev.filter((id) => !categoryItems.some((item) => item._id === id)),
      );
    } else {
      // Select all items in this category
      const categoryItemIds = categoryItems.map((item) => item._id);
      setSelectedItems((prev) => {
        const newSelected = [...prev];
        categoryItemIds.forEach((id) => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Get all items from all categories
      const allItems = Object.values(itemsByCategory).flat();

      // Also get all items that might not be in any category but should be updated
      const itemsRes = await axios.get(
        `${serverUrl}/api/item/get-by-category`,
        { withCredentials: true },
      );
      const allShopItems = itemsRes.data.items || [];

      // Create a map of items we care about
      const itemsToUpdate = new Map();
      allItems.forEach((item) => {
        itemsToUpdate.set(item._id, item);
      });

      // Update items
      for (const item of allShopItems) {
        const shouldHaveTemplate = selectedItems.includes(item._id);
        const currentTemplates = item.selectedOptionTemplates || [];
        const currentlyHasTemplate = currentTemplates.some(
          (id) => id.toString() === templateId,
        );

        if (shouldHaveTemplate !== currentlyHasTemplate) {
          let updatedTemplates = [...currentTemplates];

          if (shouldHaveTemplate) {
            // Add template if not already present
            if (!updatedTemplates.some((id) => id.toString() === templateId)) {
              updatedTemplates.push(templateId);
            }
          } else {
            // Remove template
            updatedTemplates = updatedTemplates.filter(
              (id) => id.toString() !== templateId,
            );
          }

          const formData = new FormData();
          formData.append(
            "selectedOptionTemplates",
            JSON.stringify(updatedTemplates),
          );

          await axios.post(
            `${serverUrl}/api/item/edit-item/${item._id}`,
            formData,
            { withCredentials: true },
          );
        }
      }

      setLoading(false);
      toast.success("Menu items updated successfully!");
      navigate(-1);
    } catch (error) {
      setLoading(false);

      toast.error(error.response?.data?.message || "Error updating menu items");
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="#FF6B00" />
      </div>
    );
  }

  const optionName =
    optionTemplate?.nameEnglish || optionTemplate?.nameThai || "Option";

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full">
            <IoIosArrowRoundBack size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">
            Menu using options: {optionName}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {categories.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No categories available"
              description="Create categories first, then you can assign this option to menu items."
            />
          </Card>
        ) : (
          categories
            .filter(
              (cat) =>
                itemsByCategory[cat.name] &&
                itemsByCategory[cat.name].length > 0,
            )
            .map((category) => {
              const categoryItems = itemsByCategory[category.name] || [];
              const selectedCount = categoryItems.filter((item) =>
                selectedItems.includes(item._id),
              ).length;
              const totalCount = categoryItems.length;
              const isExpanded = expandedCategories[category.name];
              const allSelected =
                categoryItems.length > 0 &&
                categoryItems.every((item) => selectedItems.includes(item._id));

              return (
                <Card key={category._id} className="p-0">
                  {/* Category Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({selectedCount}/{totalCount} Menu)
                        </span>
                      </div>
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="p-1 hover:bg-gray-100 rounded">
                        {isExpanded ? (
                          <IoIosArrowUp size={20} className="text-gray-500" />
                        ) : (
                          <IoIosArrowDown size={20} className="text-gray-500" />
                        )}
                      </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleCategorySelectAll(category.name)}
                        className="w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange/20"
                      />
                      <span className="text-sm text-gray-700">Select All</span>
                    </label>
                  </div>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {categoryItems.map((item) => {
                        const isSelected = selectedItems.includes(item._id);
                        return (
                          <div
                            key={item._id}
                            className="flex items-center justify-between p-4 hover:bg-white">
                            <label className="flex items-center gap-3 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItem(item._id)}
                                className={`w-5 h-5 border-2 rounded focus:ring-primary-orange/20 ${
                                  isSelected
                                    ? "bg-primary-orange border-primary-orange text-white"
                                    : "border-gray-300"
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-900 flex-1">
                                {item.nameThai || item.nameEnglish || item.name}
                              </span>
                            </label>
                            <span className="text-sm text-gray-600">
                              ฿{item.price?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <PrimaryButton
          onClick={handleSave}
          disabled={loading}
          className="w-full">
          {loading ? <ClipLoader size={20} color="white" /> : "Save"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default ManageOptionItems;
