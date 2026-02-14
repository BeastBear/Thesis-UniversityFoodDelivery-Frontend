import { toast } from "react-toastify";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { addToCart } from "../redux/userSlice";

import { serverUrl } from "../App";
import {
  FaMinus,
  FaPlus,
  FaChevronLeft,
  FaUtensils,
  FaExclamationCircle,
} from "react-icons/fa";
import { checkBusinessHours } from "../utils/checkBusinessHours";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useHeaderTitle } from "../context/UIContext.jsx";

function ItemDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [specialRequest, setSpecialRequest] = useState("");
  const [shopOpen, setShopOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.user);

  useHeaderTitle(item?.name, { loading, loadingText: "Loading..." });

  const isValidObjectId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

  // Check if item is already in cart to maybe initialize state (optional, usually start fresh)
  const existingCartItem = cartItems.find(
    (cartItem) =>
      cartItem.id === itemId &&
      JSON.stringify(cartItem.selectedOptions) ===
        JSON.stringify(selectedOptions),
  );

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setLoadError("");

      if (!isValidObjectId(itemId)) {
        const msg = "Item not available";
        toast.error(msg);
        setLoadError(msg);
        setItem(null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${serverUrl}/api/item/get-by-id/${itemId}`,
          {
            withCredentials: true,
          },
        );
        const fetchedItem = response.data;
        setItem(fetchedItem);
        setTotalPrice(fetchedItem.price);

        const shopId = fetchedItem?.shop?._id || fetchedItem?.shop;
        if (shopId) {
          const shopRes = await axios.get(
            `${serverUrl}/api/shop/get-by-id/${shopId}`,
            { withCredentials: true },
          );
          if (shopRes.data?.businessHours) {
            const status = checkBusinessHours(
              shopRes.data.businessHours,
              shopRes.data.temporaryClosure,
            );
            setShopOpen(status.isOpen);
          }
        }
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load item";
        toast.error(msg);
        setLoadError(msg);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  useEffect(() => {
    if (!item) return;

    let optionsPrice = 0;
    Object.values(selectedOptions).forEach((option) => {
      if (Array.isArray(option)) {
        option.forEach((opt) => (optionsPrice += opt.price || 0));
      } else {
        optionsPrice += option.price || 0;
      }
    });
    setTotalPrice((item.price + optionsPrice) * quantity);
  }, [selectedOptions, quantity, item]);

  const optionSectionsForRender = useMemo(() => {
    if (Array.isArray(item?.optionSections) && item.optionSections.length > 0) {
      return item.optionSections;
    }

    if (
      Array.isArray(item?.selectedOptionTemplates) &&
      item.selectedOptionTemplates.length > 0
    ) {
      return item.selectedOptionTemplates.filter(Boolean).map((t) => {
        const name = t.nameEnglish || t.nameThai || t.name || "Options";
        const options = (t.choices || [])
          .filter((c) => c && c.isAvailable !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((c) => {
            const base = Number(c.price || 0);
            const signedPrice = c.priceType === "decrease" ? -base : base; // increase/noChange => +base
            return {
              name: c.name,
              price: signedPrice,
            };
          });

        return {
          sectionName: name,
          type: t.isMultiple ? "multiple" : "single",
          required: !!t.isRequired,
          options,
        };
      });
    }

    return [];
  }, [item]);

  const handleOptionChange = (
    templateId,
    choiceName,
    isMultiple,
    isRequired,
    price,
  ) => {
    setSelectedOptions((prev) => {
      const currentSelection = prev[templateId];

      if (isMultiple) {
        // Checkbox logic
        const currentArray = Array.isArray(currentSelection)
          ? currentSelection
          : [];
        const exists = currentArray.find((c) => c.name === choiceName);

        let newArray;
        if (exists) {
          newArray = currentArray.filter((c) => c.name !== choiceName);
        } else {
          newArray = [...currentArray, { name: choiceName, price }];
        }
        return { ...prev, [templateId]: newArray };
      } else {
        // Radio logic
        return { ...prev, [templateId]: { name: choiceName, price } };
      }
    });
  };

  const calculateOptionsPrice = () => {
    let price = 0;
    Object.values(selectedOptions).forEach((option) => {
      if (Array.isArray(option)) {
        option.forEach((opt) => (price += opt.price || 0));
      } else {
        price += option.price || 0;
      }
    });
    return price;
  };

  const handleAddToCart = () => {
    if (!item) return;

    // Validation for required options
    if (
      Array.isArray(optionSectionsForRender) &&
      optionSectionsForRender.length > 0
    ) {
      for (const section of optionSectionsForRender) {
        if (section?.required) {
          const key = section.sectionName;
          const selection = selectedOptions[key];
          if (
            !selection ||
            (Array.isArray(selection) && selection.length === 0)
          ) {
            toast.warn(`Please select an option for ${section.sectionName}`);
            const element = document.getElementById(`option-${key}`);
            if (element) element.scrollIntoView({ behavior: "smooth" });
            return;
          }
        }
      }
    } else if (item.optionTemplates) {
      for (const template of item.optionTemplates) {
        if (template.required) {
          const selection = selectedOptions[template._id];
          if (
            !selection ||
            (Array.isArray(selection) && selection.length === 0)
          ) {
            toast.warn(`Please select an option for ${template.name}`);
            const element = document.getElementById(`option-${template._id}`);
            if (element) element.scrollIntoView({ behavior: "smooth" });
            return;
          }
        }
      }
    }

    const itemToAdd = {
      id: item._id,
      name: item.name,
      price: item.price + calculateOptionsPrice(),
      quantity,
      image: item.image,
      shop: item.shop,
      selectedOptions,
      specialRequest,
    };
    dispatch(addToCart(itemToAdd));
    navigate(-1);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );

  if (!item)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <Card className="w-full max-w-md p-6">
          <EmptyState
            icon={
              <FaExclamationCircle className="text-primary-orange text-2xl" />
            }
            title="Item not available"
            description={
              loadError || "We couldn't load this item. Please try again."
            }
            className="pt-0"
          />
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors border-none shadow-sm">
              Go back
            </button>
            <PrimaryButton
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl shadow-none hover:-translate-y-0 active:translate-y-0">
              Retry
            </PrimaryButton>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-white pb-36 sm:pb-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* 1. Header Image */}
          <div className="relative h-72 sm:h-80 md:h-96 bg-gray-100 overflow-hidden rounded-3xl shadow-xl">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>

          {/* 2. Item Info */}
          <Card className="p-6 sm:p-8 border border-gray-100/70 shadow-sm">
            <div className="flex justify-between gap-4 items-start mb-3">
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight flex-1">
                {item.name}
              </h1>
              <span className="text-2xl font-bold text-primary-orange whitespace-nowrap">
                ฿{item.price}
              </span>
            </div>
            <p className="text-gray-500 text-base leading-relaxed">
              {item.description}
            </p>
          </Card>

          {/* 3. Options */}
          <div className="flex flex-col gap-6">
            {Array.isArray(optionSectionsForRender) &&
            optionSectionsForRender.length > 0
              ? optionSectionsForRender.map((section) => {
                  const key = section.sectionName;
                  const isMultiple = section.type === "multiple";
                  const required = !!section.required;
                  const isSweetLevelSection = key
                    ?.toLowerCase()
                    .includes("sweet");

                  return (
                    <Card
                      key={key}
                      id={`option-${key}`}
                      className="rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {section.sectionName}
                          </h3>
                          {required ? (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={
                          isSweetLevelSection
                            ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                            : "flex flex-col gap-3"
                        }>
                        {(section.options || []).map((choice) => {
                          const isSelected = Array.isArray(selectedOptions[key])
                            ? selectedOptions[key].some(
                                (c) => c.name === choice.name,
                              )
                            : selectedOptions[key]?.name === choice.name;
                          const optionLayoutClass = isSweetLevelSection
                            ? "flex flex-col gap-3"
                            : "flex items-center justify-between";

                          return (
                            <label
                              key={choice.name}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm h-full ${optionLayoutClass} ${
                                isSelected
                                  ? "border-primary-orange bg-orange-50/60"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              }`}>
                              <div className="flex items-center gap-3">
                                {isMultiple ? (
                                  <div
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "bg-primary-orange border-primary-orange"
                                        : "border-none shadow-sm bg-white"
                                    }`}>
                                    {isSelected && (
                                      <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "border-primary-orange"
                                        : "border-none shadow-sm bg-white"
                                    }`}>
                                    {isSelected && (
                                      <div className="w-2.5 h-2.5 bg-primary-orange rounded-full" />
                                    )}
                                  </div>
                                )}
                                <span
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-gray-900"
                                      : "text-gray-600"
                                  }`}>
                                  {choice.name}
                                </span>
                              </div>
                              {choice.price !== 0 && !isSweetLevelSection && (
                                <span className="text-sm font-bold text-gray-800">
                                  {choice.price > 0 ? "+" : "-"}฿
                                  {Math.abs(choice.price)}
                                </span>
                              )}
                              {choice.price !== 0 && isSweetLevelSection && (
                                <span className="text-sm font-semibold text-gray-700">
                                  {choice.price > 0 ? "+" : "-"}฿
                                  {Math.abs(choice.price)}
                                </span>
                              )}

                              <input
                                type="checkbox"
                                className="hidden"
                                onChange={() =>
                                  handleOptionChange(
                                    key,
                                    choice.name,
                                    isMultiple,
                                    required,
                                    choice.price,
                                  )
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })
              : item.optionTemplates?.map((template) => (
                  <Card
                    key={template._id}
                    id={`option-${template._id}`}
                    className="rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {template.name}
                        </h3>
                        {template.required ? (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {template.choices.map((choice) => {
                        const isSelected = Array.isArray(
                          selectedOptions[template._id],
                        )
                          ? selectedOptions[template._id].some(
                              (c) => c.name === choice.name,
                            )
                          : selectedOptions[template._id]?.name === choice.name;

                        return (
                          <label
                            key={choice.name}
                            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary-orange bg-orange-50/50"
                                : "border-gray-100 hover:bg-white"
                            }`}>
                            <div className="flex items-center gap-3">
                              {template.allowMultiple ? (
                                <div
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "bg-primary-orange border-primary-orange"
                                      : "border-gray-300 bg-white"
                                  }`}>
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                                  )}
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "border-primary-orange"
                                      : "border-gray-300 bg-white"
                                  }`}>
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 bg-primary-orange rounded-full" />
                                  )}
                                </div>
                              )}
                              <span
                                className={`font-medium ${
                                  isSelected ? "text-gray-900" : "text-gray-600"
                                }`}>
                                {choice.name}
                              </span>
                            </div>
                            {choice.price > 0 && (
                              <span className="text-sm font-bold text-gray-800">
                                +฿{choice.price}
                              </span>
                            )}

                            <input
                              type="checkbox"
                              className="hidden"
                              onChange={() =>
                                handleOptionChange(
                                  template._id,
                                  choice.name,
                                  template.allowMultiple,
                                  template.required,
                                  choice.price,
                                )
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                  </Card>
                ))}

            {/* Special Request */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <FaUtensils className="text-gray-400" size={16} /> Special
                Instructions
              </h3>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="E.g. No spicy, less sugar..."
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all resize-none"
                rows="3"></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Sticky Bar */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] z-60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Quantity */}
          <div className="flex items-center justify-between gap-4 bg-gray-100 rounded-2xl p-2 w-full sm:w-auto">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-gray-800 shadow-sm hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
              disabled={quantity <= 1}>
              <FaMinus size={12} />
            </button>
            <span className="font-bold text-xl min-w-[32px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-gray-800 shadow-sm hover:scale-105 transition-transform active:scale-95">
              <FaPlus size={12} />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={!shopOpen}
            className="w-full sm:flex-1 bg-primary-orange text-white font-bold h-[60px] rounded-2xl flex justify-between items-center px-6 shadow-lg shadow-primary-orange/30 hover:bg-primary-orange/90 transition-all disabled:bg-gray-400 disabled:shadow-none">
            {shopOpen ? (
              <>
                <span>Add to Basket</span>
                <span>฿{totalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="w-full text-center">Restaurant Closed</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
