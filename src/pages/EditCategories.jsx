import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaUtensils,
  FaBolt,
  FaStickyNote,
  FaFolder,
} from "react-icons/fa";

function EditCategories() {
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", order: 0, icon: "" });

  useEffect(() => {
    if (!myShopData) {
      navigate("/");
      return;
    }
    fetchData();
  }, [myShopData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        axios.get(`${serverUrl}/api/category`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/item/get-by-category`, {
          withCredentials: true,
        }),
      ]);

      const sortedCategories = categoriesRes.data.sort(
        (a, b) => a.order - b.order,
      );
      setCategories(sortedCategories);
      setItemsByCategory(itemsRes.data.itemsByCategory || {});
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (categoryName) => {
    const items = itemsByCategory[categoryName] || [];
    return items.length;
  };

  const handleReorder = async (categoryId, direction) => {
    try {
      const categoryIndex = categories.findIndex((c) => c._id === categoryId);
      if (categoryIndex === -1) return;

      const newIndex =
        direction === "up" ? categoryIndex - 1 : categoryIndex + 1;
      if (newIndex < 0 || newIndex >= categories.length) return;

      const updatedCategories = [...categories];
      const [movedCategory] = updatedCategories.splice(categoryIndex, 1);
      updatedCategories.splice(newIndex, 0, movedCategory);

      // Update order values
      const categoryOrders = updatedCategories.map((cat, index) => ({
        categoryId: cat._id,
        order: index,
      }));

      await axios.post(
        `${serverUrl}/api/category/reorder`,
        { categoryOrders },
        { withCredentials: true },
      );

      setCategories(
        updatedCategories.map((cat, index) => ({ ...cat, order: index })),
      );
    } catch (error) {}
  };

  const getIcon = (iconName) => {
    const icons = {
      utensils: FaUtensils,
      bolt: FaBolt,
      note: FaStickyNote,
      folder: FaFolder,
    };
    return icons[iconName] || FaFolder;
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      order: category.order,
      icon: category.icon || "",
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `${serverUrl}/api/category/${editingCategory._id}`,
          formData,
          { withCredentials: true },
        );
      } else {
        await axios.post(`${serverUrl}/api/category`, formData, {
          withCredentials: true,
        });
      }
      setShowAddModal(false);
      setEditingCategory(null);
      setFormData({ name: "", order: 0, icon: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving category");
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await axios.delete(`${serverUrl}/api/category/${categoryId}`, {
        withCredentials: true,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting category");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="#FF6B00" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      {/* Categories List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {categories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-900 font-extrabold">No categories</p>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", order: 0, icon: "" });
                setShowAddModal(true);
              }}
              className="mt-4 px-5 py-3 text-white rounded-2xl font-bold shadow-lg theme-button">
              Add Category
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({ name: "", order: 0, icon: "" });
                  setShowAddModal(true);
                }}
                className="px-5 py-3 text-white rounded-2xl font-bold shadow-lg theme-button">
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map((category, index) => {
                const IconComponent = getIcon(category.icon);
                const itemCount = getItemCount(category.name);

                return (
                  <div
                    key={category._id}
                    className="bg-white rounded-3xl p-5 flex items-center justify-between border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 flex-1">
                      {isEditingOrder && (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleReorder(category._id, "up")}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? "opacity-30" : "hover:bg-gray-100"}`}>
                            <FaArrowUp size={12} className="text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(category._id, "down")}
                            disabled={index === categories.length - 1}
                            className={`p-1 rounded ${index === categories.length - 1 ? "opacity-30" : "hover:bg-gray-100"}`}>
                            <FaArrowDown size={12} className="text-gray-600" />
                          </button>
                        </div>
                      )}
                      <div className="bg-white p-3 rounded-2xl border border-gray-100">
                        <IconComponent className="text-gray-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <span className="font-extrabold text-gray-900 block">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">
                          {itemCount} items
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl border border-gray-100">
                      <FaEdit
                        size={18}
                        style={{ color: "var(--color-primary)" }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Category Button - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
        <button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", order: 0, icon: "" });
            setShowAddModal(true);
          }}
          className="w-full text-white py-3 rounded-2xl font-bold transition-colors shadow-lg theme-button">
          Add Category
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange"
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setFormData({ name: "", order: 0, icon: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl hover:bg-white font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-white rounded-2xl font-bold shadow-lg theme-button">
                  {editingCategory ? "Update" : "Add"}
                </button>
              </div>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingCategory._id)}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 font-bold">
                  Delete Category
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditCategories;
