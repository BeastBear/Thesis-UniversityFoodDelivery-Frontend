import { useState, useEffect, useRef, useCallback } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaPlus, FaTimes, FaStar, FaCamera } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import EmptyState from "../components/ui/EmptyState";

function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { myShopData } = useSelector((state) => state.owner);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Form states
  const [nameEnglish, setNameEnglish] = useState("");
  const [price, setPrice] = useState(0);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedOptionTemplates, setSelectedOptionTemplates] = useState([]);
  const [isRecommended, setIsRecommended] = useState(false);
  const [description, setDescription] = useState("");

  // Data states
  const [categories, setCategories] = useState([]);
  const [optionTemplates, setOptionTemplates] = useState([]);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch categories and option templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, templatesRes] = await Promise.all([
          axios.get(`${serverUrl}/api/category`, { withCredentials: true }),
          axios.get(`${serverUrl}/api/option-template`, {
            withCredentials: true,
          }),
        ]);
        setCategories(categoriesRes.data);
        setOptionTemplates(templatesRes.data);
      } catch (error) {}
    };
    fetchData();
  }, []);

  const fetchItemData = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await axios.get(`${serverUrl}/api/item/get-by-id/${editId}`, {
        withCredentials: true,
      });
      const item = res.data;
      setNameEnglish(item.nameEnglish || "");
      setPrice(item.onlinePrice || item.inStorePrice || item.price || 0);
      setFrontendImage(item.image || null);
      setSelectedCategories(item.categories || [item.categoryRef] || []);
      // Normalize option templates to just their IDs (API returns populated objects)
      setSelectedOptionTemplates(
        (item.selectedOptionTemplates || []).map((tpl) => tpl?._id || tpl),
      );
      setIsRecommended(item.isRecommended || false);
      setDescription(item.descriptionEnglish || item.descriptionThai || "");
    } catch (error) {
      toast.error("Error loading item data");
      navigate(-1);
    } finally {
      setLoadingData(false);
    }
  }, [editId, navigate]);

  // Load item data if editing; reset form when switching back to add mode
  useEffect(() => {
    if (!editId) {
      setNameEnglish("");
      setPrice(0);
      setFrontendImage(null);
      setBackendImage(null);
      setSelectedCategories([]);
      setSelectedOptionTemplates([]);
      setIsRecommended(false);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    fetchItemData();
  }, [editId, fetchItemData]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setBackendImage(null);
    setFrontendImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const toggleOptionTemplate = (templateId) => {
    setSelectedOptionTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    );
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/category`,
        { name: newCategoryName.trim() },
        { withCredentials: true },
      );
      setCategories((prev) => [...prev, res.data]);
      setSelectedCategories((prev) => [...prev, res.data._id]);
      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameEnglish.trim()) {
      toast.error("Please enter menu name");
      return;
    }

    if (!frontendImage && !editId) {
      toast.error("Please upload a menu image");
      return;
    }

    if (price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nameEnglish", nameEnglish.trim());
      formData.append("nameThai", "");
      formData.append("price", price);
      formData.append("category", selectedCategories[0] || ""); // Keep for backward compatibility
      formData.append("categories", JSON.stringify(selectedCategories));
      formData.append(
        "selectedOptionTemplates",
        JSON.stringify(selectedOptionTemplates),
      );
      formData.append("isRecommended", isRecommended);
      formData.append("descriptionThai", "");
      formData.append("descriptionEnglish", description.trim());

      if (backendImage) {
        formData.append("image", backendImage);
      }

      let result;
      if (editId) {
        result = await axios.post(
          `${serverUrl}/api/item/edit-item/${editId}`,
          formData,
          { withCredentials: true },
        );
      } else {
        result = await axios.post(`${serverUrl}/api/item/add-item`, formData, {
          withCredentials: true,
        });
      }

      dispatch(setMyShopData(result.data));
      setLoading(false);
      toast.success(
        editId ? "Menu updated successfully!" : "Menu saved successfully!",
      );
      navigate("/manage-menu");
    } catch (error) {
      setLoading(false);

      toast.error(error.response?.data?.message || "Error saving menu");
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={50} color="#FF6B00" />
      </div>
    );
  }

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
            {editId ? "Edit Menu" : "Add Menu"}
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Food Image */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Image
          </label>
          {frontendImage ? (
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <img
                src={frontendImage}
                alt="Menu"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                <FaTimes size={16} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 bg-opacity-75 text-white rounded-lg flex items-center gap-2 hover:bg-opacity-90">
                <FaCamera size={14} />
                <span>Edit</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-orange transition-colors">
              <div className="text-center">
                <FaCamera size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Tap to upload image</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </Card>

        {/* Menu Name */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Menu Name
          </label>
          <input
            type="text"
            value={nameEnglish}
            onChange={(e) => setNameEnglish(e.target.value)}
            placeholder="Menu Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
          />
        </Card>

        {/* Price */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              ฿
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
            />
          </div>
        </Card>

        {/* Options */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowOptionModal(true)}
              className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <FaPlus size={16} />
              <span>Add Option</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/add-option")}
              className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
              <span className="text-sm">Create New</span>
            </button>
          </div>
          {selectedOptionTemplates.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedOptionTemplates.map((templateId) => {
                const template = optionTemplates.find(
                  (t) => t._id === templateId,
                );
                if (!template) return null;
                return (
                  <div
                    key={templateId}
                    className="p-3 bg-white rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {template.nameEnglish ||
                        template.nameThai ||
                        "Untitled Option"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleOptionTemplate(templateId)}
                      className="text-red-500 hover:text-red-700">
                      <FaTimes size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Categories */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add to Category
          </label>
          {categories.length === 0 ? (
            <div className="py-6">
              <EmptyState
                title="No categories"
                description="Create a category to organize your menu."
              />
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category._id}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category._id)}
                    onChange={() => toggleCategory(category._id)}
                    className="w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange/20"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setNewCategoryName("");
              setShowCategoryModal(true);
            }}
            className="mt-3 w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: "var(--color-primary-bg-light)",
              borderColor: "var(--color-primary-border)",
              color: "var(--color-primary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-primary-bg)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-primary-bg-light)")
            }>
            <FaPlus size={16} />
            <span>Create Category</span>
          </button>
        </Card>

        {/* Toggle Switches */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaStar style={{ color: "var(--color-primary)" }} size={16} />
              <span className="text-sm font-medium text-gray-700">
                Recommended Menu
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(e) => setIsRecommended(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green) peer-focus:ring-4 peer-focus:ring-green-100"
                style={{
                  "--tw-ring-color": "var(--color-primary-shadow-light)",
                }}></div>
            </label>
          </div>
        </Card>

        {/* Menu Description */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter menu description"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange resize-none"
          />
        </Card>

        {/* Bottom Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 md:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={loading} className="flex-1">
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </PrimaryButton>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={loading} className="flex-1">
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </PrimaryButton>
        </div>
      </form>

      {/* Option Selection Modal */}
      {showOptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Options
              </h2>
              <button
                type="button"
                onClick={() => setShowOptionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full">
                <FaTimes size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {optionTemplates.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    title="No options available"
                    description="Create an option template to add it to your menu."
                  />
                  <div className="mt-4">
                    <PrimaryButton
                      type="button"
                      onClick={() => {
                        setShowOptionModal(false);
                        navigate("/add-option");
                      }}>
                      Create Option
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {optionTemplates.map((template) => (
                    <label
                      key={template._id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedOptionTemplates.includes(template._id)}
                        onChange={() => toggleOptionTemplate(template._id)}
                        className="w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange/20"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {template.nameEnglish ||
                          template.nameThai ||
                          "Untitled Option"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <PrimaryButton
                type="button"
                onClick={() => setShowOptionModal(false)}
                className="w-full">
                Done
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed theme-button">
                  {creatingCategory ? (
                    <ClipLoader size={16} color="white" />
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddItem;
