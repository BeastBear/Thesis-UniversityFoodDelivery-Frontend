import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../config";
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

function CategoryManagement({ embedded }) {
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
    <div className={embedded ? "w-full" : "min-h-screen bg-white pb-24"}>
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

        {/* Add Category Section */}
        <div className="mt-6">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">
            Add Category
          </h2>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full bg-white border border-gray-100 rounded-3xl p-5 flex items-center justify-between hover:shadow-md transition-all"
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-border)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-white w-11 h-11 rounded-2xl border border-gray-100 flex items-center justify-center">
                <FaPlus className="text-gray-600" size={20} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                  Add Category
                </h3>
                <p className="text-sm text-gray-500 leading-tight -mt-0.5">
                  Create a new category
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-[340px] shadow-2xl">
            <h2 className="text-[#2d3748] text-xl font-extrabold mb-5">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#4a5568] mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-5 py-3 border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 placeholder-gray-400 font-medium"
                  placeholder="Enter category name"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setFormData({ name: "", order: 0, icon: "" });
                  }}
                  className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1a202c] font-extrabold rounded-[1.25rem] hover:bg-gray-50 focus:outline-none transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-[#10B981] text-white font-extrabold rounded-[1.25rem] hover:bg-[#059669] focus:outline-none transition-colors shadow-lg shadow-[#10B981]/30">
                  {editingCategory ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;
