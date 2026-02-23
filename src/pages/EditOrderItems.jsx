import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdPhone, MdEdit } from "react-icons/md";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";

function EditOrderItems() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditOptionsModal, setShowEditOptionsModal] = useState(null); // item index
  const [editingItemOptions, setEditingItemOptions] = useState(null);
  const [optionTemplates, setOptionTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/order/get-order-by-id/${orderId}`,
          { withCredentials: true },
        );
        setOrder(response.data);
        // Initialize edited items with current order items
        if (response.data?.shopOrders?.[0]?.shopOrderItems) {
          setEditedItems(
            response.data.shopOrders[0].shopOrderItems.map((item) => ({
              ...item,
              _id: item._id || item.item?._id || Math.random().toString(),
            })),
          );
        }

        // Fetch shop items for adding new items
        const shopOrder = response.data?.shopOrders?.[0];
        if (shopOrder?.shop?._id || shopOrder?.shop) {
          const shopId = shopOrder.shop?._id || shopOrder.shop;
          try {
            const itemsRes = await axios.get(
              `${serverUrl}/api/item/get-by-shop/${shopId}`,
              { withCredentials: true },
            );
            setShopItems(itemsRes.data.items || []);
          } catch (error) {}
        }
      } catch (error) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 0) return;
    const updated = [...editedItems];
    updated[index].quantity = newQuantity;
    setEditedItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = editedItems.filter((_, i) => i !== index);
    setEditedItems(updated);
  };

  const handleEditOptions = async (itemIndex) => {
    const item = editedItems[itemIndex];
    if (!item.item?._id && !item.item) return;

    try {
      // Fetch the item to get its option templates
      const itemRes = await axios.get(
        `${serverUrl}/api/item/get-by-id/${item.item?._id || item.item}`,
        { withCredentials: true },
      );

      const itemData = itemRes.data;
      const optionTemplateIds = itemData.selectedOptionTemplates || [];

      if (optionTemplateIds.length > 0) {
        // Fetch all option templates
        const templatePromises = optionTemplateIds.map((templateId) =>
          axios
            .get(`${serverUrl}/api/option-template/${templateId}`, {
              withCredentials: true,
            })
            .then((res) => res.data)
            .catch(() => null),
        );

        const templates = await Promise.all(templatePromises);
        setOptionTemplates(templates.filter((t) => t !== null));
      }

      setEditingItemOptions(itemIndex);
      setShowEditOptionsModal(itemIndex);
    } catch (error) {
      setError("Failed to load item options");
    }
  };

  const handleOptionChange = (templateId, choiceName, checked) => {
    const updated = [...editedItems];
    const item = updated[editingItemOptions];

    if (!item.selectedOptions) {
      item.selectedOptions = {};
    }
    if (!item.selectedOptions[templateId]) {
      item.selectedOptions[templateId] = {};
    }

    item.selectedOptions[templateId][choiceName] = checked;
    setEditedItems(updated);
  };

  const handleSaveOptions = () => {
    setShowEditOptionsModal(null);
    setEditingItemOptions(null);
    setOptionTemplates([]);
  };

  const handleAddNewItem = (item) => {
    // Check if item already exists in the order (by item ID)
    const existingItemIndex = editedItems.findIndex(
      (editedItem) =>
        (editedItem.item?._id || editedItem.item) === item._id ||
        editedItem.item?.toString() === item._id.toString(),
    );

    if (existingItemIndex !== -1) {
      // Item already exists, increase quantity instead
      const updated = [...editedItems];
      updated[existingItemIndex].quantity += 1;
      setEditedItems(updated);
    } else {
      // Item doesn't exist, add new item
      const newItem = {
        _id: Math.random().toString(),
        item: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        selectedOptions: {},
        specialInstructions: "",
      };
      setEditedItems([...editedItems, newItem]);
    }

    setShowAddItemModal(false);
    setSearchQuery("");
  };

  const handleSaveChanges = async () => {
    if (editedItems.length === 0) {
      setError("Order must have at least one item");
      return;
    }

    // Check if all items have quantity > 0
    const validItems = editedItems.filter((item) => item.quantity > 0);
    if (validItems.length === 0) {
      setError(
        "Order must have at least one item with quantity greater than 0",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const shopOrder = order.shopOrders[0];
      const shopId = shopOrder.shop?._id || shopOrder.shop;

      // Calculate new subtotal
      const newSubtotal = validItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Update order items
      await axios.post(
        `${serverUrl}/api/order/update-order-items/${order._id}/${shopId}`,
        {
          shopOrderItems: validItems.map((item) => ({
            item: item.item?._id || item.item,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions || {},
            specialInstructions: item.specialInstructions || "",
          })),
          subtotal: newSubtotal,
        },
        { withCredentials: true },
      );

      // Navigate back to order detail
      navigate(`/order-detail/${orderId}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update order items. Please try again.",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ClipLoader size={40} color="#FF6B00" />
      </div>
    );
  }

  if (!order || !order.shopOrders?.[0]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const shopOrder = order.shopOrders[0];
  const customer = order.user;

  // Allow editing if order is pending or preparing
  if (shopOrder.status !== "pending" && shopOrder.status !== "preparing") {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <IoIosArrowRoundBack size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-extrabold text-gray-900">
              Edit Order Items
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <p className="text-gray-500 text-center">
            This order cannot be edited. Order status: {shopOrder.status}
          </p>
        </div>
      </div>
    );
  }

  const currentSubtotal = editedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = currentSubtotal;

  // Filter shop items for search
  const filteredShopItems = shopItems.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameThai?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full mr-2">
            <IoIosArrowRoundBack size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit Order Items</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Instruction */}
        <p className="text-sm text-primary-orange font-extrabold mb-4">
          Please call the customer before confirming the edit
        </p>

        {/* Customer Information */}
        <div className="mb-4 p-4 bg-white rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">Customer: </span>
            <span className="text-gray-900">
              {customer?.fullName || customer?.email || "Customer"}
            </span>
          </div>
          {customer?.mobile && (
            <div className="flex items-center gap-2">
              <MdPhone className="text-primary-orange" size={20} />
              <a
                href={`tel:${customer.mobile}`}
                className="text-primary-orange font-extrabold">
                {customer.mobile}
              </a>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="space-y-4 mb-4">
          {editedItems.map((item, index) => (
            <div
              key={item._id || index}
              className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    ฿{item.price.toFixed(2)} each
                  </p>
                  {/* Display selected options if available */}
                  {item.selectedOptions &&
                    Object.keys(item.selectedOptions).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(item.selectedOptions).map(
                          ([templateId, choices]) => {
                            if (!choices || typeof choices !== "object")
                              return null;
                            const selectedChoices = Object.entries(choices)
                              .filter(([_, isSelected]) => isSelected === true)
                              .map(([choiceName]) => choiceName);
                            if (selectedChoices.length === 0) return null;
                            return (
                              <p
                                key={templateId}
                                className="text-sm text-gray-600">
                                {selectedChoices.join(", ")}
                              </p>
                            );
                          },
                        )}
                      </div>
                    )}
                  {/* Display additional request if available */}
                  {item.specialInstructions && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <span className="text-base font-semibold text-gray-900 ml-4">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(index, item.quantity - 1)
                    }
                    disabled={item.quantity <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    -
                  </button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      handleQuantityChange(index, item.quantity + 1)
                    }
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                    +
                  </button>
                </div>
                {item.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 && (
                    <button
                      onClick={() => handleEditOptions(index)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100">
                      Edit Options
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Item Button */}
        <button
          onClick={() => setShowAddItemModal(true)}
          className="w-full py-3 mb-6 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100 transition-colors border border-orange-200">
          + Add New Item
        </button>

        {/* Summary */}
        <div className="mb-6 p-4 bg-white rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">฿{currentSubtotal.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-extrabold text-primary-orange">
                ฿{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={
              submitting ||
              editedItems.filter((i) => i.quantity > 0).length === 0
            }
            className="flex-1 py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-orange/20">
            {submitting ? (
              <>
                <ClipLoader size={20} color="white" />
                <span>Saving...</span>
              </>
            ) : (
              "Change"
            )}
          </button>
        </div>
      </div>

      {/* Edit Options Modal */}
      {showEditOptionsModal !== null && editingItemOptions !== null && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black bg-opacity-5 pointer-events-auto"
            onClick={handleSaveOptions}
          />
          <div className="absolute inset-x-0 bottom-0 pointer-events-auto">
            <div
              className="bg-white w-full rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Select Options
              </h2>
              {optionTemplates.map((template) => {
                const item = editedItems[editingItemOptions];
                const currentChoices =
                  item.selectedOptions?.[template._id] || {};
                return (
                  <div key={template._id} className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {template.name}
                    </h3>
                    <div className="space-y-2">
                      {template.choices?.map((choice) => (
                        <label
                          key={choice.name}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                          <input
                            type={
                              template.type === "single" ? "radio" : "checkbox"
                            }
                            name={
                              template.type === "single"
                                ? template._id
                                : undefined
                            }
                            checked={currentChoices[choice.name] === true}
                            onChange={(e) =>
                              handleOptionChange(
                                template._id,
                                choice.name,
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-primary-orange focus:ring-primary-orange/20"
                          />
                          <span className="flex-1 text-gray-900">
                            {choice.name}
                          </span>
                          {choice.price && (
                            <span className="text-sm text-gray-600">
                              {choice.price > 0
                                ? `+฿${choice.price}`
                                : `฿${choice.price}`}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={handleSaveOptions}
                className="w-full py-3 bg-primary-orange text-white rounded-2xl font-extrabold hover:bg-primary-orange/90 transition-colors shadow-lg shadow-primary-orange/20">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black bg-opacity-5 pointer-events-auto"
            onClick={() => {
              setShowAddItemModal(false);
              setSearchQuery("");
            }}
          />
          <div className="absolute inset-x-0 bottom-0 pointer-events-auto">
            <div
              className="bg-white w-full rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Select New Item
              </h2>

              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Q Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filteredShopItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No items found
                  </p>
                ) : (
                  filteredShopItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleAddNewItem(item)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-medium">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            ฿{item.price.toFixed(2)}
                          </span>
                          {item.isAvailable !== false && (
                            <span className="text-xs text-green-600">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditOrderItems;
