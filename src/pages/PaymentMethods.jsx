import React, { useState } from "react";
import { IoIosArrowRoundBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaCreditCard,
  FaCcVisa,
  FaCcMastercard,
  FaQrcode,
  FaTrash,
  FaMoneyBillWave,
  FaChevronRight,
  FaCheckCircle,
} from "react-icons/fa";
import { MdDeliveryDining, MdAttachMoney } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useHeaderTitle } from "../context/UIContext.jsx";

function PaymentMethods() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useHeaderTitle("Payment Methods");

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
  });

  // Use cards from Redux/Backend
  const cards = userData?.savedCards || [];

  const handleSetDefault = async (card) => {
    // If this card is already default AND 'card' is already the default method, do nothing.
    if (card.isDefault && userData?.defaultPaymentMethod === "card") return;

    setConfirmState({
      open: true,
      title: "Set primary payment",
      message: `Set ${card.cardType} •••• ${card.last4} as your primary payment method?`,
      confirmText: "Set as primary",
      cancelText: "Cancel",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          const res = await axios.put(
            `${serverUrl}/api/user/set-default-card/${card._id}`,
            {},
            { withCredentials: true },
          );
          // Backend now updates defaultPaymentMethod to 'card' as well
          const updatedUser = {
            ...userData,
            savedCards: res.data,
            defaultPaymentMethod: "card",
          };
          dispatch(setUserData(updatedUser));
          toast.success("Primary payment method updated");
        } catch (error) {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update primary payment method";
          toast.error(msg);
        }
      },
    });
  };

  const handleSetDefaultCardRequest = (card) => {
    handleSetDefault(card);
  };

  const handleSetDefaultPaymentMethodRequest = (method) => {
    if (userData.defaultPaymentMethod === method) return;

    const label =
      method === "cod" ? "Cash" : method === "promptpay" ? "QR Code" : method;

    setConfirmState({
      open: true,
      title: "Set primary payment",
      message: `Set ${label} as your primary payment method?`,
      confirmText: "Set as primary",
      cancelText: "Cancel",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          const res = await axios.put(
            `${serverUrl}/api/user/set-default-payment-method`,
            { method },
            { withCredentials: true },
          );

          const updatedUser = {
            ...userData,
            defaultPaymentMethod: res.data.defaultPaymentMethod,
          };

          dispatch(setUserData(updatedUser));
          toast.success("Primary payment method updated");
        } catch (error) {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update primary payment method";
          toast.error(msg);
        }
      },
    });
  };

  const handleDeleteCardRequest = (cardId) => {
    setConfirmState({
      open: true,
      title: "Delete card",
      message: "Are you sure you want to delete this card?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          const res = await axios.delete(
            `${serverUrl}/api/user/delete-card/${cardId}`,
            { withCredentials: true },
          );
          const updatedUser = { ...userData, savedCards: res.data };
          dispatch(setUserData(updatedUser));
          toast.success("Card deleted");
        } catch (error) {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to delete card";
          toast.error(msg);
        }
      },
    });
  };
  const handleDeleteCard = (e, cardId) => {
    e.stopPropagation();
    handleDeleteCardRequest(cardId);
  };

  const getCardIcon = (type) => {
    switch (type) {
      case "visa":
        return <FaCcVisa size={24} className="text-[#1A1F71]" />;
      case "mastercard":
        return <FaCcMastercard size={24} className="text-[#EB001B]" />;
      default:
        return <FaCreditCard size={24} className="text-gray-500" />;
    }
  };

  const PaymentItem = ({
    icon,
    label,
    subLabel,
    onClick,
    isHeader = false,
    isActive = false,
  }) => (
    <div
      className={`flex items-center justify-between p-4 bg-white cursor-pointer transition-all border-b border-gray-100 last:border-0 ${
        isActive ? "bg-orange-50/50" : ""
      }`}
      onClick={onClick}>
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isActive ? "bg-white shadow-sm" : "bg-white"
          }`}>
          {icon}
        </div>
        <div>
          <span
            className={`block font-bold text-sm ${
              isActive ? "text-primary-orange" : "text-gray-800"
            }`}>
            {label}
          </span>
          {subLabel && (
            <span className="text-xs text-gray-500">{subLabel}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isActive && (
          <FaCheckCircle className="text-primary-orange" size={18} />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-10">
        {/* Credit/Debit Card Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
            <FaCreditCard className="text-primary-orange" /> Credit / Debit
            cards
          </h2>
          <div className="rounded-2xl overflow-hidden border border-gray-100">
            {cards.map((card) => (
              <div
                key={card._id}
                className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-0 cursor-pointer transition-all ${
                  card.isDefault && userData?.defaultPaymentMethod === "card"
                    ? "bg-orange-50/30"
                    : ""
                }`}
                onClick={() => handleSetDefault(card)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    {getCardIcon(card.cardType)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-bold capitalize text-sm">
                      {card.cardType} •••• {card.last4}
                    </span>
                    <span className="text-xs text-gray-500">
                      Expires {card.expiryDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {card.isDefault &&
                    userData?.defaultPaymentMethod === "card" && (
                      <FaCheckCircle className="text-primary-orange" />
                    )}
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    onClick={(e) => handleDeleteCard(e, card._id)}>
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Card Button */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer text-gray-600 transition-colors border-t border-gray-100"
              onClick={() => navigate("/add-card")}>
              <div className="w-10 h-10 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <FaPlus size={14} />
              </div>
              <span className="font-bold text-sm">Add New Card</span>
            </div>
          </div>
        </div>

        {/* Other Methods */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
            <FaMoneyBillWave className="text-primary-orange" /> Other Methods
          </h2>
          <div className="rounded-2xl overflow-hidden border border-gray-100">
            <PaymentItem
              icon={<FaQrcode size={20} className="text-blue-600" />}
              label="QR PromptPay"
              subLabel="Scan to pay instantly"
              onClick={() => handleSetDefaultPaymentMethodRequest("promptpay")}
              isActive={userData?.defaultPaymentMethod === "promptpay"}
            />
            <PaymentItem
              icon={<MdAttachMoney size={24} className="text-green-600" />}
              label="Cash on Delivery"
              subLabel="Pay when you receive your order"
              onClick={() => handleSetDefaultPaymentMethodRequest("cod")}
              isActive={userData?.defaultPaymentMethod === "cod"}
            />
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <p className="text-xs text-center text-gray-400 max-w-xs">
            Payments are secured with 256-bit encryption. Your card details are
            stored securely.
          </p>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setConfirmState((prev) => ({ ...prev, open: false }))
            }
          />
          <Card className="relative w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-gray-900">
                {confirmState.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {confirmState.message}
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmState((prev) => ({ ...prev, open: false }))
                }
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors">
                {confirmState.cancelText}
              </button>
              {confirmState.confirmText === "Delete" ? (
                <button
                  type="button"
                  onClick={() =>
                    confirmState.onConfirm && confirmState.onConfirm()
                  }
                  className="flex-1 py-3 rounded-2xl text-white font-bold transition-colors bg-red-500 hover:bg-red-600">
                  {confirmState.confirmText}
                </button>
              ) : (
                <PrimaryButton
                  type="button"
                  onClick={() =>
                    confirmState.onConfirm && confirmState.onConfirm()
                  }
                  className="flex-1 py-3 rounded-2xl shadow-none hover:translate-y-0 active:translate-y-0">
                  {confirmState.confirmText}
                </PrimaryButton>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PaymentMethods;
