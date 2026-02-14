import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUtensils,
  FaBolt,
  FaStickyNote,
  FaFolder,
} from "react-icons/fa";
import { IoIosArrowRoundBack } from "react-icons/io";
import { ClipLoader } from "react-spinners";
import PrimaryButton from "../components/ui/PrimaryButton";
import { toast } from "react-toastify";

function CategoryManagement() {
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", order: 0, icon: "" });

  useEffect(() => {
    if (!myShopData) {
      navigate("/");
      return;
    }
    fetchCategories();
  }, [myShopData]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/category`, {
        withCredentials: true,
      });
      setCategories(res.data.sort((a, b) => a.order - b.order));
    } catch (error) {
    } finally {
      setLoading(false);
    }
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
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving category");
    }
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

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await axios.delete(`${serverUrl}/api/category/${categoryId}`, {
        withCredentials: true,
      });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting category");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
          Menu
        </h2>

        {/* Add New Menu */}
        <button
          type="button"
          onClick={() => navigate("/add-item")}
          className="w-full bg-white border border-gray-100 rounded-3xl p-5 flex items-center justify-between hover:shadow-md transition-all"
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-primary-border)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-primary-bg-light)",
                borderColor: "var(--color-primary-border)",
              }}>
              <FaUtensils style={{ color: "var(--color-primary)" }} size={20} />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                Add New Menu
              </h3>
              <p className="text-sm text-gray-500 leading-tight -mt-0.5">
                Create a new item
              </p>
            </div>
          </div>
          <IoIosArrowRoundBack size={20} className="text-gray-300 rotate-180" />
        </button>

        {/* Options Section */}
        <div className="mt-6">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">
            Options
          </h2>
          <button
            type="button"
            onClick={() => navigate("/add-option")}
            className="w-full bg-white border border-gray-100 rounded-3xl p-5 flex items-center justify-between hover:shadow-md transition-all"
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-border)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-white w-11 h-11 rounded-2xl border border-gray-100 flex items-center justify-center">
                <FaStickyNote className="text-gray-600" size={20} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                  Add Options
                </h3>
                <p className="text-sm text-gray-500 leading-tight -mt-0.5">
                  Create option template
                </p>
              </div>
            </div>
            <IoIosArrowRoundBack
              size={20}
              className="text-gray-300 rotate-180"
            />
          </button>
        </div>

        {/* Edit Categories Section */}
        <div className="mt-6">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">
            Edit Categories
          </h2>
          <button
            type="button"
            onClick={() => navigate("/edit-categories")}
            className="w-full bg-white border border-gray-100 rounded-3xl p-5 flex items-center justify-between hover:shadow-md transition-all"
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-border)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-white w-11 h-11 rounded-2xl border border-gray-100 flex items-center justify-center">
                <FaFolder className="text-gray-600" size={20} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                  Edit Categories
                </h3>
                <p className="text-sm text-gray-500 leading-tight -mt-0.5">
                  Reorder & rename
                </p>
              </div>
            </div>
            <IoIosArrowRoundBack
              size={20}
              className="text-gray-300 rotate-180"
            />
          </button>
        </div>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4"
                  style={{
                    "--tw-ring-color": "var(--color-primary-shadow-light)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 4px var(--color-primary-shadow-light)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4"
                  style={{
                    "--tw-ring-color": "var(--color-primary-shadow-light)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 4px var(--color-primary-shadow-light)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4"
                  style={{
                    "--tw-ring-color": "var(--color-primary-shadow-light)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 4px var(--color-primary-shadow-light)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}>
                  <option value="">Select Icon</option>
                  <option value="utensils">Utensils</option>
                  <option value="bolt">Bolt</option>
                  <option value="note">Note</option>
                  <option value="folder">Folder</option>
                </select>
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
                <PrimaryButton type="submit" className="flex-1">
                  {editingCategory ? "Update" : "Add"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;
