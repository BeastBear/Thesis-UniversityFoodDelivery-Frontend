import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle } from "react-icons/fa";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";

function AddCardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
    nickname: "",
    isDefault: true,
  });

  const [errors, setErrors] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  });

  const validateCardNumber = (value) => {
    const rawCardNumber = value.replace(/\s/g, "");
    if (rawCardNumber.length === 0) {
      return "";
    }
    if (rawCardNumber.length < 13 || rawCardNumber.length > 16) {
      return "Card number must be between 13 and 16 digits";
    }
    return "";
  };

  const validateExpiry = (value) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length !== 5) {
      return "Invalid expiry date format (MM/YY)";
    }
    const [month, year] = value.split("/");
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return "Invalid month (01-12)";
    }
    if (
      parseInt(year) < currentYear ||
      (parseInt(year) === currentYear && parseInt(month) < currentMonth)
    ) {
      return "Card has expired";
    }
    return "";
  };

  const validateCvv = (value) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length < 3) {
      return "CVV must be at least 3 digits";
    }
    return "";
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 16) value = value.slice(0, 16); // Limit to 16 digits

    // Add space every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setFormData({ ...formData, cardNumber: formatted });
    setErrors({ ...errors, cardNumber: validateCardNumber(formatted) });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 4) value = value.slice(0, 4); // Limit to 4 digits (MMYY)

    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setFormData({ ...formData, expiry: value });
    setErrors({ ...errors, expiry: validateExpiry(value) });
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 4) value = value.slice(0, 4); // Limit to 4 digits
    setFormData({ ...formData, cvv: value });
    setErrors({ ...errors, cvv: validateCvv(value) });
  };

  const handleCardholderNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, cardholderName: value });
    if (value.trim().length === 0) {
      setErrors({ ...errors, cardholderName: "Cardholder name is required" });
    } else {
      setErrors({ ...errors, cardholderName: "" });
    }
  };

  const handleSave = async () => {
    try {
      // Basic validation
      const rawCardNumber = formData.cardNumber.replace(/\s/g, "");
      if (rawCardNumber.length < 13 || rawCardNumber.length > 16) {
        toast.error("Invalid card number length");
        return;
      }

      if (formData.expiry.length !== 5) {
        toast.error("Invalid expiry date format (MM/YY)");
        return;
      }

      const [month, year] = formData.expiry.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        toast.error("Invalid month");
        return;
      }

      if (
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        toast.error("Card has expired");
        return;
      }

      if (formData.cvv.length < 3) {
        toast.error("Invalid CVV");
        return;
      }

      if (!formData.cardholderName) {
        toast.error("Please enter cardholder name");
        return;
      }

      const res = await axios.post(
        `${serverUrl}/api/user/add-card`,
        { ...formData, cardNumber: rawCardNumber },
        { withCredentials: true },
      );

      // Update Redux state
      const updatedUser = { ...userData, savedCards: res.data };
      dispatch(setUserData(updatedUser));

      toast.success("Card saved");

      navigate(-1);
    } catch (error) {
      const msg =
        error.response?.data?.message || error?.message || "Failed to add card";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Header */}
      <div className="flex-1 p-6 space-y-6 max-w-[600px] mx-auto w-full">
        {/* Card Number */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Card number
          </label>
          <input
            type="text"
            placeholder=".... .... .... ...."
            className={`w-full p-3 border rounded-lg outline-none transition-colors ${
              errors.cardNumber
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
            }`}
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19} // 16 digits + 3 spaces
          />
          {errors.cardNumber && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.cardNumber}
            </p>
          )}
        </div>

        {/* Expiry & CVV */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">Expiry</label>
            <div className="relative">
              <input
                type="text"
                placeholder="MM/YY"
                className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                  errors.expiry
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
                }`}
                value={formData.expiry}
                onChange={handleExpiryChange}
                maxLength={5}
              />
              <FaInfoCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.expiry && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.expiry}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">CVV</label>
            <div className="relative">
              <input
                type="text"
                placeholder="..."
                className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                  errors.cvv
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
                }`}
                value={formData.cvv}
                onChange={handleCvvChange}
                maxLength={4}
              />
              <FaInfoCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.cvv && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.cvv}</p>
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Cardholder name
          </label>
          <input
            type="text"
            placeholder="Enter cardholder name (EN)"
            className={`w-full p-3 border rounded-lg outline-none transition-colors ${
              errors.cardholderName
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
            }`}
            value={formData.cardholderName}
            onChange={handleCardholderNameChange}
          />
          {errors.cardholderName && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              {errors.cardholderName}
            </p>
          )}
        </div>

        {/* Card Nickname */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Card nickname (optional)
          </label>
          <input
            type="text"
            placeholder="Enter card nickname"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-colors"
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
          />
        </div>

        {/* Default Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-700 font-medium">
            Set as a default payment
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-orange"></div>
          </label>
        </div>

        {/* Disclaimer */}
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/95 backdrop-blur z-40">
        <button
          className="w-full bg-primary-orange text-white font-extrabold py-3 rounded-2xl hover:bg-primary-orange/90 transition-colors"
          onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export default AddCardPage;
