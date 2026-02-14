import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";

function OrderSetting() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [autoAccept, setAutoAccept] = useState(false);

  // Load auto accept setting from localStorage, default to true for first time
  useEffect(() => {
    const savedAutoAccept = localStorage.getItem("autoAcceptOrders");
    if (savedAutoAccept === null) {
      // First time - default to true
      setAutoAccept(true);
      localStorage.setItem("autoAcceptOrders", "true");
    } else {
      setAutoAccept(savedAutoAccept === "true");
    }
  }, []);

  // Save auto accept setting to localStorage
  const handleToggleAutoAccept = (value) => {
    setAutoAccept(value);
    localStorage.setItem("autoAcceptOrders", value.toString());
  };

  // Only allow owners to access this page
  if (userData?.role !== "owner") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Settings Cards */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Auto Accept Card */}
        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-gray-900 mb-1">
              Auto Accept
            </h3>
            <p className="text-sm text-gray-500">
              Automatically accept incoming orders
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoAccept}
              onChange={(e) => handleToggleAutoAccept(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green)"></div>
          </label>
        </Card>
      </div>
    </div>
  );
}

export default OrderSetting;
