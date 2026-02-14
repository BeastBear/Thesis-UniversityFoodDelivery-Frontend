import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import {
  FaPlus,
  FaEdit,
  FaArrowUp,
  FaArrowDown,
  FaTimes,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import EmptyState from "../components/ui/EmptyState";

function AddOption() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [nameEnglish, setNameEnglish] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);
  const [options, setOptions] = useState([]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [newChoice, setNewChoice] = useState({
    name: "",
    priceType: "noChange",
    price: 0,
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load option data if editing
  useEffect(() => {
    if (editId) {
      fetchOptionData();
    }
  }, [editId]);

  const fetchOptionData = async () => {
    try {
      setLoadingData(true);
      const res = await axios.get(
        `${serverUrl}/api/option-template/${editId}`,
        { withCredentials: true },
      );
      const template = res.data;
      setNameEnglish(template.nameEnglish || template.nameThai || "");
      setIsRequired(template.isRequired || false);
      setIsMultiple(template.isMultiple || false);
      setOptions(template.choices || []);
    } catch (error) {
      toast.error("Error loading option data");
      navigate(-1);
    } finally {
      setLoadingData(false);
    }
  };

  const addOption = () => {
    setNewChoice({ name: "", priceType: "noChange", price: 0 });
    setShowAddChoiceModal(true);
  };

  const handleSaveChoice = () => {
    if (!newChoice.name.trim()) {
      toast.error("Please enter option name");
      return;
    }

    const priceValue = newChoice.priceType === "noChange" ? 0 : newChoice.price;
    setOptions([
      ...options,
      {
        name: newChoice.name,
        price: priceValue,
        priceType: newChoice.priceType,
      },
    ]);
    setShowAddChoiceModal(false);
    setNewChoice({ name: "", priceType: "noChange", price: 0 });
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = field === "price" ? parseFloat(value) || 0 : value;
    setOptions(updated);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleReorder = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= options.length) return;

    const updated = [...options];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setOptions(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...options];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setOptions(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameEnglish.trim()) {
      toast.error("Please enter option name");
      return;
    }

    if (options.length === 0) {
      toast.error("Please add at least one option");
      return;
    }

    // Validate all options have names
    const invalidOptions = options.filter((opt) => !opt.name.trim());
    if (invalidOptions.length > 0) {
      toast.error("All options must have a name");
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        // Update existing option
        await axios.put(
          `${serverUrl}/api/option-template/${editId}`,
          {
            nameThai: "",
            nameEnglish,
            isRequired,
            isMultiple,
            choices: options,
          },
          { withCredentials: true },
        );
      } else {
        // Create new option
        await axios.post(
          `${serverUrl}/api/option-template`,
          {
            nameThai: "",
            nameEnglish,
            isRequired,
            isMultiple,
            choices: options,
          },
          { withCredentials: true },
        );
      }

      setLoading(false);
      toast.success(
        editId ? "Option updated successfully!" : "Option saved successfully!",
      );
      navigate(-1);
    } catch (error) {
      setLoading(false);

      toast.error(error.response?.data?.message || "Error saving option");
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
            {editId ? "Edit Option" : "Create New Option"}
          </h1>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto p-4 lg:p-8 space-y-4">
        {/* Option Name */}
        <Card className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Option Name
            </label>
            <input
              type="text"
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
              placeholder="Enter option name"
            />
          </div>
        </Card>

        {/* Checkboxes */}
        <Card className="p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange/20"
            />
            <span className="text-gray-700">Customer must select</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiple}
              onChange={(e) => setIsMultiple(e.target.checked)}
              className="w-5 h-5 text-primary-orange border-gray-300 rounded focus:ring-primary-orange/20"
            />
            <span className="text-gray-700">
              Customer can select more than 1 option
            </span>
          </label>
        </Card>

        {/* Options Section */}
        <Card className="p-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Options</h2>
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingOrder(!isEditingOrder)}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs">
                <FaEdit size={14} className="text-red-600" />
                <span>{isEditingOrder ? "Done" : "Edit Order"}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="py-6 flex flex-col items-center">
                <EmptyState
                  className="pt-0"
                  title="No options added"
                  description="Add a first choice for this option template."
                />
                <div className="mt-6 w-full flex justify-center">
                  <PrimaryButton
                    type="button"
                    onClick={addOption}
                    className="w-full max-w-xs px-8">
                    Add First Option
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={index}
                  draggable={isEditingOrder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white border border-gray-300 rounded-lg p-4 flex items-center gap-3 transition-all ${
                    isEditingOrder ? "cursor-move" : ""
                  } ${draggedIndex === index ? "opacity-50" : ""} ${
                    dragOverIndex === index
                      ? "border-primary-orange border-2 bg-orange-50"
                      : ""
                  }`}>
                  {isEditingOrder && (
                    <div className="flex items-center justify-center w-6 h-6 text-gray-400">
                      <div className="flex flex-col gap-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                      <div className="flex flex-col gap-0.5 ml-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) =>
                      updateOption(index, "name", e.target.value)
                    }
                    placeholder="Option name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
                    required
                    disabled={isEditingOrder}
                  />
                  {option.priceType === "increase" && (
                    <span className="text-sm text-green-600 font-medium">
                      +฿{option.price.toFixed(2)}
                    </span>
                  )}
                  {option.priceType === "decrease" && (
                    <span className="text-sm text-red-600 font-medium">
                      -฿{option.price.toFixed(2)}
                    </span>
                  )}
                  {option.priceType === "noChange" && (
                    <span className="text-sm text-gray-600 font-medium">
                      ฿0.00
                    </span>
                  )}
                  {!isEditingOrder && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <FaTimes size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {options.length > 0 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 w-full px-4 py-2 bg-orange-100 text-primary-orange rounded-lg font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-2">
              <FaPlus size={16} />
              <span>Add Option</span>
            </button>
          )}
        </Card>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </PrimaryButton>
        </div>

        {/* Desktop Save Button */}
        <div className="hidden md:block mt-6">
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </PrimaryButton>
        </div>
      </form>

      {/* Add Choice Modal */}
      {showAddChoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Option
              </h2>

              <div className="space-y-4">
                {/* Option Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Option Name
                  </label>
                  <input
                    type="text"
                    value={newChoice.name}
                    onChange={(e) =>
                      setNewChoice({ ...newChoice, name: e.target.value })
                    }
                    placeholder="Enter option name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
                    autoFocus
                  />
                </div>

                {/* Price Impact Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How does selecting this option affect the menu price?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg">
                      <input
                        type="radio"
                        name="priceType"
                        value="noChange"
                        checked={newChoice.priceType === "noChange"}
                        onChange={(e) =>
                          setNewChoice({
                            ...newChoice,
                            priceType: e.target.value,
                            price: 0,
                          })
                        }
                        className="w-5 h-5 text-primary-orange border-gray-300 focus:ring-primary-orange/20"
                      />
                      <span className="text-gray-700">No Change</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg">
                      <input
                        type="radio"
                        name="priceType"
                        value="increase"
                        checked={newChoice.priceType === "increase"}
                        onChange={(e) =>
                          setNewChoice({
                            ...newChoice,
                            priceType: e.target.value,
                          })
                        }
                        className="w-5 h-5 text-primary-orange border-gray-300 focus:ring-primary-orange/20"
                      />
                      <span className="text-gray-700">Price Increase</span>
                    </label>
                    {newChoice.priceType === "increase" && (
                      <div className="ml-8">
                        <input
                          type="number"
                          value={newChoice.price}
                          onChange={(e) =>
                            setNewChoice({
                              ...newChoice,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg">
                      <input
                        type="radio"
                        name="priceType"
                        value="decrease"
                        checked={newChoice.priceType === "decrease"}
                        onChange={(e) =>
                          setNewChoice({
                            ...newChoice,
                            priceType: e.target.value,
                          })
                        }
                        className="w-5 h-5 text-primary-orange border-gray-300 focus:ring-primary-orange/20"
                      />
                      <span className="text-gray-700">Price Decrease</span>
                    </label>
                    {newChoice.priceType === "decrease" && (
                      <div className="ml-8">
                        <input
                          type="number"
                          value={newChoice.price}
                          onChange={(e) =>
                            setNewChoice({
                              ...newChoice,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChoiceModal(false);
                    setNewChoice({ name: "", priceType: "noChange", price: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <PrimaryButton
                  type="button"
                  onClick={handleSaveChoice}
                  className="flex-1">
                  Save
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddOption;
